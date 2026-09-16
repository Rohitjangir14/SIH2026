import re
from datetime import datetime, timezone
from typing import Dict, Any
from app.parsers.base import BaseParser


class SyslogParser(BaseParser):
    """
    Parser for RFC 3164 (BSD) and RFC 5424 Linux/Unix Syslog messages.
    """

    # RFC 3164: Mmm dd hh:mm:ss hostname tag[pid]: message
    RFC3164_PATTERN = re.compile(
        r'^(?:<(?P<pri>\d+)>)?'
        r'(?P<timestamp>[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+'
        r'(?P<host>\S+)\s+'
        r'(?P<app>[a-zA-Z0-9_\.\-]+)(?:\[(?P<pid>\d+)\])?:\s+'
        r'(?P<message>.*)$'
    )

    # Kernel or systemd alternate pattern: Mmm dd hh:mm:ss hostname tag: [uptime] message
    ALT_PATTERN = re.compile(
        r'^(?P<timestamp>[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+'
        r'(?P<host>\S+)\s+'
        r'(?P<app>[a-zA-Z0-9_\.\-]+):\s+'
        r'(?P<message>.*)$'
    )

    # RFC 5424: <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID [SD] MSG
    RFC5424_PATTERN = re.compile(
        r'^<(?P<pri>\d+)>(?P<version>\d+)\s+'
        r'(?P<timestamp>\S+)\s+'
        r'(?P<host>\S+)\s+'
        r'(?P<app>\S+)\s+'
        r'(?P<pid>\S+)\s+'
        r'(?P<msgid>\S+)\s+'
        r'(?:\[(?P<sd>[^\]]*)\]\s*)?'
        r'(?P<message>.*)$'
    )

    @property
    def name(self) -> str:
        return "Linux Syslog Parser (RFC 3164 / RFC 5424)"

    @property
    def format_key(self) -> str:
        return "syslog"

    def detect(self, sample_line: str) -> float:
        line = sample_line.strip()
        # Check standard BSD syslog month prefix e.g. "Sep 13 10:32:21"
        if re.match(r'^(?:<\d+>)?[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\S+\s+[\w\.\-]+', line):
            return 0.98
        if re.match(r'^<\d+>\d+\s+\d{4}-\d{2}-\d{2}T', line):
            return 0.99
        return 0.0

    def parse(self, line: str) -> Dict[str, Any]:
        line = line.strip()

        # Try RFC 3164
        match = self.RFC3164_PATTERN.match(line)
        if not match:
            match = self.ALT_PATTERN.match(line)

        if match:
            groups = match.groupdict()
            msg = groups.get("message", "")
            app = groups.get("app", "")
            host = groups.get("host", "")

            # Heuristic severity detection from message/app
            severity = "INFO"
            lowered_msg = msg.lower()
            if any(w in lowered_msg for w in ["failed", "failure", "error", "corrupt", "denied"]):
                severity = "ERROR"
            elif any(w in lowered_msg for w in ["warn", "warning", "possible syn flood", "alert"]):
                severity = "WARNING"
            elif any(w in lowered_msg for w in ["panic", "fatal", "critical"]):
                severity = "CRITICAL"
            elif "debug" in lowered_msg:
                severity = "DEBUG"

            # Check for user extraction (e.g. "user ronak", "user=ronak", "for invalid user ronak", "for ronak")
            user = None
            user_match = re.search(r'(?:user[=:\s]+|for (?:invalid )?user\s+)([a-zA-Z0-9_\.\-]+)', msg, re.IGNORECASE)
            if user_match:
                user = user_match.group(1)

            # Check for IP address in message
            ip_match = re.search(r'\b(?:from\s+)?(\d{1,3}(?:\.\d{1,3}){3})\b', msg)
            ip_address = ip_match.group(1) if ip_match else None

            # Determine event_type
            event_type = "system"
            if "sshd" in app or "auth" in app or "login" in lowered_msg:
                event_type = "authentication"
            elif "cron" in app.lower():
                event_type = "cron"
            elif "sudo" in app.lower():
                event_type = "privilege_escalation"
            elif "kernel" in app.lower():
                event_type = "kernel"

            # Approximate year for RFC 3164 date (which lacks year)
            ts_str = groups.get("timestamp", "")
            current_year = datetime.now(timezone.utc).year
            normalized_ts_str = f"{current_year} {ts_str}"

            metadata = {
                "syslog_app": app,
                "pid": groups.get("pid"),
                "pri": groups.get("pri"),
            }

            return {
                "timestamp": normalized_ts_str,
                "severity": severity,
                "event_type": event_type,
                "message": msg,
                "host": host,
                "user": user,
                "ip_address": ip_address,
                "application": app,
                "metadata": metadata,
            }

        # Try RFC 5424
        match5424 = self.RFC5424_PATTERN.match(line)
        if match5424:
            groups = match5424.groupdict()
            return {
                "timestamp": groups.get("timestamp"),
                "severity": "INFO",
                "event_type": "syslog_5424",
                "message": groups.get("message", ""),
                "host": groups.get("host"),
                "application": groups.get("app"),
                "metadata": groups,
            }

        raise ValueError("Line does not match Syslog format")
