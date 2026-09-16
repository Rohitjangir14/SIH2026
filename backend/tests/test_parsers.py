import pytest
from app.parsers.json_parser import JSONParser
from app.parsers.syslog_parser import SyslogParser
from app.parsers.apache_parser import ApacheParser
from app.parsers.nginx_parser import NginxParser
from app.parsers.csv_parser import CSVParser
from app.parsers.windows_parser import WindowsParser
from app.parsers.regex_parser import RegexParser


def test_json_parser():
    parser = JSONParser()
    sample = '{"timestamp": "2026-09-13T10:32:21Z", "status": 401, "message": "Unauthorized", "user": "ronak", "ip": "192.168.1.45"}'
    assert parser.detect(sample) > 0.8
    result = parser.parse(sample)
    assert result["user"] == "ronak"
    assert result["ip_address"] == "192.168.1.45"
    assert result["message"] == "Unauthorized"


def test_apache_parser():
    parser = ApacheParser()
    sample = '192.168.1.45 - ronak [13/Sep/2026:10:32:21 +0000] "POST /api/v1/auth/login HTTP/1.1" 401 128 "-" "Mozilla/5.0"'
    assert parser.detect(sample) > 0.8
    result = parser.parse(sample)
    assert result["ip_address"] == "192.168.1.45"
    assert result["user"] == "ronak"
    assert result["severity"] == "WARNING"
    assert "POST /api/v1/auth/login" in result["message"]


def test_syslog_parser():
    parser = SyslogParser()
    sample = "Sep 13 10:32:21 server01 sshd[2841]: Failed password for invalid user ronak from 192.168.1.45 port 54821 ssh2"
    assert parser.detect(sample) > 0.8
    result = parser.parse(sample)
    assert result["host"] == "server01"
    assert result["application"] == "sshd"
    assert result["severity"] == "ERROR"
    assert result["user"] == "ronak"
    assert result["ip_address"] == "192.168.1.45"


def test_nginx_parser():
    parser = NginxParser()
    sample = '2026/09/13 10:32:21 [error] 14202#14202: *1092 open() "/usr/share/nginx/html/favicon.ico" failed (2: No such file or directory), client: 192.168.1.45, server: api.internal, request: "GET /favicon.ico HTTP/1.1", host: "api.internal"'
    assert parser.detect(sample) > 0.8
    result = parser.parse(sample)
    assert result["severity"] == "ERROR"
    assert result["ip_address"] == "192.168.1.45"
    assert result["application"] == "nginx"


def test_windows_parser():
    parser = WindowsParser()
    sample = '2026-09-13 10:32:21 [Security] EventID=4625 Level=Information Host=DC-PROD-01 Message="An account failed to log on. Subject: Security ID: S-1-0-0, Account Name: -, Logon Type: 3, Account For Which Logon Failed: Account Name: ronak, Failure Reason: Unknown user name or bad password."'
    assert parser.detect(sample) > 0.8
    result = parser.parse(sample)
    assert result["host"] == "DC-PROD-01"
    assert result["user"] == "ronak"
    assert result["severity"] == "ERROR"  # 4625 is failure logon
    assert result["event_type"] == "authentication_failure"


def test_csv_parser():
    parser = CSVParser(headers=["timestamp", "severity", "service", "message", "user", "ip_address"])
    sample = "2026-09-13 10:32:21,ERROR,auth_svc,Database timeout during credential lookup,ronak,192.168.1.45"
    assert parser.detect(sample) > 0.6
    result = parser.parse(sample)
    assert result["severity"] == "ERROR"
    assert result["application"] == "auth_svc"
    assert result["user"] == "ronak"
    assert result["ip_address"] == "192.168.1.45"


def test_regex_parser():
    parser = RegexParser()
    sample = "[2026-09-13 10:32:21] ERROR auth.security: Login failed for user=ronak from ip=192.168.1.45"
    assert parser.detect(sample) > 0.6
    result = parser.parse(sample)
    assert result["severity"] == "ERROR"
    assert result["user"] == "ronak"
    assert result["ip_address"] == "192.168.1.45"
