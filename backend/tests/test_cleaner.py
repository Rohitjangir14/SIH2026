import pytest
from app.processing.cleaner import data_cleaner


def test_clean_text_spaces():
    raw = "   ERROR   Login   failed   \t\n"
    cleaned = data_cleaner.clean_text(raw)
    assert cleaned == "ERROR Login failed"


def test_mask_password():
    raw = "Authentication failed for user=ronak with password=SuperSecretPassword123!"
    masked, was_masked = data_cleaner.mask_sensitive_data(raw)
    assert was_masked is True
    assert "SuperSecretPassword123!" not in masked
    assert "password=********" in masked


def test_mask_bearer_jwt():
    raw = "Request authorized with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.signature"
    masked, was_masked = data_cleaner.mask_sensitive_data(raw)
    assert was_masked is True
    assert "[REDACTED_JWT_TOKEN]" in masked


def test_mask_api_key():
    raw = "Connected via api_key=sk_live_99881122334455"
    masked, was_masked = data_cleaner.mask_sensitive_data(raw)
    assert was_masked is True
    assert "[REDACTED_API_KEY]" in masked
