from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class AnalyticsSummary(BaseModel):
    total_logs: int
    processed_logs: int
    failed_logs: int
    error_logs: int
    warning_logs: int
    info_logs: int
    debug_logs: int
    critical_logs: int
    success_rate: float
    error_rate: float
    avg_processing_time_ms: float
    total_jobs: int


class SourceDistributionItem(BaseModel):
    source: str
    count: int
    percentage: float


class SeverityDistributionItem(BaseModel):
    severity: str
    count: int
    color: str


class TimelinePoint(BaseModel):
    time_bucket: str
    count: int
    error_count: int
