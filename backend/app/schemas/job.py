from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class JobCreate(BaseModel):
    source: str
    file_name: Optional[str] = None
    detected_format: Optional[str] = None
    parser_used: Optional[str] = None
    raw_content: Optional[str] = None


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source: str
    file_name: Optional[str] = None
    detected_format: Optional[str] = None
    parser_used: Optional[str] = None
    total_records: int
    processed_records: int
    failed_records: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: float
    error_message: Optional[str] = None
    success_rate: float = Field(0.0, description="Percentage of records successfully parsed and validated")
