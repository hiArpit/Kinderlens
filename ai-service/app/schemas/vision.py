from pydantic import BaseModel, Field
from typing import Optional

class AgeMetrics(BaseModel):
    grade_level: float
    reading_ease: float
    age_appropriate: bool

class GroundingSource(BaseModel):
    grounded: bool
    source_title: Optional[str] = None
    source_url: Optional[str] = None

class VocabularyTerm(BaseModel):
    term: str
    meaning: str

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
    possible_objects: list[str] = Field(default_factory=list)
    needs_clearer_image: bool = False
    error: Optional[str] = None
    vocabulary: list[VocabularyTerm] = Field(default_factory=list)

class QuizQuestion(BaseModel):
    question: str
    options: list[str] = Field(min_length=2, max_length=4)
    answer: int = Field(ge=0, le=3)
    explanation: str

class QuizResponse(BaseModel):
    success: bool
    object_name: Optional[str] = None
    object_names: list[str] = Field(default_factory=list)
    questions: list[QuizQuestion] = Field(default_factory=list)
    grounding: Optional[GroundingSource] = None
    grounding_sources: list[GroundingSource] = Field(default_factory=list)
    is_safe: bool = True
    confidence_note: Optional[str] = None
    error: Optional[str] = None

class StoryResponse(BaseModel):
    success: bool
    object_name: Optional[str] = None
    title: Optional[str] = None
    paragraphs: list[str] = Field(default_factory=list)
    vocabulary: list[VocabularyTerm] = Field(default_factory=list)
    grounding: Optional[GroundingSource] = None
    is_safe: bool = True
    confidence_note: Optional[str] = None
    error: Optional[str] = None