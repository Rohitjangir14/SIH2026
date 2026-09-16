import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, JSON, DateTime, Text
from app.core.database import Base


class ParserPlugin(Base):
    __tablename__ = "parser_plugins"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True, nullable=False)
    version = Column(String, default="1.0.0")
    format_key = Column(String, nullable=False)  # syslog, apache, nginx, json, csv, windows, custom
    description = Column(String, nullable=True)
    regex_pattern = Column(Text, nullable=True)
    is_builtin = Column(Boolean, default=False)
    status = Column(String, default="ACTIVE")  # ACTIVE, DISABLED
    configuration = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
