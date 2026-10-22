from pydantic import BaseModel
from typing import Optional

class VisionRecognitionResponse(BaseModel):
    success: bool
    identified: bool
    object_name: Optional[str] = None
    raw_description: Optional[str] = None
    confidence_note: Optional[str] = None
    error: Optional[str] = None