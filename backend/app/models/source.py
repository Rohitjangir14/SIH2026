import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, JSON
from app.core.database import Base


class LogSource(Base):
    __tablename__ = "log_sources"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True, nullable=False)
    source_type = Column(String, nullable=False)  # linux, windows, apache, nginx, aws, app, custom
    configuration = Column(JSON, default=dict)
    api_key = Column(String, unique=True, index=True, default=lambda: f"ulpf_{uuid.uuid4().hex[:16]}")
    status = Column(String, default="ACTIVE")  # ACTIVE, INACTIVE, PAUSED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
