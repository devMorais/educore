from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class GenerationType(str, Enum):
    QUIZ = "quiz"
    SUMMARY = "summary"
    SLIDES = "slides"
    ACCESSIBILITY = "accessibility"


class DocumentResponse(BaseModel):
    id: int
    filename: str
    original_name: str
    status: DocumentStatus
    created_at: datetime

    class Config:
        from_attributes = True


class ChunkResponse(BaseModel):
    id: int
    document_id: int
    content: str
    chunk_index: int

    class Config:
        from_attributes = True


class GenerationRequest(BaseModel):
    document_id: int
    type: GenerationType
    options: Optional[dict] = {}


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None


class QuizResponse(BaseModel):
    document_id: int
    title: str
    questions: List[QuizQuestion]
    total_questions: int


class SummaryResponse(BaseModel):
    document_id: int
    title: str
    summary: str
    key_points: List[str]
    word_count: int


class SlideContent(BaseModel):
    title: str
    content: List[str]
    notes: Optional[str] = None


class SlidesResponse(BaseModel):
    document_id: int
    title: str
    slides: List[SlideContent]
    total_slides: int


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    database: str


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None