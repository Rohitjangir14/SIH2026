import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from app.core.database import Base


class ValidationErrorRecord(Base):
    __tablename__ = "validation_errors"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    raw_log_id = Column(String, ForeignKey("raw_logs.id"), nullable=True, index=True)
    job_id = Column(String, ForeignKey("processing_jobs.id"), nullable=True, index=True)
    raw_content = Column(Text, nullable=False)
    error_type = Column(String, nullable=False)  # PARSE_ERROR, SCHEMA_VALIDATION_ERROR, UNKNOWN_FORMAT
    error_details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
