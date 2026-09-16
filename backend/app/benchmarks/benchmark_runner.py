import time
import random
import re
from typing import Dict, Any, List, Tuple
from app.detection.format_detector import format_detector
from app.parsers.registry import parser_registry
from app.processing.cleaner import data_cleaner, is_luhn_valid
from app.processing.normalizer import log_normalizer
from app.processing.validator import log_validator


# Realistic log generators for 7 distinct formats
SAMPLE_GENERATORS = {
    "apache": lambda i: f'192.168.1.{i % 250} - user_{i % 50} [13/Sep/2026:10:{i % 60:02d}:21 +0000] "GET /api/v1/resource/{i} HTTP/1.1" {200 if i % 5 != 0 else 500} {100 + i % 5000} "-" "Mozilla/5.0"',
    "syslog": lambda i: f'Sep 13 10:{i % 60:02d}:21 srv-{i % 10:02d} sshd[{1000 + i}]: Failed password for user_{i % 30} from 10.0.0.{i % 250} port {40000 + i % 10000} ssh2',
    "nginx": lambda i: f'2026/09/13 10:{i % 60:02d}:21 [error] {1000 + i}#{1000 + i}: *{i} connection reset by peer, client: 172.16.0.{i % 250}, server: api.internal, request: "POST /v1/checkout HTTP/1.1"',
    "windows": lambda i: f'2026-09-13 10:{i % 60:02d}:21 [Security] EventID=4625 Level=Information Host=DC-01 Message="Logon failed. Security ID: S-1-5-21-397955417-626881126-18844144-{1000 + i}, User: user_{i % 20}"',
    "json": lambda i: f'{{"timestamp": "2026-09-13T10:{i % 60:02d}:21.000Z", "log_level": "{"ERROR" if i % 4 == 0 else "INFO"}", "service": "payment-service", "message": "Transaction {i} completed", "user": "user_{i % 50}", "ip_address": "192.168.1.{i % 250}"}}',
    "csv": lambda i: f'2026-09-13 10:{i % 60:02d}:21,{"ERROR" if i % 3 == 0 else "INFO"},billing_svc,Invoice INV-2026-{i} generated,client_{i % 40},10.0.1.{i % 250},production',
    "sensitive_app": lambda i: f'[2026-09-13 10:{i % 60:02d}:21] ERROR auth.gateway: User admin login with password=SuperSecret{i}! card=4532015012345671 order_id={1000000000000 + i}',
}


def run_benchmark(num_records: int = 10000) -> Dict[str, Any]:
    """
    Executes a comprehensive stress test and benchmark across all pipeline stages:
    1. Dataset generation (Heterogeneous multi-format mix)
    2. Format detection speed and accuracy
    3. Cleaning and Luhn-verified PII redaction
    4. Parser throughput and latency
    5. Universal schema normalization and validation
    """
    print(f"[*] Generating {num_records} heterogeneous test logs across 7 formats...")
    keys = list(SAMPLE_GENERATORS.keys())
    dataset: List[Tuple[str, str]] = []  # (expected_format, raw_line)

    for i in range(num_records):
        fmt = keys[i % len(keys)]
        line = SAMPLE_GENERATORS[fmt](i)
        dataset.append((fmt, line))

    # 1. Benchmark: Format Detection on batches
    print("[*] Benchmarking Format Detection Engine...")
    detection_samples = [dataset[i][1] for i in range(min(500, len(dataset)))]
    t0 = time.perf_counter()
    detection_correct = 0
    for fmt, line in dataset[:min(500, len(dataset))]:
        res = format_detector.detect(line)
        # Check if detected format matches expected or matches equivalent family
        if res.detected_format == fmt or (fmt == "sensitive_app" and res.detected_format in ("regex", "custom")):
            detection_correct += 1
        elif fmt == "windows" and res.detected_format == "windows":
            detection_correct += 1
        elif fmt in ("apache", "nginx", "syslog", "json", "csv") and res.detected_format == fmt:
            detection_correct += 1

    detection_time = time.perf_counter() - t0
    detection_ops_sec = round(len(detection_samples) / max(detection_time, 0.0001), 2)
    detection_accuracy = round((detection_correct / len(detection_samples)) * 100, 2)

    # 2. Benchmark: PII Redaction & Cleaning Engine
    print("[*] Benchmarking Sensitive Data Redaction & Cleaning...")
    t0 = time.perf_counter()
    pii_redacted_count = 0
    sid_preserved_count = 0
    for _, line in dataset:
        cleaned, was_masked = data_cleaner.mask_sensitive_data(line)
        if was_masked:
            pii_redacted_count += 1
        if "S-1-5-21-" in line and "S-1-5-21-" in cleaned:
            sid_preserved_count += 1
        if "order_id=" in line and "order_id=" in cleaned:
            pass

    cleaner_time = time.perf_counter() - t0
    cleaner_ops_sec = round(num_records / max(cleaner_time, 0.0001), 2)

    # 3. Benchmark: End-to-End Parsing, Normalization, and Validation
    print("[*] Benchmarking Full Processing Pipeline (Parse + Normalize + Validate)...")
    t0 = time.perf_counter()
    parsed_count = 0
    valid_count = 0
    format_latencies: Dict[str, float] = {k: 0.0 for k in keys}
    format_counts: Dict[str, int] = {k: 0 for k in keys}

    for fmt, line in dataset:
        t_line_start = time.perf_counter()
        parser = parser_registry.get(fmt if fmt != "sensitive_app" else "regex")
        if not parser:
            parser = parser_registry.get("regex")

        raw_parsed = parser.parse(line) if parser else None
        if raw_parsed:
            parsed_count += 1
            # Clean and redact
            cleaned_record = data_cleaner.clean_record(raw_parsed, mask_data=True)
            # Normalize to Universal Log Schema
            record = log_normalizer.normalize_record(
                cleaned_dict=cleaned_record,
                source_type=fmt,
                source_name=f"bench_{fmt}",
                record_id=f"bench-{parsed_count}",
            )
            # Validate
            is_valid, _ = log_validator.validate(record)
            if is_valid:
                valid_count += 1

        t_line_duration = time.perf_counter() - t_line_start
        format_latencies[fmt] += t_line_duration
        format_counts[fmt] += 1

    pipeline_time = time.perf_counter() - t0
    pipeline_ops_sec = round(num_records / max(pipeline_time, 0.0001), 2)
    avg_latency_us = round((pipeline_time / num_records) * 1_000_000, 2)  # microseconds

    # Format-specific latency breakdown in microseconds
    format_breakdown_us = {
        fmt: round((format_latencies[fmt] / max(format_counts[fmt], 1)) * 1_000_000, 2)
        for fmt in keys
    }

    results = {
        "total_records_tested": num_records,
        "pipeline_throughput_logs_per_sec": pipeline_ops_sec,
        "average_latency_per_log_microseconds": avg_latency_us,
        "average_latency_per_log_milliseconds": round(avg_latency_us / 1000, 3),
        "pipeline_duration_seconds": round(pipeline_time, 3),
        "success_rate_percent": round((valid_count / num_records) * 100, 2),
        "format_detection": {
            "samples_tested": len(detection_samples),
            "detection_speed_logs_per_sec": detection_ops_sec,
            "accuracy_percent": detection_accuracy,
        },
        "pii_redaction": {
            "redaction_throughput_logs_per_sec": cleaner_ops_sec,
            "sensitive_records_masked": pii_redacted_count,
            "windows_sids_preserved_intact": sid_preserved_count,
        },
        "per_format_latency_microseconds": format_breakdown_us,
    }

    return results


if __name__ == "__main__":
    import sys
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
    res = run_benchmark(count)
    print("\n================ BENCHMARK RESULTS ================")
    print(f"Total Logs Processed      : {res['total_records_tested']:,}")
    print(f"Throughput                : {res['pipeline_throughput_logs_per_sec']:,} logs/second")
    print(f"Average Latency           : {res['average_latency_per_log_microseconds']} \u00b5s ({res['average_latency_per_log_milliseconds']} ms) per log")
    print(f"Processing Time           : {res['pipeline_duration_seconds']} seconds")
    print(f"Success Rate              : {res['success_rate_percent']}%")
    print(f"Format Detection Speed    : {res['format_detection']['detection_speed_logs_per_sec']:,} tests/sec (Accuracy: {res['format_detection']['accuracy_percent']}%)")
    print(f"PII Redaction Speed       : {res['pii_redaction']['redaction_throughput_logs_per_sec']:,} logs/sec")
    print("Per-Format Latency Breakdown (\u00b5s per log):")
    for fmt, lat in res['per_format_latency_microseconds'].items():
        print(f"  \u2022 {fmt:<15}: {lat} \u00b5s")
    print("====================================================\n")
