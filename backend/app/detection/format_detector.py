import json
import re
from typing import List, Optional, Tuple
from app.parsers.registry import parser_registry
from app.schemas.detection import DetectionResponse, DetectionCandidate


class FormatDetector:
    """
    Automatic format detection engine combining:
    1. File extension heuristics
    2. Structural syntax checks (JSON / CSV)
    3. Known log signature pattern matching (Apache, Nginx, Syslog, Windows)
    4. Parser confidence scoring across sample lines
    """

    def detect(self, sample_content: str, filename: Optional[str] = None) -> DetectionResponse:
        if not sample_content or not sample_content.strip():
            return DetectionResponse(
                detected_format="unknown",
                recommended_parser="Generic Regex Parser",
                confidence=0.0,
                reason="Input content is empty",
                candidates=[],
                sample_preview="",
            )

        # Get first few non-empty lines for inspection
        lines = [line.strip() for line in sample_content.splitlines() if line.strip()]
        if not lines:
            return DetectionResponse(
                detected_format="unknown",
                recommended_parser="Generic Regex Parser",
                confidence=0.0,
                reason="No readable log lines found",
                candidates=[],
                sample_preview="",
            )

        preview_sample = "\n".join(lines[:3])
        candidates: List[DetectionCandidate] = []

        # 1. Check for JSON array, pretty-printed JSON, or JSON lines
        content_stripped = sample_content.strip()
        stripped_first = lines[0].strip()

        # Direct full parse check
        is_full_json = False
        try:
            full_parsed = json.loads(content_stripped)
            is_full_json = True
            if isinstance(full_parsed, list) and len(full_parsed) > 0 and isinstance(full_parsed[0], dict):
                candidates.append(DetectionCandidate(
                    format="json",
                    parser_name="JSON Parser",
                    confidence=0.99,
                    reason="Valid JSON Array of structured log objects detected"
                ))
            elif isinstance(full_parsed, dict):
                candidates.append(DetectionCandidate(
                    format="json",
                    parser_name="JSON Parser",
                    confidence=0.99,
                    reason="Valid single JSON structured log object detected"
                ))
        except Exception:
            pass

        # If not full JSON (e.g. truncated sample from larger array), check streaming decode
        if not is_full_json:
            # Array start check
            if content_stripped.startswith("["):
                content_after_bracket = content_stripped.lstrip("[").strip()
                if content_after_bracket:
                    try:
                        obj, _ = json.JSONDecoder().raw_decode(content_after_bracket)
                        if isinstance(obj, dict):
                            candidates.append(DetectionCandidate(
                                format="json",
                                parser_name="JSON Parser",
                                confidence=0.99,
                                reason="Valid JSON Array with structured objects detected (streaming/truncated)"
                            ))
                    except Exception:
                        # Regex signature check for JSON array of objects: e.g. [ { "timestamp": ...
                        if re.search(r'^\s*\[\s*\{', content_stripped):
                            candidates.append(DetectionCandidate(
                                format="json",
                                parser_name="JSON Parser",
                                confidence=0.95,
                                reason="JSON Array syntax pattern identified with nested object keys"
                            ))

            # Pretty-printed multi-line JSON object check
            elif content_stripped.startswith("{"):
                try:
                    obj, _ = json.JSONDecoder().raw_decode(content_stripped)
                    if isinstance(obj, dict):
                        candidates.append(DetectionCandidate(
                            format="json",
                            parser_name="JSON Parser",
                            confidence=0.98,
                            reason="Pretty-printed multi-line JSON object detected"
                        ))
                except Exception:
                    # Partial / truncated object check e.g. { "timestamp": ...
                    if re.search(r'^\s*\{\s*"[A-Za-z0-9_]+"\s*:', content_stripped):
                        candidates.append(DetectionCandidate(
                            format="json",
                            parser_name="JSON Parser",
                            confidence=0.95,
                            reason="Structured JSON key-value syntax detected"
                        ))

            # Newline-Delimited JSON (NDJSON) check on individual lines
            elif stripped_first.startswith("{"):
                try:
                    obj = json.loads(stripped_first)
                    if isinstance(obj, dict):
                        candidates.append(DetectionCandidate(
                            format="json",
                            parser_name="JSON Parser",
                            confidence=0.98,
                            reason="Valid Newline-Delimited JSON (NDJSON) line detected"
                        ))
                except Exception:
                    pass

        # 2. Check each registered parser's detect() score over the first sample lines
        parsers = parser_registry.get_all()
        sample_line = lines[0]
        # If first line was header in CSV or opening bracket in JSON, test second line as well
        sample_line_alt = lines[1] if len(lines) > 1 else lines[0]

        for p in parsers:
            score1 = p.detect(sample_line)
            score2 = p.detect(sample_line_alt)
            best_score = max(score1, score2)

            if best_score > 0.3:
                # Determine reason based on format
                reason = self._generate_reason(p.format_key, best_score, sample_line)
                # Avoid duplicate candidate format
                if not any(c.format == p.format_key for c in candidates):
                    candidates.append(DetectionCandidate(
                        format=p.format_key,
                        parser_name=p.name,
                        confidence=round(best_score, 2),
                        reason=reason
                    ))

        # 3. Consider file extension hints if available
        if filename:
            ext = filename.lower().split(".")[-1]
            ext_map = {
                "json": ("json", "JSON Parser"),
                "csv": ("csv", "CSV Delimited Parser"),
                "tsv": ("csv", "CSV Delimited Parser"),
            }
            if ext in ext_map:
                fmt, p_name = ext_map[ext]
                # Boost confidence if extension matches
                found = False
                for c in candidates:
                    if c.format == fmt:
                        c.confidence = min(1.0, c.confidence + 0.1)
                        c.reason += f" (Matches file extension .{ext})"
                        found = True
                        break
                if not found:
                    candidates.append(DetectionCandidate(
                        format=fmt,
                        parser_name=p_name,
                        confidence=0.75,
                        reason=f"Identified by file extension .{ext}"
                    ))

        # Sort candidates by confidence descending
        candidates.sort(key=lambda x: x.confidence, reverse=True)

        if not candidates:
            # Fallback to Generic Regex
            fallback = DetectionCandidate(
                format="regex",
                parser_name="Generic Regex Parser",
                confidence=0.40,
                reason="No specific known signature matched; falling back to generic log parser"
            )
            candidates.append(fallback)

        best_match = candidates[0]

        return DetectionResponse(
            detected_format=best_match.format,
            recommended_parser=best_match.parser_name,
            confidence=best_match.confidence,
            reason=best_match.reason,
            candidates=candidates,
            sample_preview=preview_sample[:300] + ("..." if len(preview_sample) > 300 else ""),
        )

    def _generate_reason(self, format_key: str, score: float, line: str) -> str:
        if format_key == "apache":
            return "Matched Apache Common/Combined HTTP access log syntax with HTTP status code and request URI."
        elif format_key == "nginx":
            return "Matched Nginx log pattern with severity bracket and worker process identifier."
        elif format_key == "syslog":
            return "Matched BSD Syslog (RFC 3164) timestamp and daemon tag syntax."
        elif format_key == "windows":
            return "Matched Windows Event Log syntax containing EventID, Level, and Channel."
        elif format_key == "json":
            return "Matched structured JSON payload with log-level attributes."
        elif format_key == "csv":
            return "Matched comma-separated value structure with corresponding field columns."
        elif format_key == "regex":
            return "Matched generic bracketed log line with timestamp and severity."
        return f"Matched pattern signature for {format_key}."


format_detector = FormatDetector()
