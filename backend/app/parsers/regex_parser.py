import re
from typing import Dict, Any, Optional
from app.parsers.base import BaseParser


class RegexParser(BaseParser):
    """
    Configurable regular expression parser supporting named capture groups
    and generic bracketed application logs.
    """

    GENERIC_PATTERN = re.compile(
        r'^(?:\[(?P<timestamp>[^\]]+)\]|\b(?P<timestamp_alt>\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\b)\s*'
        r'(?:\[?(?P<severity>DEBUG|INFO|WARN|WARNING|ERROR|CRITICAL|FATAL|SEVERE|TRACE)\]?)?\s*'
        r'(?:(?P<application>[a-zA-Z0-9_\.\-]+(?:\([^\)]+\))?):?\s+)?'
        r'(?P<message>.*)$',
        re.IGNORECASE
    )

    def __init__(self, custom_pattern: Optional[str] = None, name: str = "Generic Regex Parser", format_key: Optional[str] = None):
        self._name = name
        self._format_key = format_key or "regex"
        self.custom_pattern_str = custom_pattern
        self.compiled_pattern = re.compile(custom_pattern) if custom_pattern else self.GENERIC_PATTERN

    @property
    def name(self) -> str:
        return self._name

    @property
    def format_key(self) -> str:
        return self._format_key

    def detect(self, sample_line: str) -> float:
        line = sample_line.strip()
        if self.compiled_pattern.match(line):
            return 0.80
        return 0.1

    def parse(self, line: str) -> Dict[str, Any]:
        line = line.strip()
        match = self.compiled_pattern.match(line)
        if not match:
            raise ValueError(f"Line does not match regex pattern: {self.compiled_pattern.pattern}")

        groups = match.groupdict()
        timestamp = groups.get("timestamp") or groups.get("timestamp_alt") or "2026-09-13 00:00:00"
        severity = groups.get("severity") or "INFO"
        message = groups.get("message") or line
        application = groups.get("application")
        host = groups.get("host")
        user = groups.get("user")
        ip_address = groups.get("ip_address")

        # Heuristic extraction from message if not captured directly
        if not ip_address:
            ip_m = re.search(r'\bip[=:\s]+(\d{1,3}(?:\.\d{1,3}){3})\b', message, re.IGNORECASE)
            if ip_m:
                ip_address = ip_m.group(1)

        if not user:
            user_m = re.search(r'\buser[=:\s]+([a-zA-Z0-9_\.\-]+)\b', message, re.IGNORECASE)
            if user_m:
                user = user_m.group(1)

        metadata = {k: v for k, v in groups.items() if k not in ["timestamp", "timestamp_alt", "severity", "message", "application", "host", "user", "ip_address"] and v is not None}

        return {
            "timestamp": timestamp,
            "severity": severity,
            "event_type": groups.get("event_type", "app_event"),
            "message": message,
            "application": application,
            "host": host,
            "user": user,
            "ip_address": ip_address,
            "metadata": metadata,
        }
