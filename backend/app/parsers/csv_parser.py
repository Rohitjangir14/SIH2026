import csv
import io
from typing import Dict, Any, List, Optional
from app.parsers.base import BaseParser


class CSVParser(BaseParser):
    """
    Parser for delimited logs (CSV, TSV) with auto-mapped field headers.
    """

    def __init__(self, headers: Optional[List[str]] = None):
        self.headers = [h.strip().lower() for h in headers] if headers else None

    @property
    def name(self) -> str:
        return "CSV Delimited Parser"

    @property
    def format_key(self) -> str:
        return "csv"

    def set_headers(self, headers: List[str]):
        self.headers = [h.strip().lower() for h in headers]

    def detect(self, sample_line: str) -> float:
        line = sample_line.strip()
        # If header line contains typical column names
        parts = [p.strip().lower() for p in line.split(",")]
        if len(parts) >= 3:
            common_cols = {"timestamp", "time", "date", "severity", "level", "message", "msg", "service", "user", "ip", "host"}
            matches = set(parts) & common_cols
            if len(matches) >= 2:
                return 0.99
            # Check if line looks like comma-delimited data with timestamp and severity
            if any(p.upper() in ["INFO", "ERROR", "WARN", "WARNING", "DEBUG", "CRITICAL"] for p in parts):
                return 0.92
            return 0.70
        return 0.0

    def parse(self, line: str) -> Dict[str, Any]:
        line = line.strip()
        reader = csv.reader(io.StringIO(line))
        try:
            row = next(reader)
        except Exception as e:
            raise ValueError(f"CSV row parsing error: {e}")

        if not row:
            raise ValueError("Empty CSV line")

        # If headers are known, map by headers
        if self.headers and len(self.headers) == len(row):
            data = dict(zip(self.headers, row))
        else:
            # Heuristic assignment based on position and content
            data = {}
            for i, val in enumerate(row):
                val_clean = val.strip()
                if i == 0:
                    data["timestamp"] = val_clean
                elif val_clean.upper() in ["INFO", "WARN", "WARNING", "ERROR", "CRITICAL", "DEBUG"]:
                    data["severity"] = val_clean
                elif "." in val_clean and val_clean.replace(".", "").isdigit():
                    data["ip_address"] = val_clean
                elif "message" not in data and len(val_clean) > 10:
                    data["message"] = val_clean
                else:
                    data[f"col_{i}"] = val_clean

        # Field mapping
        result: Dict[str, Any] = {}
        metadata: Dict[str, Any] = {}

        field_mappings = {
            "timestamp": ["timestamp", "time", "date", "created_at"],
            "severity": ["severity", "level", "log_level"],
            "message": ["message", "msg", "description", "log"],
            "host": ["host", "hostname", "server"],
            "user": ["user", "username", "user_id"],
            "ip_address": ["ip", "ip_address", "client_ip"],
            "application": ["service", "app", "application", "component"],
            "environment": ["environment", "env"],
            "event_type": ["event", "event_type", "action"],
        }

        for std_key, candidates in field_mappings.items():
            for cand in candidates:
                if cand in data and data[cand]:
                    result[std_key] = data[cand]
                    break

        if "message" not in result:
            result["message"] = line

        used_keys = {cand for candidates in field_mappings.values() for cand in candidates}
        for k, v in data.items():
            if k not in used_keys:
                metadata[k] = v

        result["metadata"] = metadata
        return result
