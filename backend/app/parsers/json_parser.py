import json
from typing import Dict, Any
from app.parsers.base import BaseParser


class JSONParser(BaseParser):
    """
    Parser for structured JSON log lines, AWS CloudWatch JSON events, and nested JSON objects.
    """

    @property
    def name(self) -> str:
        return "JSON Parser"

    @property
    def format_key(self) -> str:
        return "json"

    def detect(self, sample_line: str) -> float:
        line = sample_line.strip()
        if not (line.startswith("{") and line.endswith("}")):
            return 0.0
        try:
            data = json.loads(line)
            if isinstance(data, dict):
                # Strong indicators for log entries
                log_keys = {"timestamp", "time", "message", "msg", "level", "severity", "status", "event"}
                matches = set(k.lower() for k in data.keys()) & log_keys
                if len(matches) >= 2:
                    return 0.99
                return 0.85
            return 0.1
        except Exception:
            return 0.0

    def parse(self, line: str) -> Dict[str, Any]:
        line = line.strip()
        try:
            data = json.loads(line)
        except Exception as e:
            raise ValueError(f"Invalid JSON string: {e}")

        if not isinstance(data, dict):
            raise ValueError("Expected JSON object dictionary")

        result: Dict[str, Any] = {"raw_parsed": True}
        metadata: Dict[str, Any] = {}

        # Common field mappings
        field_mappings = {
            "timestamp": ["timestamp", "time", "date", "created_at", "event_time", "@timestamp"],
            "severity": ["severity", "level", "log_level", "status_level"],
            "message": ["message", "msg", "log", "payload", "error", "description"],
            "host": ["host", "hostname", "server", "instance_id"],
            "user": ["user", "username", "account", "actor"],
            "ip_address": ["ip", "ip_address", "client_ip", "remote_addr", "src_ip"],
            "application": ["application", "app", "service", "service_name", "logger"],
            "event_type": ["event_type", "event", "action", "type"],
            "environment": ["environment", "env", "stage"],
        }

        for std_key, candidates in field_mappings.items():
            for cand in candidates:
                for k in list(data.keys()):
                    if k.lower() == cand and data[k] is not None:
                        result[std_key] = str(data[k])
                        break
                if std_key in result:
                    break

        # Fallback for message if missing
        if "message" not in result:
            # Check if there's a status code or reason
            if "status" in data:
                result["message"] = f"Status {data['status']}"
            else:
                result["message"] = json.dumps(data)

        # Store any remaining fields in metadata
        used_keys = {cand for candidates in field_mappings.values() for cand in candidates}
        for k, v in data.items():
            if k.lower() not in used_keys:
                metadata[k] = v

        result["metadata"] = metadata
        return result
