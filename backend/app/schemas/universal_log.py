from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class SeverityEnum(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"
    UNKNOWN = "UNKNOWN"


class LogSourceInfo(BaseModel):
    type: str = Field(..., description="Type of source e.g. linux, windows, apache, nginx, aws, app, custom")
    name: str = Field(..., description="Identifier name of the source")


class UniversalLogSchema(BaseModel):
    """
    Universal Log Schema standardizing heterogeneous log outputs.
    """
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Unique UUID for the log record")
    timestamp: datetime = Field(..., description="ISO-8601 UTC timestamp")
    source: LogSourceInfo = Field(..., description="Source system information")
    severity: SeverityEnum = Field(default=SeverityEnum.UNKNOWN, description="Standardized severity level")
    event_type: Optional[str] = Field(default=None, description="Category of event e.g. authentication, http_request")
    message: str = Field(..., description="Main log text or description")
    
    # Optional context fields
    host: Optional[str] = Field(default=None, description="Hostname or FQDN")
    user: Optional[str] = Field(default=None, description="Username or Subject")
    ip_address: Optional[str] = Field(default=None, description="Remote or client IP address")
    application: Optional[str] = Field(default=None, description="Application or service name")
    environment: Optional[str] = Field(default=None, description="Environment e.g. production, staging")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary additional parsed key-values")

    # OCSF (Open Cybersecurity Schema Framework) & ECS Alignment
    class_uid: Optional[int] = Field(default=1001, description="OCSF Class UID (e.g. 1001 for System Activity)")
    category_uid: Optional[int] = Field(default=1, description="OCSF Category UID")
    ocsf_class: Optional[str] = Field(default="system_activity", description="OCSF Event Class Name")
    network: Optional[Dict[str, Any]] = Field(default=None, description="ECS/OCSF Network Endpoint details")
    device: Optional[Dict[str, Any]] = Field(default=None, description="ECS/OCSF Device details")

    def to_ocsf_dict(self) -> Dict[str, Any]:
        """Serializes canonical record into hierarchical OCSF schema."""
        return {
            "version": "1.1.0",
            "class_uid": self.class_uid,
            "category_uid": self.category_uid,
            "class_name": self.ocsf_class,
            "time": self.timestamp.isoformat(),
            "severity": self.severity.value,
            "message": self.message,
            "metadata": {
                "id": self.id,
                "original_time": self.timestamp.isoformat(),
                "product": {"name": "ULPF", "version": "1.0.0"},
                **self.metadata,
            },
            "src_endpoint": {"ip": self.ip_address} if self.ip_address else None,
            "actor": {"user": {"name": self.user}} if self.user else None,
            "device": {"hostname": self.host} if self.host else None,
        }


class ProcessedLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    raw_log_id: Optional[str] = None
    job_id: Optional[str] = None
    timestamp: datetime
    severity: str
    event_type: Optional[str] = None
    message: str
    host: Optional[str] = None
    user: Optional[str] = None
    ip_address: Optional[str] = None
    application: Optional[str] = None
    environment: Optional[str] = None
    source_type: Optional[str] = None
    source_name: Optional[str] = None
    metadata_json: Dict[str, Any] = {}
    is_valid: bool = True
    created_at: datetime
    raw_content: Optional[str] = None


class LogQueryFilter(BaseModel):
    query: Optional[str] = None
    severity: Optional[str] = None
    source_type: Optional[str] = None
    source_name: Optional[str] = None
    host: Optional[str] = None
    user: Optional[str] = None
    ip_address: Optional[str] = None
    event_type: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    page: int = 1
    page_size: int = 50
