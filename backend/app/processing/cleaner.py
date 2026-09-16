import re
from typing import Dict, Any, Tuple


class DataCleaner:
    """
    Data Cleaning & Sensitive Data Redaction Engine.
    1. Trims extraneous whitespace and unprintable control characters.
    2. Strips duplicate spaces.
    3. Handles null/empty field conversions.
    4. Redacts sensitive credentials (passwords, tokens, API keys, bearer auth, credit cards).
    """

    # Regex patterns for sensitive data redaction
    SENSITIVE_PATTERNS = [
        # Passwords e.g. password=secret, pwd: "xyz"
        (re.compile(r'(?i)\b(password|passwd|pwd|secret)\s*[:=]\s*([^\s,;"]+|"[^"]*")'), r'\1=********'),
        # Bearer tokens / JWTs
        (re.compile(r'(?i)\b(bearer\s+)[a-zA-Z0-9_\-\.]{20,}'), r'\1[REDACTED_JWT_TOKEN]'),
        # Generic API keys e.g. api_key=sk_live_...
        (re.compile(r'(?i)\b(api[_\-]?key|access[_\-]?key|auth[_\-]?token)\s*[:=]\s*([^\s,;"]+|"[^"]*")'), r'\1=[REDACTED_API_KEY]'),
        # Credit card numbers (basic 16-digit pattern)
        (re.compile(r'\b(?:\d[ -]*?){13,16}\b'), r'[REDACTED_CARD_NUMBER]'),
    ]

    def clean_text(self, text: str) -> str:
        """Cleans and normalizes text string."""
        if not text:
            return ""
        # Strip ASCII control characters except newline and tab
        cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
        # Normalize redundant spaces
        cleaned = re.sub(r'[ \t]+', ' ', cleaned)
        return cleaned.strip()

    def mask_sensitive_data(self, text: str) -> Tuple[str, bool]:
        """
        Masks passwords, API keys, tokens, and credit cards.
        Returns: (masked_text, was_masked_boolean)
        """
        if not text:
            return text, False

        masked = text
        was_masked = False
        for pattern, replacement in self.SENSITIVE_PATTERNS:
            new_text, count = pattern.subn(replacement, masked)
            if count > 0:
                masked = new_text
                was_masked = True

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
