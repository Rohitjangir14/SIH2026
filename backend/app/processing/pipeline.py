import time
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.job import ProcessingJob
from app.models.raw_log import RawLog
from app.models.processed_log import ProcessedLog
from app.models.validation_error import ValidationErrorRecord
from app.parsers.registry import parser_registry
from app.parsers.base import BaseParser
from app.detection.format_detector import format_detector
from app.processing.cleaner import data_cleaner
from app.processing.normalizer import log_normalizer
from app.processing.enricher import log_enricher
from app.processing.validator import log_validator
from app.core.config import settings
from app.schemas.universal_log import UniversalLogSchema


class ProcessingPipeline:
    """
    End-to-end Processing Pipeline for ULPF.
    Orchestrates: Ingestion -> Raw Store -> Format Detect -> Parse -> Clean ->
    Normalize -> Enrich -> Validate -> Processed/Error Store.
    """

    def _extract_records(
        self,
        raw_content: str,
        detected_format: str,
    ) -> Tuple[List[str], str]:
        """
        Extracts individual log records from raw content.
        Robustly handles:
        - Pretty-printed JSON arrays ([ {...}, {...} ])
        - Single multi-line pretty-printed JSON objects ({ ... })
        - Newline-Delimited JSON (NDJSON)
        - Streaming / concatenated JSON objects
        - Line-oriented formats (Syslog, Apache, Nginx, CSV, Windows, Custom)
        """
        content_stripped = raw_content.strip()
        if not content_stripped:
            return [], detected_format

        # 1. If format is detected as JSON or content strongly looks like JSON structure
        if detected_format == "json" or content_stripped.startswith(("[", "{")):
            # Case A: Full JSON parse (Array or single Object)
            try:
                parsed_json = json.loads(content_stripped)
                if isinstance(parsed_json, list):
                    records = [
                        json.dumps(item) if isinstance(item, (dict, list)) else str(item)
                        for item in parsed_json
                    ]
                    return records, "json"
                elif isinstance(parsed_json, dict):
                    return [json.dumps(parsed_json)], "json"
            except Exception:
                pass

            # Case B: Streaming JSON decode (for multi-object or truncated/formatted streams)
            try:
                records = []
                decoder = json.JSONDecoder()
                s = content_stripped
                if s.startswith("["):
                    s = s[1:].strip()
                idx = 0
                while idx < len(s):
                    while idx < len(s) and s[idx] in " \t\r\n,]":
                        idx += 1
                    if idx >= len(s):
                        break
                    obj, end_idx = decoder.raw_decode(s, idx)
                    records.append(json.dumps(obj) if isinstance(obj, (dict, list)) else str(obj))
                    idx = end_idx
                if records:
                    return records, "json"
            except Exception:
                pass

            # Case C: Check NDJSON line-by-line
            ndjson_records = []
            non_empty_lines = [l.strip() for l in raw_content.splitlines() if l.strip()]
            for line in non_empty_lines:
                try:
                    obj = json.loads(line)
                    if isinstance(obj, dict):
                        ndjson_records.append(json.dumps(obj))
                except Exception:
                    pass
            if ndjson_records and len(ndjson_records) >= max(1, len(non_empty_lines) * 0.5):
                return ndjson_records, "json"

        # 2. Line-oriented splitting fallback
        lines = [line.strip() for line in raw_content.splitlines() if line.strip()]
        return lines, detected_format

    async def execute(
        self,
        db: AsyncSession,
        raw_content: str,
        source_name: str = "generic_source",
        file_name: Optional[str] = None,
        forced_format: Optional[str] = None,
        job_id: Optional[str] = None,
        mask_data: Optional[bool] = None,
        pseudonymize: Optional[bool] = None,
    ) -> ProcessingJob:
        start_time = time.time()
        
        # 1. Initialize or find Job
        if job_id:
            result = await db.execute(select(ProcessingJob).filter(ProcessingJob.id == job_id))
            job = result.scalars().first()
        else:
            job = ProcessingJob(
                source=source_name,
                file_name=file_name,
                status="PROCESSING",
                started_at=datetime.now(timezone.utc),
            )
            db.add(job)
            await db.flush()

        # 2. Format Detection (Performed on full or generous sample)
        if forced_format and forced_format != "auto":
            detected_format = forced_format
            parser = parser_registry.get(forced_format) or parser_registry.get("regex")
            detection_reason = f"Forced format selection: {forced_format}"
        else:
            sample_for_detect = raw_content[:8000]
            detection_resp = format_detector.detect(sample_for_detect, filename=file_name)
            detected_format = detection_resp.detected_format
            parser = parser_registry.get(detected_format) or parser_registry.get("regex")
            detection_reason = detection_resp.reason

        # 3. Semantic Record Extraction (Supports pretty JSON arrays, single JSON objects, NDJSON, and lines)
        lines, final_format = self._extract_records(raw_content, detected_format)
        if final_format != detected_format:
            detected_format = final_format
            parser = parser_registry.get(detected_format) or parser_registry.get("regex")

        job.detected_format = detected_format
        job.parser_used = parser.name if parser else "Generic Regex Parser"
        job.total_records = len(lines)

        if job.total_records == 0:
            job.status = "COMPLETED"
            job.completed_at = datetime.now(timezone.utc)
            job.duration_ms = (time.time() - start_time) * 1000
            await db.commit()
            return job

        # Check if CSV parser needs header detection
        if detected_format == "csv" and lines:
            header_line = lines[0]
            if any(col in header_line.lower() for col in ["time", "level", "message", "severity", "user"]):
                headers = [h.strip() for h in header_line.split(",")]
                from app.parsers.csv_parser import CSVParser
                csv_p = CSVParser(headers=headers)
                parser = csv_p
                # Skip header from data rows
                lines = lines[1:]
                job.total_records = len(lines)

        processed_count = 0
        failed_count = 0
        effective_masking = settings.ENABLE_DATA_MASKING if mask_data is None else mask_data

        # 4. Process Each Record (Chunked Flush for Enterprise Throughput)
        BATCH_CHUNK_SIZE = 250
        for idx, line in enumerate(lines, 1):
            raw_id = str(uuid.uuid4())
            raw_record = RawLog(
                id=raw_id,
                source_id=source_name,
                job_id=job.id,
                file_name=file_name,
                source_type=detected_format,
                raw_content=line,
                processing_status="PENDING",
            )
            db.add(raw_record)

            try:
                # Stage 4: Parse Raw Log
                parsed_fields = parser.parse(line)

                # Stage 5: Clean and Mask Sensitive Data (Honors configuration)
                cleaned_fields = data_cleaner.clean_record(parsed_fields, mask_data=effective_masking)
                if pseudonymize or (pseudonymize is None and settings.ENABLE_SALTED_PSEUDONYMIZATION):
                    cleaned_fields["_pseudonymize"] = True

                # Stage 6: Normalize into Universal Log Schema
                normalized_schema = log_normalizer.normalize_record(
                    cleaned_dict=cleaned_fields,
                    source_type=detected_format,
                    source_name=source_name,
                    record_id=str(uuid.uuid4()),
                )

                # Stage 7: Enrich Log
                enriched_schema = log_enricher.enrich(normalized_schema)

                # Stage 8: Validate Schema Record
                is_valid, validation_errors = log_validator.validate(enriched_schema)

                # Stage 9: Store Normalized Output
                processed_record = ProcessedLog(
                    id=enriched_schema.id,
                    raw_log_id=raw_id,
                    job_id=job.id,
                    timestamp=enriched_schema.timestamp,
                    severity=enriched_schema.severity.value,
                    event_type=enriched_schema.event_type,
                    message=enriched_schema.message,
                    host=enriched_schema.host,
                    user=enriched_schema.user,
                    ip_address=enriched_schema.ip_address,
                    application=enriched_schema.application,
                    environment=enriched_schema.environment,
                    source_type=enriched_schema.source.type,
                    source_name=enriched_schema.source.name,
                    metadata_json=enriched_schema.metadata,
                    is_valid=is_valid,
                )
                db.add(processed_record)

                if is_valid:
                    raw_record.processing_status = "PROCESSED"
                    processed_count += 1
                else:
                    raw_record.processing_status = "INVALID"
                    failed_count += 1
                    # Store validation error details
                    val_err = ValidationErrorRecord(
                        raw_log_id=raw_id,
                        job_id=job.id,
                        raw_content=line,
                        error_type="SCHEMA_VALIDATION_ERROR",
                        error_details={"errors": validation_errors},
                    )
                    db.add(val_err)

            except Exception as ex:
                # Unparseable or unexpected failure on single line
                raw_record.processing_status = "FAILED"
                failed_count += 1
                val_err = ValidationErrorRecord(
                    raw_log_id=raw_id,
                    job_id=job.id,
                    raw_content=line,
                    error_type="PARSE_ERROR",
                    error_details={"exception": str(ex), "parser": parser.name if parser else "None"},
                )
                db.add(val_err)

            # Flush every 250 records to prevent holding excessive uncommitted buffers
            if idx % BATCH_CHUNK_SIZE == 0:
                await db.flush()

        # 4. Finalize Job Status
        job.processed_records = processed_count
        job.failed_records = failed_count
        if failed_count == 0:
            job.status = "COMPLETED"
        elif processed_count > 0:
            job.status = "PARTIAL"
        else:
            job.status = "FAILED"

        job.completed_at = datetime.now(timezone.utc)
        job.duration_ms = round((time.time() - start_time) * 1000, 2)

        await db.commit()
        await db.refresh(job)
        return job


pipeline_runner = ProcessingPipeline()
