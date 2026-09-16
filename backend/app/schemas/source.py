from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class LogSourceCreate(BaseModel):
    name: str
    source_type: str  # linux, windows, apache, nginx, aws, app, custom
    configuration: Optional[Dict[str, Any]] = {}


class LogSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    source_type: str
    configuration: Dict[str, Any]
    api_key: str
    status: str
    created_at: datetime
