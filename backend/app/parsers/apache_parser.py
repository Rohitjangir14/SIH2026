import re
from typing import Dict, Any
from app.parsers.base import BaseParser


class ApacheParser(BaseParser):
    """
    Parser for Apache Common and Combined Log Formats (HTTP access logs).
    """

    COMBINED_PATTERN = re.compile(
        r'^(?P<ip_address>\S+)\s+'           # Client IP
        r'\S+\s+'                            # Identd (usually '-')
        r'(?P<user>\S+)\s+'                  # Auth user
        r'\[(?P<timestamp>[^\]]+)\]\s+'     # [day/month/year:hour:minute:second zone]
        r'"(?P<method>[A-Z]+)\s+(?P<path>\S+)(?:\s+(?P<http_version>[^"]+))?"\s+'  # Request line
        r'(?P<status_code>\d{3})\s+'        # HTTP status code
        r'(?P<response_bytes>\S+)'          # Bytes sent
        r'(?:\s+"(?P<referer>[^"]*)"\s+"(?P<user_agent>[^"]*)")?' # Combined extras
    )

    @property
    def name(self) -> str:
        return "Apache Web Server Parser"

    @property
    def format_key(self) -> str:
        return "apache"

    def detect(self, sample_line: str) -> float:
        line = sample_line.strip()
        # Look for typical [DD/Mon/YYYY:HH:MM:SS ...] and HTTP methods
        if re.search(r'\[\d{1,2}/\w{3}/\d{4}:\d{2}:\d{2}:\d{2}', line) and re.search(r'"(?:GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)\s', line):
            if self.COMBINED_PATTERN.match(line):
                return 0.98
            return 0.85
        return 0.0

    def parse(self, line: str) -> Dict[str, Any]:
        line = line.strip()
        match = self.COMBINED_PATTERN.match(line)
        if not match:
            raise ValueError("Line does not match Apache Common/Combined log format")

        groups = match.groupdict()
        status_code = int(groups.get("status_code", 200))

        # Determine severity based on HTTP status code
        if status_code >= 500:
            severity = "ERROR"
        elif status_code >= 400:
            severity = "WARNING" if status_code != 401 and status_code != 403 else "WARNING"
        elif status_code >= 300:
            severity = "INFO"
        else:
            severity = "INFO"

        method = groups.get("method", "")
        path = groups.get("path", "")
        message = f"{method} {path} HTTP {status_code}"

        user = groups.get("user")
        if user == "-":
            user = None

        metadata = {
            "http_method": method,
            "http_path": path,
            "http_version": groups.get("http_version"),
            "status_code": status_code,
            "response_bytes": groups.get("response_bytes"),
            "referer": groups.get("referer"),
            "user_agent": groups.get("user_agent"),
        }

        return {
            "timestamp": groups["timestamp"],
            "severity": severity,
            "event_type": "http_request",
            "message": message,
            "ip_address": groups.get("ip_address"),
            "user": user,
            "application": "apache",
            "metadata": metadata,
        }
