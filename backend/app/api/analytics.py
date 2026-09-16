from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.processed_log import ProcessedLog
from app.models.raw_log import RawLog
from app.models.job import ProcessingJob
from app.schemas.analytics import (
    AnalyticsSummary,
    SourceDistributionItem,
    SeverityDistributionItem,
    TimelinePoint,
)

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])


@router.get("/summary", response_model=AnalyticsSummary)
async def get_summary_metrics(db: AsyncSession = Depends(get_db)):
    # Total raw ingested logs
    total_raw_res = await db.execute(select(func.count(RawLog.id)))
    total_logs = total_raw_res.scalar() or 0

    # Total processed logs
    proc_res = await db.execute(select(func.count(ProcessedLog.id)).filter(ProcessedLog.is_valid == True))
    processed_logs = proc_res.scalar() or 0

    # Failed logs
    failed_logs = max(0, total_logs - processed_logs)

    # Counts by severity
    sev_res = await db.execute(
        select(ProcessedLog.severity, func.count(ProcessedLog.id)).group_by(ProcessedLog.severity)
    )
    sev_counts = dict(sev_res.all())

    error_logs = sev_counts.get("ERROR", 0)
    warning_logs = sev_counts.get("WARNING", 0)
    info_logs = sev_counts.get("INFO", 0)
    debug_logs = sev_counts.get("DEBUG", 0)
    critical_logs = sev_counts.get("CRITICAL", 0)

    # Calculate rates
    success_rate = round((processed_logs / total_logs * 100) if total_logs > 0 else 100.0, 2)
    error_rate = round(((error_logs + critical_logs) / total_logs * 100) if total_logs > 0 else 0.0, 2)

    # Job metrics
    jobs_res = await db.execute(select(func.count(ProcessingJob.id), func.avg(ProcessingJob.duration_ms)))
    total_jobs, avg_dur = jobs_res.first() or (0, 0.0)

    return AnalyticsSummary(
        total_logs=total_logs,
        processed_logs=processed_logs,
        failed_logs=failed_logs,
        error_logs=error_logs,
        warning_logs=warning_logs,
        info_logs=info_logs,
        debug_logs=debug_logs,
        critical_logs=critical_logs,
        success_rate=success_rate,
        error_rate=error_rate,
        avg_processing_time_ms=round(avg_dur or 0.0, 2),
        total_jobs=total_jobs or 0,
    )


@router.get("/by-source", response_model=List[SourceDistributionItem])
async def get_logs_by_source(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(ProcessedLog.source_type, func.count(ProcessedLog.id))
        .group_by(ProcessedLog.source_type)
        .order_by(func.count(ProcessedLog.id).desc())
    )
    rows = res.all()
    total = sum(c for _, c in rows) or 1

    return [
        SourceDistributionItem(
            source=(s or "unknown").upper(),
            count=count,
            percentage=round(count / total * 100, 1),
        )
        for s, count in rows
    ]


@router.get("/by-severity", response_model=List[SeverityDistributionItem])
async def get_logs_by_severity(db: AsyncSession = Depends(get_db)):
    color_map = {
        "CRITICAL": "#a855f7", # Purple
        "ERROR": "#ef4444",    # Red
        "WARNING": "#f59e0b",  # Amber
        "INFO": "#3b82f6",     # Blue
        "DEBUG": "#10b981",    # Green
        "UNKNOWN": "#6b7280",  # Gray
    }

    res = await db.execute(
        select(ProcessedLog.severity, func.count(ProcessedLog.id)).group_by(ProcessedLog.severity)
    )
    rows = dict(res.all())

    order = ["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG", "UNKNOWN"]
    result = []
    for sev in order:
        count = rows.get(sev, 0)
        if count > 0 or not rows:
            result.append(
                SeverityDistributionItem(
                    severity=sev,
                    count=count,
                    color=color_map.get(sev, "#9ca3af"),
                )
            )
    return result


@router.get("/timeline", response_model=List[TimelinePoint])
async def get_timeline(db: AsyncSession = Depends(get_db)):
    # Returns recent logs grouped or distributed
    res = await db.execute(
        select(ProcessedLog.timestamp, ProcessedLog.severity)
        .order_by(ProcessedLog.timestamp.desc())
        .limit(100)
    )
    records = res.all()
    
    # Bucket by minute/hour representation
    buckets = {}
    for ts, sev in records:
        key = ts.strftime("%H:%M")
        if key not in buckets:
            buckets[key] = {"total": 0, "errors": 0}
        buckets[key]["total"] += 1
        if sev in ["ERROR", "CRITICAL"]:
            buckets[key]["errors"] += 1

    return [
        TimelinePoint(time_bucket=k, count=v["total"], error_count=v["errors"])
        for k, v in list(buckets.items())[:12]
    ]


@router.post("/benchmark")
async def execute_stress_benchmark(num_records: int = 5000):
    """
    Executes a real-time high-throughput stress test across heterogeneous log formats
    and returns exact throughput (logs/sec), latency (microseconds), detection accuracy,
    and PII redaction metrics.
    """
    from app.benchmarks.benchmark_runner import run_benchmark
    clamped_records = max(500, min(num_records, 25000))
    return run_benchmark(clamped_records)
