import re
from typing import Dict, Any
from app.parsers.base import BaseParser


class WindowsParser(BaseParser):
    """
    Parser for Windows Event Logs (System, Application, Security).
    """

    PATTERN = re.compile(
        r'^(?P<timestamp>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+'
        r'\[(?P<channel>[a-zA-Z0-9_\-]+)\]\s+'
        r'EventID=(?P<event_id>\d+)\s+'
        r'Level=(?P<level>[a-zA-Z]+)\s+'
        r'Host=(?P<host>\S+)\s+'
        r'Message="?(?P<message>.*?)"?$'
    )

    @property
    def name(self) -> str:
        return "Windows Event Log Parser"

    @property
    def format_key(self) -> str:
        return "windows"

    def detect(self, sample_line: str) -> float:
        line = sample_line.strip()
        if "EventID=" in line and "Level=" in line and re.search(r'\[(?:Security|System|Application)\]', line, re.IGNORECASE):
            return 0.99
        if "EventID=" in line:
            return 0.85
        return 0.0

    def parse(self, line: str) -> Dict[str, Any]:
        line = line.strip()
        match = self.PATTERN.match(line)
        if not match:
            # Fallback for key-value based windows logs
            if "EventID=" in line:
                event_id_m = re.search(r'EventID=(\d+)', line)
                level_m = re.search(r'Level=([a-zA-Z]+)', line)
                host_m = re.search(r'Host=(\S+)', line)
                ts_m = re.search(r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})', line)
                
                event_id = event_id_m.group(1) if event_id_m else "0"
                level = level_m.group(1) if level_m else "Information"
                host = host_m.group(1) if host_m else None
                ts = ts_m.group(1) if ts_m else None

                return {
                    "timestamp": ts or "2026-09-13 00:00:00",
                    "severity": self._map_level(level, event_id),
                    "event_type": f"windows_event_{event_id}",
                    "message": line,
                    "host": host,
                    "application": "windows_event_log",
                    "metadata": {"event_id": event_id, "raw_level": level},
                }
            raise ValueError("Line does not match Windows Event Log format")

        groups = match.groupdict()
        event_id = groups.get("event_id", "")
        level = groups.get("level", "Information")
        message = groups.get("message", "")
        channel = groups.get("channel", "System")

        # Extract user if mentioned in Windows message
        user = None
        # Check target account first, then any valid account name
        target_m = re.search(r'(?:Account For Which Logon Failed|Target Account|Target):\s*(?:.*?Account Name:\s*|\s*Account Name:\s*)([a-zA-Z0-9_\-\$]+)', message)
        if target_m and target_m.group(1) != "-":
            user = target_m.group(1)
        else:
            names = re.findall(r'Account Name:\s*([a-zA-Z0-9_\-\$]+)', message)
            for name in names:
                if name != "-":
                    user = name
                    break

        # Well-known Windows security event IDs:
        # 4624 = logon success, 4625 = logon failure, 4720 = user created
        event_type = f"win_{channel.lower()}"
        if event_id == "4625":
            event_type = "authentication_failure"
        elif event_id == "4624":
            event_type = "authentication_success"
        elif event_id == "4720":
            event_type = "user_account_created"

        metadata = {
            "channel": channel,
            "event_id": event_id,
            "windows_level": level,
        }

        return {
            "timestamp": groups["timestamp"],
            "severity": self._map_level(level, event_id),
            "event_type": event_type,
            "message": message,
            "host": groups.get("host"),
            "user": user,
            "application": f"windows_{channel.lower()}",
            "metadata": metadata,
        }

    def _map_level(self, level: str, event_id: str) -> str:
        # 4625 failed logon is security error even if Windows reports Information level
        if event_id == "4625":
            return "ERROR"
        lvl = level.lower()
        if "err" in lvl or "fatal" in lvl:
            return "ERROR"
        if "warn" in lvl:
            return "WARNING"
        if "crit" in lvl:
            return "CRITICAL"
        return "INFO"
