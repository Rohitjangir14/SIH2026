import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Index
from app.core.database import Base


class RawLog(Base):
    __tablename__ = "raw_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id = Column(String, nullable=True, index=True)
    job_id = Column(String, ForeignKey("processing_jobs.id"), nullable=True, index=True)
    file_name = Column(String, nullable=True)
    source_type = Column(String, nullable=True)
    raw_content = Column(Text, nullable=False)
    received_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    processing_status = Column(String, default="PENDING")  # PENDING, PROCESSED, FAILED, INVALID
