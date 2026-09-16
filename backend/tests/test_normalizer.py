from datetime import timezone
from app.processing.normalizer import log_normalizer
from app.schemas.universal_log import SeverityEnum


def test_normalize_severity():
    assert log_normalizer.normalize_severity("ERR") == SeverityEnum.ERROR
    assert log_normalizer.normalize_severity("SEVERE") == SeverityEnum.ERROR
    assert log_normalizer.normalize_severity("warning") == SeverityEnum.WARNING
    assert log_normalizer.normalize_severity("crit") == SeverityEnum.CRITICAL
    assert log_normalizer.normalize_severity("notice") == SeverityEnum.INFO


def test_normalize_timestamp():
    ts = log_normalizer.normalize_timestamp("2026-09-13T10:32:21Z")
    assert ts.year == 2026
    assert ts.month == 9
    assert ts.day == 13
    assert ts.tzinfo == timezone.utc


def test_normalize_record():
    cleaned = {
        "timestamp": "2026-09-13 10:32:21",
        "severity": "ERROR",
        "message": "Login failed user=ronak",
        "user": "ronak",
        "ip_address": "192.168.1.45",
    }
    schema = log_normalizer.normalize_record(cleaned, source_type="linux", source_name="server01")
    assert schema.id is not None
    assert schema.severity == SeverityEnum.ERROR
    assert schema.source.type == "linux"
    assert schema.source.name == "server01"
    assert schema.user == "ronak"
    assert schema.ip_address == "192.168.1.45"
