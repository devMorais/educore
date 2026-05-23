from pydantic import BaseModel
from typing import Optional, List, Any, Dict
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
    MINDMAP = "mindmap"
    FLASHCARDS = "flashcards"
    PCD = "pcd"


class DocumentResponse(BaseModel):
    id: int
    filename: str
    original_name: str
    status: DocumentStatus
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentStatusResponse(BaseModel):
    id: int
    status: DocumentStatus
    progress_percent: int = 0
    pages_processed: int = 0
    total_pages: int = 0
    error: Optional[str] = None


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
    options: Optional[Dict[str, Any]] = {}


# ---- Quiz ----

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str
    difficulty: Optional[str] = "medium"    # easy | medium | hard
    type: Optional[str] = "multiple_choice" # multiple_choice | true_false | fill_blank
    topic: Optional[str] = None


class QuizResponse(BaseModel):
    document_id: int
    title: str
    questions: List[QuizQuestion]
    total_questions: int


# ---- Summary ----

class SummaryResponse(BaseModel):
    document_id: int
    title: str
    summary: str
    key_points: List[str]
    word_count: int


# ---- Slides ----

class SlideContent(BaseModel):
    title: str
    content: List[str]
    notes: Optional[str] = None
    layout: Optional[str] = "content_bullets"
    visual_suggestion: Optional[str] = None
    accent_color: Optional[str] = "blue"


class SlidesResponse(BaseModel):
    document_id: int
    title: str
    slides: List[SlideContent]
    total_slides: int


# ---- Mind Map ----

class MindMapNode(BaseModel):
    id: str
    topic: str
    children: Optional[List["MindMapNode"]] = []


MindMapNode.model_rebuild()


class MindMapResponse(BaseModel):
    document_id: int
    title: str
    root: MindMapNode


# ---- Flashcards ----

class Flashcard(BaseModel):
    front: str
    back: str
    topic: Optional[str] = None


class FlashcardsResponse(BaseModel):
    document_id: int
    title: str
    cards: List[Flashcard]
    total_cards: int


# ---- PCD / Accessibility ----

class VocabularyEntry(BaseModel):
    term: str
    definition: str


class WcagMetadata(BaseModel):
    reading_level: str
    estimated_duration: str
    complexity_score: float


class AccessibilityResponse(BaseModel):
    document_id: int
    title: str
    simplified_text: str
    audio_script: str
    visual_alternatives: List[str]
    key_vocabulary: List[VocabularyEntry]
    wcag_metadata: WcagMetadata
    libras_suggestions: List[str]


# ---- Platform Export ----

class ExportResult(BaseModel):
    platform: str
    format: str
    filename: str
    content: Any  # JSON-serializable export data


# ---- Shared ----

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    database: str


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
