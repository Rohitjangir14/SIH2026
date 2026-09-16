import re
from typing import Tuple, List, Optional
from pydantic import ValidationError
from app.schemas.universal_log import UniversalLogSchema


class LogValidator:
    """
    Validates normalized records according to the Universal Log Schema.
    Checks:
    - Mandatory fields (id, timestamp, source, severity, message)
    - IP address syntax correctness if provided
    - Timestamp validity
    - Message non-emptiness
    """

    IP_PATTERN = re.compile(r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$')

    def validate(self, record: UniversalLogSchema) -> Tuple[bool, List[str]]:
        errors: List[str] = []

        # 1. Mandatory field checks
        if not record.id:
            errors.append("Missing mandatory field: 'id'")
        if not record.timestamp:
            errors.append("Missing or invalid mandatory field: 'timestamp'")
        if not record.source or not record.source.type or not record.source.name:
            errors.append("Missing or incomplete mandatory field: 'source'")
        if not record.severity:
            errors.append("Missing mandatory field: 'severity'")
        if not record.message or not record.message.strip():
            errors.append("Missing mandatory field: 'message'")

        # 2. IP syntax validation if present
        if record.ip_address:
            cleaned_ip = record.ip_address.strip()
            # Allow hostnames or standard IPv4
            if not self.IP_PATTERN.match(cleaned_ip) and not re.match(r'^[a-zA-Z0-9\.\-]+$', cleaned_ip):
                errors.append(f"Malformed IP address format: '{record.ip_address}'")

        # 3. Pydantic validation
        try:
            # Dump and re-validate
            UniversalLogSchema.model_validate(record)
        except ValidationError as ve:
            for err in ve.errors():
                errors.append(f"{err['loc']}: {err['msg']}")

        is_valid = len(errors) == 0
        return is_valid, errors


log_validator = LogValidator()
