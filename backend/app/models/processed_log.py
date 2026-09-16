import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Boolean, JSON, ForeignKey, Index
from app.core.database import Base


class ProcessedLog(Base):
    __tablename__ = "processed_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    raw_log_id = Column(String, ForeignKey("raw_logs.id"), nullable=True, index=True)
    job_id = Column(String, ForeignKey("processing_jobs.id"), nullable=True, index=True)
    
    # Universal Log Schema standard fields
    timestamp = Column(DateTime, nullable=False, index=True)
    severity = Column(String, nullable=False, index=True)  # DEBUG, INFO, WARNING, ERROR, CRITICAL, UNKNOWN
    event_type = Column(String, nullable=True, index=True)
    message = Column(Text, nullable=False)
    
    # Optional standard fields
    host = Column(String, nullable=True, index=True)
    user = Column(String, nullable=True, index=True)
    ip_address = Column(String, nullable=True, index=True)
    application = Column(String, nullable=True, index=True)
    environment = Column(String, nullable=True, index=True)
    
    # Source metadata
    source_type = Column(String, nullable=True, index=True)
    source_name = Column(String, nullable=True, index=True)
    
    # Flexible enrichment & original attributes
    metadata_json = Column(JSON, default=dict)
    
    is_valid = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_processed_logs_time_sev", "timestamp", "severity"),
    )
