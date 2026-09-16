import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from dateutil import parser as date_parser
from app.schemas.universal_log import UniversalLogSchema, SeverityEnum, LogSourceInfo


class LogNormalizer:
    """
    Normalizes heterogeneous extracted log fields into the standardized Universal Log Schema.
    1. Standardizes severity labels (ERR, ERROR, SEVERE -> ERROR, WARN -> WARNING, etc.).
    2. Converts multiple date/time formats into UTC ISO-8601 datetime objects.
    3. Normalizes IP addresses and handles missing required fields.
    """

    SEVERITY_MAP = {
        # Critical
        "crit": SeverityEnum.CRITICAL,
        "critical": SeverityEnum.CRITICAL,
        "fatal": SeverityEnum.CRITICAL,
        "emerg": SeverityEnum.CRITICAL,
        "emergency": SeverityEnum.CRITICAL,
        "alert": SeverityEnum.CRITICAL,
        "panic": SeverityEnum.CRITICAL,

        # Error
        "err": SeverityEnum.ERROR,
        "error": SeverityEnum.ERROR,
        "severe": SeverityEnum.ERROR,
        "fail": SeverityEnum.ERROR,
        "failed": SeverityEnum.ERROR,
        "failure": SeverityEnum.ERROR,

        # Warning
        "warn": SeverityEnum.WARNING,
        "warning": SeverityEnum.WARNING,

        # Info
        "info": SeverityEnum.INFO,
        "information": SeverityEnum.INFO,
        "notice": SeverityEnum.INFO,

        # Debug
        "debug": SeverityEnum.DEBUG,
        "trace": SeverityEnum.DEBUG,
        "verbose": SeverityEnum.DEBUG,
    }

    def normalize_severity(self, raw_severity: Optional[str]) -> SeverityEnum:
        if not raw_severity:
            return SeverityEnum.UNKNOWN
        cleaned = str(raw_severity).strip().lower()
        return self.SEVERITY_MAP.get(cleaned, SeverityEnum.UNKNOWN)

    def normalize_timestamp(self, raw_timestamp: Any) -> datetime:
        """Parses various timestamp representations into a timezone-aware UTC datetime."""
        if isinstance(raw_timestamp, datetime):
            if raw_timestamp.tzinfo is None:
                return raw_timestamp.replace(tzinfo=timezone.utc)
            return raw_timestamp.astimezone(timezone.utc)

        if not raw_timestamp:
            return datetime.now(timezone.utc)

        ts_str = str(raw_timestamp).strip()

        # Handle Apache format: 13/Sep/2026:10:32:21 +0000
        if ":" in ts_str and "/" in ts_str:
            # Replace first colon after year
            parts = ts_str.split(":", 1)
            if len(parts) == 2 and "/" in parts[0]:
                ts_str = f"{parts[0]} {parts[1]}"

        try:
            dt = date_parser.parse(ts_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
            return dt
        except Exception:
            # If timestamp parsing fails, return current UTC time
            return datetime.now(timezone.utc)

    def normalize_record(
        self,
        cleaned_dict: Dict[str, Any],
        source_type: str = "generic",
        source_name: str = "default_source",
        record_id: Optional[str] = None,
    ) -> UniversalLogSchema:
        """
        Transforms cleaned extracted fields into a verified UniversalLogSchema instance.
        """
        log_id = record_id or str(uuid.uuid4())
        dt = self.normalize_timestamp(cleaned_dict.get("timestamp"))
        severity = self.normalize_severity(cleaned_dict.get("severity"))
        
        # Message is required; fallback to representation if empty
        message = cleaned_dict.get("message")
        if not message or not str(message).strip():
            message = f"Event recorded from {source_name}"
        else:
            message = str(message)

        # Source mapping
        source_info = LogSourceInfo(
            type=cleaned_dict.get("source_type") or source_type,
            name=cleaned_dict.get("source_name") or source_name,
        )

        return UniversalLogSchema(
            id=log_id,
            timestamp=dt,
            source=source_info,
            severity=severity,
            event_type=cleaned_dict.get("event_type"),
            message=message,
            host=cleaned_dict.get("host"),
            user=cleaned_dict.get("user"),
            ip_address=cleaned_dict.get("ip_address"),
            application=cleaned_dict.get("application"),
            environment=cleaned_dict.get("environment"),
            metadata=cleaned_dict.get("metadata") or {},
        )


log_normalizer = LogNormalizer()
