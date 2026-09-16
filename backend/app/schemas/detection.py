from typing import List, Optional
from pydantic import BaseModel, Field


class DetectionCandidate(BaseModel):
    format: str = Field(..., description="Format name e.g. apache, syslog, json, csv, nginx, windows")
    parser_name: str = Field(..., description="Recommended parser class/plugin name")
    confidence: float = Field(..., description="Confidence score from 0.0 to 1.0")
    reason: str = Field(..., description="Explanation of detected signatures")


class DetectionResponse(BaseModel):
    detected_format: str
    recommended_parser: str
    confidence: float
    reason: str
    candidates: List[DetectionCandidate] = []
    sample_preview: Optional[str] = None
