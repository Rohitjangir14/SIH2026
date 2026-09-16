import pytest
from app.processing.cleaner import data_cleaner, is_luhn_valid


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


def test_windows_sid_not_corrupted():
    """Verify that Windows Security Identifiers (SIDs) are never mangled."""
    raw = "Logon event for Security ID: S-1-5-21-397955417-626881126-18844144-1010 Account: Administrator"
    masked, was_masked = data_cleaner.mask_sensitive_data(raw)
    assert was_masked is False
    assert masked == raw
    assert "S-1-5-21-397955417-626881126-18844144-1010" in masked


def test_order_and_session_id_not_corrupted():
    """Verify that numeric order IDs and hyphenated session IDs are not falsely flagged as cards."""
    raw_order = "Order completed for order_id=1234567890123 amount=$49.99"
    masked_order, was_masked_order = data_cleaner.mask_sensitive_data(raw_order)
    assert was_masked_order is False
    assert "order_id=1234567890123" in masked_order

    raw_session = "User active session=88291-30281-19283-11029 route=/checkout"
    masked_session, was_masked_session = data_cleaner.mask_sensitive_data(raw_session)
    assert was_masked_session is False
    assert "session=88291-30281-19283-11029" in masked_session


def test_valid_credit_cards_redacted():
    """Verify that actual Luhn-valid credit cards are properly redacted."""
    # 4532015012345671 is a valid Visa test card number passing Luhn
    assert is_luhn_valid("4532015012345671") is True

    # Formatted 4x4
    raw_card = "Payment processed with card 4532-0150-1234-5671 for user ronak"
    masked_card, was_masked = data_cleaner.mask_sensitive_data(raw_card)
    assert was_masked is True
    assert "[REDACTED_CARD_NUMBER]" in masked_card
    assert "4532-0150-1234-5671" not in masked_card

    # Keyword-scoped
    raw_kw = 'Checkout payload: cc_number="4532015012345671" billing_zip="90210"'
    masked_kw, was_masked_kw = data_cleaner.mask_sensitive_data(raw_kw)
    assert was_masked_kw is True
    assert 'cc_number="[REDACTED_CARD_NUMBER]"' in masked_kw
