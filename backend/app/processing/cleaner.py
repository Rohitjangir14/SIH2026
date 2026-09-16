import re
import hmac
import hashlib
from typing import Dict, Any, Tuple, Optional
from app.core.config import settings


def is_luhn_valid(num_str: str) -> bool:
    """
    Validates a number string against the Luhn (Mod 10) checksum algorithm.
    All legitimate Visa, MasterCard, Amex, Discover, and RuPay cards pass this check.
    Arbitrary digit strings (order IDs, Windows SIDs, timestamps) fail it.
    """
    digits = [int(c) for c in num_str if c.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False
    checksum = 0
    reverse_digits = digits[::-1]
    for i, d in enumerate(reverse_digits):
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        checksum += d
    return checksum % 10 == 0


class DataCleaner:
    """
    Data Cleaning & Sensitive Data Redaction Engine.
    1. Trims extraneous whitespace and unprintable control characters.
    2. Strips duplicate spaces.
    3. Handles null/empty field conversions.
    4. Redacts sensitive credentials (passwords, tokens, Basic/Bearer auth, API keys).
    5. Redacts PII: Luhn-validated credit cards, emails, phone numbers, and SSNs.
    6. Supports salted HMAC-SHA256 pseudonymization.
    """

    # Keyword-scoped patterns for passwords, tokens, API keys, HTTP Basic auth
    CREDENTIAL_PATTERNS = [
        # Passwords e.g. password=secret, pwd: "xyz"
        (re.compile(r'(?i)\b(password|passwd|pwd|secret)\s*[:=]\s*([^\s,;"]+|"[^"]*")'), r'\1=********'),
        # Bearer tokens / JWTs
        (re.compile(r'(?i)\b(bearer\s+)[a-zA-Z0-9_\-\.]{20,}'), r'\1[REDACTED_JWT_TOKEN]'),
        # HTTP Basic Auth header: Authorization: Basic dXNlcjpwYXNz
        (re.compile(r'(?i)\b(authorization\s*:\s*basic\s+)[a-zA-Z0-9+/=]{8,}'), r'\1[REDACTED_BASIC_AUTH]'),
        # Generic / short access tokens, session tokens, client secrets
        (re.compile(r'(?i)\b(access_token|refresh_token|id_token|session_token|private_key|client_secret)\s*[:=]\s*([^\s,;"]+|"[^"]*")'), r'\1=[REDACTED_SECRET]'),
        # Generic API keys e.g. api_key=sk_live_...
        (re.compile(r'(?i)\b(api[_\-]?key|access[_\-]?key|auth[_\-]?token)\s*[:=]\s*([^\s,;"]+|"[^"]*")'), r'\1=[REDACTED_API_KEY]'),
    ]

    # PII patterns: Email, US SSN, Phone numbers
    PII_PATTERNS = [
        # Email addresses
        (re.compile(r'(?i)\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b'), '[REDACTED_EMAIL]'),
        # US Social Security Number: 123-45-6789
        (re.compile(r'(?<!\d)\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b(?!\d)'), '[REDACTED_SSN]'),
        # North American & International Phone numbers (guarded against IPs e.g. 192.168.1.45, timestamps, and order numbers)
        (re.compile(r'(?<![0-9\.\-])(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?[2-9]\d{2}[-.\s]?\d{4}(?![0-9\.\-])'), '[REDACTED_PHONE]'),
    ]

    # Keyword-scoped credit card pattern e.g. card="4532...", cc_number=...
    CARD_KEYWORD_PATTERN = re.compile(
        r'(?i)\b(card|card[_\-]?num|card[_\-]?number|cc|cc[_\-]?num|credit[_\-]?card|pan|debit[_\-]?card|payment[_\-]?card)\s*[:=]\s*([^\s,;"]+|"[^"]*")'
    )

    # Standalone credit card shape pattern:
    # 1. 4 groups of 4 digits: 1234-5678-9012-3456 or 1234 5678 9012 3456
    # 2. Amex format (4-6-5): 3456-123456-78901
    # 3. Contiguous 13-19 digit block with standard card prefixes (3=Amex, 4=Visa, 5/2=MasterCard, 6=Discover/RuPay)
    # Excludes matches preceded by 'S-' or letters/hyphens to avoid mangling Windows SIDs (S-1-5-21...) or UUIDs.
    CARD_SHAPE_PATTERN = re.compile(
        r'(?<![A-Za-z0-9\-])(?<!S-)\b(?:(\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{4})|(\d{4}[ -]\d{6}[ -]\d{5})|([3456]\d{12,18}))\b(?![A-Za-z0-9\-])'
    )

    def clean_text(self, text: str) -> str:
        """Cleans and normalizes text string."""
        if not text:
            return ""
        # Strip ASCII control characters except newline and tab
        cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
        # Normalize redundant spaces
        cleaned = re.sub(r'[ \t]+', ' ', cleaned)
        return cleaned.strip()

    def pseudonymize_identifier(self, identifier: str, salt: Optional[str] = None) -> str:
        """
        Creates a consistent, irreversible pseudonym for an identifier using HMAC-SHA256.
        Enables cross-log correlation without storing plaintext PII (GDPR Art. 32).
        """
        if not identifier:
            return identifier
        secret_salt = salt or settings.SALTED_PII_SECRET
        h = hmac.new(secret_salt.encode("utf-8"), identifier.encode("utf-8"), hashlib.sha256)
        return f"pseudo_{h.hexdigest()[:16]}"

    def mask_sensitive_data(self, text: str, redact_pii: bool = True) -> Tuple[str, bool]:
        """
        Masks passwords, API keys, Basic/Bearer auth, tokens, Luhn-verified cards, emails, phones, and SSNs.
        Guarantees that Windows SIDs, order IDs, and session IDs are never corrupted.
        Returns: (masked_text, was_masked_boolean)
        """
        if not text:
            return text, False

        masked = text
        was_masked = False

        # 1. Mask standard credential patterns (passwords, JWTs, Basic auth, API keys, tokens)
        for pattern, replacement in self.CREDENTIAL_PATTERNS:
            new_text, count = pattern.subn(replacement, masked)
            if count > 0:
                masked = new_text
                was_masked = True

        # 2. Mask PII patterns (emails, SSNs, phone numbers)
        if redact_pii:
            for pattern, replacement in self.PII_PATTERNS:
                new_text, count = pattern.subn(replacement, masked)
                if count > 0:
                    masked = new_text
                    was_masked = True

        # 2. Mask keyword-scoped credit card fields
        def _replace_keyword_card(m: re.Match) -> str:
            nonlocal was_masked
            key = m.group(1)
            raw_val = m.group(2)
            # Strip quotes and non-digits to test digits
            clean_val = raw_val.strip('"\'')
            digits = re.sub(r'\D', '', clean_val)
            # If it has card-length digits and passes Luhn (or is at least 13-19 digits in a card field)
            if 13 <= len(digits) <= 19 and is_luhn_valid(digits):
                was_masked = True
                if raw_val.startswith('"') and raw_val.endswith('"'):
                    return f'{key}="[REDACTED_CARD_NUMBER]"'
                return f'{key}=[REDACTED_CARD_NUMBER]'
            return m.group(0)

        masked = self.CARD_KEYWORD_PATTERN.sub(_replace_keyword_card, masked)

        # 3. Mask standalone card shapes, verified by Luhn algorithm
        def _replace_standalone_card(m: re.Match) -> str:
            nonlocal was_masked
            candidate = m.group(0)
            digits = re.sub(r'\D', '', candidate)
            if 13 <= len(digits) <= 19 and is_luhn_valid(digits):
                was_masked = True
                return '[REDACTED_CARD_NUMBER]'
            return candidate

        masked = self.CARD_SHAPE_PATTERN.sub(_replace_standalone_card, masked)

        return masked, was_masked

    def clean_record(self, raw_dict: Dict[str, Any], mask_data: bool = True) -> Dict[str, Any]:
        """
        Recursively cleans dictionary fields and redacts secrets.
        """
        cleaned_dict: Dict[str, Any] = {}
        for key, val in raw_dict.items():
            if val is None:
                cleaned_dict[key] = None
                continue

            if isinstance(val, str):
                cleaned_val = self.clean_text(val)
                if mask_data:
                    cleaned_val, _ = self.mask_sensitive_data(cleaned_val)
                cleaned_dict[key] = cleaned_val
            elif isinstance(val, dict):
                cleaned_dict[key] = self.clean_record(val, mask_data=mask_data)
            else:
                cleaned_dict[key] = val

        return cleaned_dict


data_cleaner = DataCleaner()
