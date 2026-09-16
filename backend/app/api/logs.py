import io
import csv
import json
from typing import List, Optional, Union, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc, func

from app.core.database import get_db
from app.detection.format_detector import format_detector
from app.schemas.detection import DetectionResponse
from app.schemas.universal_log import ProcessedLogResponse
from app.schemas.job import JobResponse
from app.models.processed_log import ProcessedLog
from app.models.raw_log import RawLog
from app.models.job import ProcessingJob
from app.models.user import User
from app.api.auth import get_current_user, require_analyst, require_admin
from app.processing.pipeline import pipeline_runner

router = APIRouter(prefix="/logs", tags=["Logs & Ingestion"])


@router.post("/detect", response_model=DetectionResponse)
async def detect_format(
    sample_content: str = Form(...),
    filename: Optional[str] = Form(None),
):
    """
    Analyzes sample log lines and returns detected format, recommended parser,
    confidence score, and detection rationale.
    """
    return format_detector.detect(sample_content, filename=filename)


@router.post("/upload", response_model=JobResponse)
async def upload_log_file(
    file: UploadFile = File(...),
    source_name: str = Form("file_upload"),
    forced_format: Optional[str] = Form("auto"),
    mask_data: Optional[bool] = Form(None),
    pseudonymize: Optional[bool] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Uploads a log file (.log, .txt, .json, .csv) and executes the end-to-end preprocessing pipeline.
    """
    try:
        content_bytes = await file.read()
        content_text = content_bytes.decode("utf-8", errors="replace")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")

    job = await pipeline_runner.execute(
        db=db,
        raw_content=content_text,
        source_name=source_name,
        file_name=file.filename,
        forced_format=forced_format if forced_format != "auto" else None,
        mask_data=mask_data,
        pseudonymize=pseudonymize,
    )

    success_rate = round((job.processed_records / job.total_records * 100) if job.total_records > 0 else 0.0, 2)
    return JobResponse(
        id=job.id,
        source=job.source,
        file_name=job.file_name,
        detected_format=job.detected_format,
        parser_used=job.parser_used,
        total_records=job.total_records,
        processed_records=job.processed_records,
        failed_records=job.failed_records,
        status=job.status,
        started_at=job.started_at,
        completed_at=job.completed_at,
        duration_ms=job.duration_ms,
        error_message=job.error_message,
        success_rate=success_rate,
    )


class PasteLogRequest:
    pass


@router.post("/paste", response_model=JobResponse)
async def paste_log_text(
    raw_content: str = Form(...),
    source_name: str = Form("manual_paste"),
    forced_format: Optional[str] = Form("auto"),
    mask_data: Optional[bool] = Form(None),
    pseudonymize: Optional[bool] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Directly pastes raw log text to process immediately through the pipeline.
    """
    if not raw_content.strip():
        raise HTTPException(status_code=400, detail="Log content cannot be empty")

    job = await pipeline_runner.execute(
        db=db,
        raw_content=raw_content,
        source_name=source_name,
        file_name="pasted_input.log",
        forced_format=forced_format if forced_format != "auto" else None,
        mask_data=mask_data,
        pseudonymize=pseudonymize,
    )

    success_rate = round((job.processed_records / job.total_records * 100) if job.total_records > 0 else 0.0, 2)
    return JobResponse(
        id=job.id,
        source=job.source,
        file_name=job.file_name,
        detected_format=job.detected_format,
        parser_used=job.parser_used,
        total_records=job.total_records,
        processed_records=job.processed_records,
        failed_records=job.failed_records,
        status=job.status,
        started_at=job.started_at,
        completed_at=job.completed_at,
        duration_ms=job.duration_ms,
        error_message=job.error_message,
        success_rate=success_rate,
    )


@router.get("", response_model=Union[List[ProcessedLogResponse], List[Dict[str, Any]]])
async def list_logs(
    query: Optional[str] = Query(None, description="Search keyword in message, user, or host"),
    severity: Optional[str] = Query(None, description="Filter by severity level"),
    source_type: Optional[str] = Query(None, description="Filter by source format e.g. apache, syslog"),
    source_name: Optional[str] = Query(None, description="Filter by source identifier"),
    host: Optional[str] = Query(None, description="Filter by host"),
    ip_address: Optional[str] = Query(None, description="Filter by IP"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    schema_format: str = Query("flat", description="Schema format: 'flat' or 'ocsf'"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Searches and filters normalized Universal Logs with pagination and RBAC raw protection.
    """
    stmt = select(ProcessedLog).order_by(desc(ProcessedLog.timestamp))

    filters = []
    if query:
        q_term = f"%{query}%"
        filters.append(
            or_(
                ProcessedLog.message.ilike(q_term),
                ProcessedLog.user.ilike(q_term),
                ProcessedLog.host.ilike(q_term),
                ProcessedLog.ip_address.ilike(q_term),
            )
        )
    if severity and severity.upper() != "ALL":
        filters.append(ProcessedLog.severity == severity.upper())
    if source_type and source_type.lower() != "all":
        filters.append(ProcessedLog.source_type == source_type.lower())
    if source_name:
        filters.append(ProcessedLog.source_name == source_name)
    if host:
        filters.append(ProcessedLog.host == host)
    if ip_address:
        filters.append(ProcessedLog.ip_address == ip_address)
    if event_type:
        filters.append(ProcessedLog.event_type == event_type)

    if filters:
        stmt = stmt.filter(and_(*filters))

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    result = await db.execute(stmt)
    records = result.scalars().all()

    can_view_raw = current_user.role in ("admin", "analyst")
    response_list = []
    for r in records:
        raw_text = None
        if r.raw_log_id:
            if can_view_raw:
                raw_res = await db.execute(select(RawLog.raw_content).filter(RawLog.id == r.raw_log_id))
                raw_text = raw_res.scalar_one_or_none()
            else:
                raw_text = "[REDACTED - SENSITIVE FORENSIC RAW CONTENT REQUIRES ANALYST OR ADMIN ROLE]"

        if schema_format.lower() == "ocsf":
            response_list.append({
                "version": "1.1.0",
                "class_uid": 1001,
                "category_uid": 1,
                "class_name": "system_activity",
                "time": r.timestamp.isoformat(),
                "severity": r.severity,
                "message": r.message,
                "metadata": {
                    "id": r.id,
                    "product": {"name": "ULPF", "version": "1.0.0"},
                    "source": {"type": r.source_type, "name": r.source_name},
                    **(r.metadata_json or {}),
                },
                "src_endpoint": {"ip": r.ip_address} if r.ip_address else None,
                "actor": {"user": {"name": r.user}} if r.user else None,
                "device": {"hostname": r.host} if r.host else None,
            })
        else:
            response_list.append(
                ProcessedLogResponse(
                    id=r.id,
                    raw_log_id=r.raw_log_id,
                    job_id=r.job_id,
                    timestamp=r.timestamp,
                    severity=r.severity,
                    event_type=r.event_type,
                    message=r.message,
                    host=r.host,
                    user=r.user,
                    ip_address=r.ip_address,
                    application=r.application,
                    environment=r.environment,
                    source_type=r.source_type,
                    source_name=r.source_name,
                    metadata_json=r.metadata_json or {},
                    is_valid=r.is_valid,
                    created_at=r.created_at,
                    raw_content=raw_text,
                )
            )

    return response_list


@router.get("/export")
async def export_logs(
    format: str = Query("json", description="Export format: json, csv, or ocsf"),
    severity: Optional[str] = None,
    source_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Exports normalized logs in JSON, CSV, or OCSF format.
    """
    stmt = select(ProcessedLog).order_by(desc(ProcessedLog.timestamp)).limit(5000)
    filters = []
    if severity and severity.upper() != "ALL":
        filters.append(ProcessedLog.severity == severity.upper())
    if source_type and source_type.lower() != "all":
        filters.append(ProcessedLog.source_type == source_type.lower())
    if filters:
        stmt = stmt.filter(and_(*filters))

    result = await db.execute(stmt)
    logs = result.scalars().all()

    if format.lower() == "ocsf":
        ocsf_data = [
            {
                "version": "1.1.0",
                "class_uid": 1001,
                "category_uid": 1,
                "class_name": "system_activity",
                "time": l.timestamp.isoformat(),
                "severity": l.severity,
                "message": l.message,
                "metadata": {
                    "id": l.id,
                    "product": {"name": "ULPF", "version": "1.0.0"},
                    "source": {"type": l.source_type, "name": l.source_name},
                    **(l.metadata_json or {}),
                },
                "src_endpoint": {"ip": l.ip_address} if l.ip_address else None,
                "actor": {"user": {"name": l.user}} if l.user else None,
                "device": {"hostname": l.host} if l.host else None,
            }
            for l in logs
        ]
        return Response(
            content=json.dumps(ocsf_data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=ulpf_ocsf_logs.json"},
        )
    elif format.lower() == "json":
        data = [
            {
                "id": l.id,
                "timestamp": l.timestamp.isoformat(),
                "severity": l.severity,
                "event_type": l.event_type,
                "message": l.message,
                "host": l.host,
                "user": l.user,
                "ip_address": l.ip_address,
                "application": l.application,
                "environment": l.environment,
                "source": {"type": l.source_type, "name": l.source_name},
                "metadata": l.metadata_json,
            }
            for l in logs
        ]
        return Response(
            content=json.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=ulpf_normalized_logs.json"},
        )
    else:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["id", "timestamp", "severity", "event_type", "message", "host", "user", "ip_address", "application", "environment"])
        for l in logs:
            writer.writerow([
                l.id,
                l.timestamp.isoformat(),
                l.severity,
                l.event_type or "",
                l.message,
                l.host or "",
                l.user or "",
                l.ip_address or "",
                l.application or "",
                l.environment or "",
            ])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=ulpf_normalized_logs.csv"},
        )


@router.get("/{id}/raw")
async def get_log_raw_forensic(
    id: str,
    current_user: User = Depends(require_analyst),
    db: AsyncSession = Depends(get_db),
):
    """
    Forensic raw log retrieval. Strictly restricted to authenticated Analysts and Administrators.
    """
    result = await db.execute(select(ProcessedLog).filter(ProcessedLog.id == id))
    log = result.scalars().first()
    if not log or not log.raw_log_id:
        raise HTTPException(status_code=404, detail="Log record or linked raw log not found")

    raw_res = await db.execute(select(RawLog.raw_content).filter(RawLog.id == log.raw_log_id))
    raw_text = raw_res.scalar_one_or_none()
    if not raw_text:
        raise HTTPException(status_code=404, detail="Raw content missing")

    return {
        "log_id": id,
        "raw_log_id": log.raw_log_id,
        "raw_content": raw_text,
        "requested_by": current_user.username,
        "access_granted_at": datetime.now().isoformat(),
    }


@router.get("/{id}/ocsf")
async def get_log_ocsf(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves a single log serialized into Open Cybersecurity Schema Framework (OCSF v1.1/v1.3) format.
    """
    result = await db.execute(select(ProcessedLog).filter(ProcessedLog.id == id))
    log = result.scalars().first()
    if not log:
        raise HTTPException(status_code=404, detail="Log record not found")

    return {
        "version": "1.1.0",
        "class_uid": 1001,
        "category_uid": 1,
        "class_name": "system_activity",
        "time": log.timestamp.isoformat(),
        "severity": log.severity,
        "message": log.message,
        "metadata": {
            "id": log.id,
            "product": {"name": "ULPF", "version": "1.0.0"},
            "source": {"type": log.source_type, "name": log.source_name},
            **(log.metadata_json or {}),
        },
        "src_endpoint": {"ip": log.ip_address} if log.ip_address else None,
        "actor": {"user": {"name": log.user}} if log.user else None,
        "device": {"hostname": log.host} if log.host else None,
    }


@router.get("/{id}", response_model=ProcessedLogResponse)
async def get_log_detail(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves a single processed log. Raw content is only exposed to Analysts and Administrators.
    """
    result = await db.execute(select(ProcessedLog).filter(ProcessedLog.id == id))
    log = result.scalars().first()
    if not log:
        raise HTTPException(status_code=404, detail="Log record not found")

    raw_text = None
    if log.raw_log_id:
        if current_user.role in ("admin", "analyst"):
            raw_res = await db.execute(select(RawLog.raw_content).filter(RawLog.id == log.raw_log_id))
            raw_text = raw_res.scalar_one_or_none()
        else:
            raw_text = "[REDACTED - SENSITIVE FORENSIC RAW CONTENT REQUIRES ANALYST OR ADMIN ROLE]"

    return ProcessedLogResponse(
        id=log.id,
        raw_log_id=log.raw_log_id,
        job_id=log.job_id,
        timestamp=log.timestamp,
        severity=log.severity,
        event_type=log.event_type,
        message=log.message,
        host=log.host,
        user=log.user,
        ip_address=log.ip_address,
        application=log.application,
        environment=log.environment,
        source_type=log.source_type,
        source_name=log.source_name,
        metadata_json=log.metadata_json or {},
        is_valid=log.is_valid,
        created_at=log.created_at,
        raw_content=raw_text,
    )
