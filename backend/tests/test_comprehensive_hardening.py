import pytest
import json
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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
    with open("../samples/aws_cloudwatch.json", "r") as f:
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
        assert job2.id != job1.id
