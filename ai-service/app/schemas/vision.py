from pydantic import BaseModel
from typing import Optional

class AgeMetrics(BaseModel):
    grade_level: float
    reading_ease: float
    age_appropriate: bool

class GroundingSource(BaseModel):
    grounded: bool
    source_title: Optional[str] = None
    source_url: Optional[str] = None

class VisionRecognitionResponse(BaseModel):
    success: bool
    identified: bool
    is_safe: bool = True
    safety_flag_reason: Optional[str] = None
    object_name: Optional[str] = None
    kid_summary: Optional[str] = None
    fun_fact: Optional[str] = None
    action_prompt: Optional[str] = None
    readability: Optional[AgeMetrics] = None
    grounding: Optional[GroundingSource] = None
    confidence_note: Optional[str] = None
    error: Optional[str] = None