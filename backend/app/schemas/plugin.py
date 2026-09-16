from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ParserPluginCreate(BaseModel):
    name: str
    version: str = "1.0.0"
    format_key: str
    description: Optional[str] = None
    regex_pattern: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = {}


class ParserPluginResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    version: str
    format_key: str
    description: Optional[str] = None
    regex_pattern: Optional[str] = None
    is_builtin: bool
    status: str
    configuration: Dict[str, Any]
    created_at: datetime


class ParserTestRequest(BaseModel):
    parser_name: str
    sample_log: str


class ParserTestResponse(BaseModel):
    success: bool
    parser_name: str
    parsed_fields: Dict[str, Any] = {}
    normalized_log: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
