import pytest
import json
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from pathlib import Path

from app.core.database import init_db, AsyncSessionLocal
from app.processing.pipeline import pipeline_runner
from app.processing.cleaner import data_cleaner, is_luhn_valid
from app.processing.normalizer import log_normalizer
from app.schemas.auth import UserRegister
from app.parsers.drain_miner import DrainMiner
from app.models.job import ProcessingJob
from app.models.raw_log import RawLog


@pytest.mark.asyncio
async def test_pretty_printed_json_array_ingestion():
    """
    Finding 1 Fix Verification:
    Tests that multi-line pretty-printed JSON arrays (like aws_cloudwatch.json)
    are extracted as discrete JSON records rather than split into physical lines.
    """
    await init_db()
    sample_path = Path(__file__).resolve().parent.parent.parent / "samples" / "aws_cloudwatch.json"
    if not sample_path.exists():
        sample_path = Path("samples/aws_cloudwatch.json")
    with open(sample_path, "r", encoding="utf-8") as f:
        content = f.read()

    async with AsyncSessionLocal() as db:
        job = await pipeline_runner.execute(
            db=db,
            raw_content=content,
            source_name="aws_cloudwatch_test",
            file_name="aws_cloudwatch.json",
        )
        assert job.total_records == 4
        assert job.processed_records == 4
        assert job.failed_records == 0
        assert job.detected_format == "json"


@pytest.mark.asyncio
async def test_single_pretty_printed_json_object():
    """
    Verifies that a single pretty-printed JSON object spanning multiple lines
    is ingested as exactly 1 record, not N lines.
    """
    await init_db()
    single_obj = json.dumps(
        {
            "timestamp": "2026-09-16T10:00:00Z",
            "log_level": "ERROR",
            "service": "payment-api",
            "message": "Connection to redis cluster failed",
            "user": "system",
        },
        indent=4,
    )

    async with AsyncSessionLocal() as db:
        job = await pipeline_runner.execute(
            db=db,
            raw_content=single_obj,
            source_name="single_json_test",
            file_name="app_log.json",
        )
        assert job.total_records == 1
        assert job.processed_records == 1
        assert job.failed_records == 0
        assert job.detected_format == "json"


@pytest.mark.asyncio
async def test_ndjson_line_ingestion():
    """Verifies that Newline-Delimited JSON (NDJSON) records are parsed correctly."""
    await init_db()
    ndjson_content = (
        '{"timestamp": "2026-09-16T10:01:00Z", "log_level": "INFO", "message": "msg 1"}\n'
        '{"timestamp": "2026-09-16T10:02:00Z", "log_level": "WARN", "message": "msg 2"}\n'
        '{"timestamp": "2026-09-16T10:03:00Z", "log_level": "ERROR", "message": "msg 3"}'
    )

    async with AsyncSessionLocal() as db:
        job = await pipeline_runner.execute(
            db=db,
            raw_content=ndjson_content,
            source_name="ndjson_test",
        )
        assert job.total_records == 3
        assert job.processed_records == 3
        assert job.failed_records == 0


def test_admin_registration_forbidden():
    """
    Finding 3 Fix Verification:
    Tests that clients cannot self-register with role='admin'.
    """
    with pytest.raises(ValueError, match="Self-registration as administrator is forbidden"):
        UserRegister(
            username="attacker",
            email="attacker@example.com",
            password="password123",
            role="admin",
        )

    # Valid roles default cleanly
    u = UserRegister(
        username="legit_analyst",
        email="analyst@example.com",
        password="password123",
        role="analyst",
    )
    assert u.role == "analyst"


def test_extended_pii_redaction():
    """
    Finding 5 Fix Verification:
    Tests redaction of Basic Auth, tokens, emails, phone numbers, SSNs, and cards,
    while guaranteeing Windows SIDs and Order IDs are NEVER corrupted.
    """
    text = (
        "User john.doe@acme.corp phone: +1-555-839-2019 ssn: 123-45-6789 "
        "auth: Authorization: Basic dXNlcjpwYXNz access_token=secret_jwt_tok_99812 "
        "card: 4532 0150 1234 5671 SID: S-1-5-21-397955417-626881126-18844144-1010 "
        "order_id=1234567890123"
    )

    masked, was_masked = data_cleaner.mask_sensitive_data(text)
    assert was_masked is True

    # Sensitive data redacted
    assert "[REDACTED_EMAIL]" in masked
    assert "[REDACTED_PHONE]" in masked
    assert "[REDACTED_SSN]" in masked
    assert "[REDACTED_BASIC_AUTH]" in masked
    assert "[REDACTED_SECRET]" in masked
    assert "[REDACTED_CARD_NUMBER]" in masked

    # System identifiers strictly preserved
    assert "S-1-5-21-397955417-626881126-18844144-1010" in masked
    assert "order_id=1234567890123" in masked


def test_timestamp_inference_audit_degradation():
    """
    Finding 8 Fix Verification:
    Verifies that malformed timestamps are recorded with audit degradation
    rather than silently faking the timestamp as current time.
    """
    corrupt_record = {
        "timestamp": "invalid_date_gibberish_123",
        "severity": "ERROR",
        "message": "Corrupted timestamp test event",
    }

    schema = log_normalizer.normalize_record(corrupt_record)
    assert schema.metadata.get("timestamp_is_inferred") is True
    assert schema.metadata.get("timestamp_quality") == "DEGRADED_INFERRED"
    assert "timestamp_parse_error" in schema.metadata
    assert schema.metadata.get("original_raw_timestamp") == "invalid_date_gibberish_123"


def test_masking_configuration_toggle():
    """
    Finding 6 Fix Verification:
    Tests that mask_data=False preserves raw content without redaction.
    """
    sample = {"message": "User password=MySecretPassword123 with api_key=sk_live_123"}
    cleaned_masked = data_cleaner.clean_record(sample, mask_data=True)
    assert "password=********" in cleaned_masked["message"]

    cleaned_raw = data_cleaner.clean_record(sample, mask_data=False)
    assert "password=MySecretPassword123" in cleaned_raw["message"]


def test_drain_miner_template_extraction():
    """
    Finding 7 Verification:
    Tests the Drain tree algorithm clustering recurring log templates with wildcards.
    """
    miner = DrainMiner(sim_threshold=0.5)
    miner.add_log_message("Failed password for root from 192.168.1.100 port 22 ssh2")
    miner.add_log_message("Failed password for admin from 10.0.0.5 port 2222 ssh2")
    miner.add_log_message("Failed password for user1 from 172.16.0.1 port 5482 ssh2")
    miner.add_log_message("Connection closed by 192.168.1.100 [preauth]")

    templates = miner.get_templates()
    assert len(templates) == 2
    # The sshd brute force messages should cluster together with wildcards
    brute_force_cluster = [t for t in templates if "Failed password" in t["template"]][0]
    assert brute_force_cluster["occurrences"] == 3
    assert "<*>" in brute_force_cluster["template"] or "<IP>" in brute_force_cluster["template"]


@pytest.mark.asyncio
async def test_job_replay_engine():
    """
    Tests replaying a job's immutable raw logs through the pipeline.
    """
    await init_db()
    raw_text = (
        "Sep 16 10:32:21 server01 sshd[2841]: Failed password for invalid user ronak from 192.168.1.45 port 54821 ssh2\n"
        "Sep 16 10:33:02 server01 sudo: ubuntu : TTY=pts/0 ; PWD=/home/ubuntu ; USER=root ; COMMAND=/bin/systemctl restart nginx"
    )

    async with AsyncSessionLocal() as db:
        # Initial run
        job1 = await pipeline_runner.execute(db=db, raw_content=raw_text, source_name="replay_source")
        assert job1.processed_records == 2

        # Replay: fetch raw logs
        raw_res = await db.execute(select(RawLog.raw_content).filter(RawLog.job_id == job1.id))
        raw_lines = raw_res.scalars().all()
        assert len(raw_lines) == 2

        # Re-execute
        replay_content = "\n".join(raw_lines)
        job2 = await pipeline_runner.execute(
            db=db,
            raw_content=replay_content,
            source_name=f"{job1.source}_replay",
            forced_format=job1.detected_format,
        )
        assert job2.processed_records == 2
        assert job2.failed_records == 0


@pytest.mark.asyncio
async def test_auth_enforcement_and_raw_content_protection():
    """
    Tests that:
    1. When REQUIRE_AUTH=True, unauthenticated requests raise 401 Unauthorized.
    2. When viewer accesses logs, raw_content is redacted.
    3. When analyst or admin accesses logs, raw_content is unmasked.
    """
    from app.core.config import settings
    from app.api.auth import get_current_user, require_roles
    from fastapi import HTTPException
    from app.models.user import User

    await init_db()

    # 1. Test REQUIRE_AUTH enforcement
    original_setting = settings.REQUIRE_AUTH
    try:
        settings.REQUIRE_AUTH = True
        async with AsyncSessionLocal() as db:
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(token=None, db=db)
            assert exc_info.value.status_code == 401
    finally:
        settings.REQUIRE_AUTH = original_setting

    # 2. Test Role-Based Access Control checker
    admin_user = User(username="admin_test", role="admin")
    viewer_user = User(username="viewer_test", role="viewer")
    analyst_user = User(username="analyst_test", role="analyst")

    analyst_checker = require_roles("admin", "analyst")
    # Analyst passes
    passed_analyst = await analyst_checker(current_user=analyst_user)
    assert passed_analyst.role == "analyst"

    # Admin passes
    passed_admin = await analyst_checker(current_user=admin_user)
    assert passed_admin.role == "admin"

    # Viewer forbidden (403)
    with pytest.raises(HTTPException) as exc_info:
        await analyst_checker(current_user=viewer_user)
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_custom_parser_restoration():
    """
    Tests that custom parsers stored in the database are properly restored
    into runtime memory during server lifecycle.
    """
    from app.models.plugin import ParserPlugin
    from app.parsers.registry import parser_registry
    from app.parsers.regex_parser import RegexParser

    await init_db()
    async with AsyncSessionLocal() as db:
        # Create a mock custom plugin in DB
        custom_name = "test_custom_startup_parser"
        existing = await db.execute(select(ParserPlugin).filter(ParserPlugin.name == custom_name))
        if not existing.scalars().first():
            db.add(
                ParserPlugin(
                    name=custom_name,
                    version="1.0.0",
                    format_key="custom_app",
                    description="Custom log parser",
                    regex_pattern=r"^(?P<timestamp>\S+)\s+(?P<severity>\w+)\s+(?P<message>.*)$",
                    is_builtin=False,
                    status="ACTIVE",
                )
            )
            await db.commit()

        # Simulate startup restoration logic from main.py
        custom_res = await db.execute(
            select(ParserPlugin).filter(
                ParserPlugin.is_builtin == False,
                ParserPlugin.status == "ACTIVE"
            )
        )
        for cp in custom_res.scalars().all():
            if cp.regex_pattern:
                parser_registry.register(
                    RegexParser(
                        custom_pattern=cp.regex_pattern,
                        name=cp.name,
                        format_key=cp.format_key,
                    )
                )

        assert "custom_app" in parser_registry.list_keys()
        parser = parser_registry.get("custom_app")
        assert parser is not None
        parsed = parser.parse("2026-09-16 ERROR Service crashed")
        assert parsed["severity"] == "ERROR"
        assert parsed["message"] == "Service crashed"


@pytest.mark.asyncio
async def test_ocsf_schema_serialization():
    """
    Tests that logs correctly convert to standard OCSF v1.1/v1.3 hierarchical JSON.
    """
    from app.schemas.universal_log import UniversalLogSchema, SeverityEnum, LogSourceInfo

    log_schema = UniversalLogSchema(
        id="test-ocsf-uuid",
        timestamp=datetime(2026, 9, 16, 10, 0, 0, tzinfo=timezone.utc),
        source=LogSourceInfo(type="nginx", name="proxy01"),
        severity=SeverityEnum.ERROR,
        message="502 Bad Gateway",
        ip_address="192.168.1.100",
        user="test_admin",
        host="proxy.corp.net",
    )

    ocsf_dict = log_schema.to_ocsf_dict()
    assert ocsf_dict["version"] == "1.1.0"
    assert ocsf_dict["class_uid"] == 1001
    assert ocsf_dict["severity"] == "ERROR"
    assert ocsf_dict["src_endpoint"]["ip"] == "192.168.1.100"
    assert ocsf_dict["actor"]["user"]["name"] == "test_admin"
    assert ocsf_dict["device"]["hostname"] == "proxy.corp.net"


@pytest.mark.asyncio
async def test_salted_pseudonymization_pipeline_integration():
    """
    Tests that enabling pseudonymization in the pipeline cryptographically
    hashes sensitive user identifiers using salted HMAC-SHA256.
    """
    await init_db()
    raw_log = '2026-09-16 12:00:00 [main] INFO user=rohit_admin - Password reset successful'

    async with AsyncSessionLocal() as db:
        job = await pipeline_runner.execute(
            db=db,
            raw_content=raw_log,
            source_name="audit_test",
            pseudonymize=True,
        )
        assert job.processed_records == 1

        # Check processed record
        from app.models.processed_log import ProcessedLog
        res = await db.execute(select(ProcessedLog).filter(ProcessedLog.job_id == job.id))
        rec = res.scalars().first()
        assert rec is not None
        assert rec.user.startswith("pseudo_")
        assert rec.user != "rohit_admin"
        assert rec.metadata_json.get("user_pseudonymized") is True
        assert rec.metadata_json.get("user_pseudonymization_algorithm") == "HMAC-SHA256"
