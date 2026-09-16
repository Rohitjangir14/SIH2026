import re
from typing import Dict, Any, Optional
from app.schemas.universal_log import UniversalLogSchema


class LogEnricher:
    """
    Enrichment Engine adding contextual metadata:
    - GeoIP geolocation, country, and ISP classification
    - Internal / Private RFC1918 subnet tagging
    - Security threat heuristic classification
    """

    KNOWN_IPS = {
        "8.8.8.8": {"country": "USA", "city": "Mountain View", "org": "Google LLC", "is_internal": False},
        "8.8.4.4": {"country": "USA", "city": "Mountain View", "org": "Google LLC", "is_internal": False},
        "1.1.1.1": {"country": "Australia", "city": "Sydney", "org": "Cloudflare, Inc.", "is_internal": False},
        "1.0.0.1": {"country": "Australia", "city": "Sydney", "org": "Cloudflare, Inc.", "is_internal": False},
    }

    def is_private_ip(self, ip: str) -> bool:
        if not ip:
            return False
        # 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.1
        if ip.startswith("10.") or ip.startswith("192.168.") or ip == "127.0.0.1" or ip == "localhost":
            return True
        if ip.startswith("172."):
            parts = ip.split(".")
            if len(parts) >= 2 and parts[1].isdigit():
                sec = int(parts[1])
                if 16 <= sec <= 31:
                    return True
        return False

    def enrich_ip(self, ip: Optional[str]) -> Optional[Dict[str, Any]]:
        if not ip:
            return None

        ip = ip.strip()
        if ip in self.KNOWN_IPS:
            return self.KNOWN_IPS[ip]

        if self.is_private_ip(ip):
            return {
                "country": "Local",
                "city": "Private Network",
                "org": "Internal Infrastructure",
                "is_internal": True,
            }

        # Simulated public IP lookup
        return {
            "country": "External",
            "city": "Remote Node",
            "org": "Public WAN",
            "is_internal": False,
        }

    def enrich(self, record: UniversalLogSchema) -> UniversalLogSchema:
        """Enriches the normalized schema record with geo and threat metadata."""
        enrichment_data: Dict[str, Any] = {}

        if record.ip_address:
            ip_info = self.enrich_ip(record.ip_address)
            if ip_info:
                enrichment_data["ip_geo"] = ip_info

        # Tag high risk events
        msg_lower = record.message.lower()
        if any(term in msg_lower for term in ["failed password", "unauthorized", "sqlmap", "attack", "passwd", "syn flooding"]):
            enrichment_data["threat_level"] = "HIGH"
            enrichment_data["security_flag"] = True
        elif record.severity.value in ["CRITICAL", "ERROR"]:
            enrichment_data["threat_level"] = "MEDIUM"
        else:
            enrichment_data["threat_level"] = "LOW"

        # Merge into record metadata
        record.metadata.update(enrichment_data)
        return record


log_enricher = LogEnricher()
