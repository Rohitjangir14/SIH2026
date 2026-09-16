import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime
from app.core.database import Base


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String, nullable=False)
    file_name = Column(String, nullable=True)
    detected_format = Column(String, nullable=True)
    parser_used = Column(String, nullable=True)
    total_records = Column(Integer, default=0)
    processed_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    status = Column(String, default="QUEUED")  # QUEUED, PROCESSING, COMPLETED, PARTIAL, FAILED
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Float, default=0.0)
    error_message = Column(String, nullable=True)
