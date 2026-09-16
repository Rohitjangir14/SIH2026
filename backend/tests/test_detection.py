import pytest
from app.detection.format_detector import format_detector


def test_detect_json():
    content = '{"timestamp": "2026-09-13T10:32:21Z", "status": 401, "message": "Unauthorized"}'
    res = format_detector.detect(content)
    assert res.detected_format == "json"
    assert res.confidence >= 0.8


def test_detect_apache():
    content = '192.168.1.45 - ronak [13/Sep/2026:10:32:21 +0000] "POST /api/v1/auth/login HTTP/1.1" 401 128'
    res = format_detector.detect(content)
    assert res.detected_format == "apache"
    assert res.confidence >= 0.8


def test_detect_syslog():
    content = "Sep 13 10:32:21 server01 sshd[2841]: Failed password for invalid user ronak from 192.168.1.45 port 54821 ssh2"
    res = format_detector.detect(content)
    assert res.detected_format == "syslog"
    assert res.confidence >= 0.8


def test_detect_windows():
    content = '2026-09-13 10:32:21 [Security] EventID=4625 Level=Information Host=DC-PROD-01 Message="Account failed logon"'
    res = format_detector.detect(content)
    assert res.detected_format == "windows"
    assert res.confidence >= 0.8


def test_detect_nginx():
    content = '2026/09/13 10:32:21 [error] 14202#14202: *1092 open() "/usr/share/nginx/html/favicon.ico" failed'
    res = format_detector.detect(content)
    assert res.detected_format == "nginx"
    assert res.confidence >= 0.8
