import asyncio
import os
import sys

# Add parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.core.database import init_db, AsyncSessionLocal
from app.processing.pipeline import pipeline_runner


async def seed_samples():
    print("[*] Initializing Database Schema...")
    await init_db()

    samples_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "samples"))
    if not os.path.exists(samples_dir):
        print(f"Directory {samples_dir} not found!")
        return

    sample_files = [
        ("apache_access.log", "Production Apache Cluster", "apache"),
        ("nginx_error.log", "Nginx Reverse Proxy", "nginx"),
        ("linux_syslog.log", "Linux Infrastructure", "syslog"),
        ("windows_event.log", "Windows Domain Controller", "windows"),
        ("aws_cloudwatch.json", "AWS CloudWatch Logs", "json"),
        ("app_errors.csv", "Payment Gateway Service", "csv"),
        ("sensitive_app.log", "Security Audit System", "regex"),
    ]

    async with AsyncSessionLocal() as db:
        for filename, source_name, forced_format in sample_files:
            file_path = os.path.join(samples_dir, filename)
            if not os.path.exists(file_path):
                print(f"Skipping {filename} (not found)")
                continue

            print(f"[>] Processing {filename} ({source_name})...")
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            job = await pipeline_runner.execute(
                db=db,
                raw_content=content,
                source_name=source_name,
                file_name=filename,
                forced_format=forced_format,
            )
            print(f"   [+] Job {job.id[:8]} completed: {job.processed_records} processed, {job.failed_records} failed ({job.duration_ms}ms)")

    print("\n[OK] Sample Data Ingestion Finished Successfully!")


if __name__ == "__main__":
    asyncio.run(seed_samples())
