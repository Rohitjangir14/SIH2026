import re
from typing import Dict, Any
from app.parsers.base import BaseParser


class NginxParser(BaseParser):
    """
    Parser for Nginx error and access logs.
    """

    ERROR_PATTERN = re.compile(
        r'^(?P<timestamp>\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2})\s+'
        r'\[(?P<severity>[a-z]+)\]\s+'
        r'(?P<pid>\d+)#(?P<tid>\d+):\s+'
        r'(?:\*(?P<cid>\d+)\s+)?'
        r'(?P<message>.*?)(?:,\s+client:\s+(?P<ip_address>[^,]+))?'
        r'(?:,\s+server:\s+(?P<server>[^,]+))?'
        r'(?:,\s+request:\s+"(?P<request>[^"]*)")?'
        r'(?:,\s+upstream:\s+"(?P<upstream>[^"]*)")?'
        r'(?:,\s+host:\s+"(?P<host>[^"]*)")?$'
    )

    ACCESS_PATTERN = re.compile(
        r'^(?P<ip_address>\S+)\s+'
        r'\S+\s+'
        r'(?P<user>\S+)\s+'
        r'\[(?P<timestamp>[^\]]+)\]\s+'
        r'"(?P<request>[^"]*)"\s+'
        r'(?P<status_code>\d{3})\s+'
        r'(?P<response_bytes>\S+)'
        r'(?:\s+"(?P<referer>[^"]*)"\s+"(?P<user_agent>[^"]*)")?'
    )

    @property
    def name(self) -> str:
        return "Nginx Web Server Parser"

    @property
    def format_key(self) -> str:
        return "nginx"

    def detect(self, sample_line: str) -> float:
        line = sample_line.strip()
        if re.search(r'^\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2} \[(?:emerg|alert|crit|error|warn|notice|info|debug)\]', line):
            return 0.99
        if "nginx" in line.lower() and re.search(r'\[\d{1,2}/\w{3}/\d{4}:\d{2}:\d{2}:\d{2}', line):
            return 0.90
        return 0.0

    def parse(self, line: str) -> Dict[str, Any]:
        line = line.strip()
        
        # Try error log pattern first
        match = self.ERROR_PATTERN.match(line)
        if match:
            groups = match.groupdict()
            severity_map = {
                "emerg": "CRITICAL",
                "alert": "CRITICAL",
                "crit": "CRITICAL",
                "error": "ERROR",
                "warn": "WARNING",
                "notice": "INFO",
                "info": "INFO",
                "debug": "DEBUG",
            }
            raw_sev = groups.get("severity", "error").lower()
            severity = severity_map.get(raw_sev, "ERROR")

            metadata = {
                "pid": groups.get("pid"),
                "tid": groups.get("tid"),
                "cid": groups.get("cid"),
                "server": groups.get("server"),
                "request": groups.get("request"),
                "upstream": groups.get("upstream"),
            }

            return {
                "timestamp": groups["timestamp"],
                "severity": severity,
                "event_type": "web_server_error",
                "message": groups.get("message", "Nginx error event"),
                "ip_address": groups.get("ip_address"),
                "host": groups.get("host") or groups.get("server"),
                "application": "nginx",
                "metadata": metadata,
            }

        # Try access pattern
        match = self.ACCESS_PATTERN.match(line)
        if match:
            groups = match.groupdict()
            status_code = int(groups.get("status_code", 200))
            severity = "ERROR" if status_code >= 500 else ("WARNING" if status_code >= 400 else "INFO")
            user = groups.get("user")
            if user == "-":
                user = None

            return {
                "timestamp": groups["timestamp"],
                "severity": severity,
                "event_type": "http_request",
                "message": f"HTTP {status_code} {groups.get('request', '')}",
                "ip_address": groups.get("ip_address"),
                "user": user,
                "application": "nginx",
                "metadata": groups,
            }

        raise ValueError("Line does not match Nginx error or access log format")
