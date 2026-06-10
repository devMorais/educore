from pydantic import BaseModel, ConfigDict
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

    model_config = ConfigDict(json_schema_extra={
        "example": {"document_id": 12, "type": "quiz", "options": {}}
    })


# ---- Quiz ----

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str
    difficulty: Optional[str] = "medium"    # easy | medium | hard
    type: Optional[str] = "multiple_choice" # multiple_choice | true_false | fill_blank | ordering
    topic: Optional[str] = None
    bloom_level: Optional[str] = None        # BS-018: lembrar|entender|aplicar|analisar|avaliar|criar
    hint: Optional[str] = None               # BS-018: dica que orienta sem entregar a resposta
    source_chunk: Optional[str] = None       # BS-018: trecho do documento que fundamenta a questão


class QuizResponse(BaseModel):
    document_id: int
    title: str
    questions: List[QuizQuestion]
    total_questions: int

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "document_id": 12,
            "title": "Quiz — Fotossíntese",
            "total_questions": 1,
            "questions": [{
                "question": "Qual organela realiza a fotossíntese?",
                "type": "multiple_choice",
                "options": ["A) Mitocôndria", "B) Cloroplasto", "C) Núcleo", "D) Ribossomo"],
                "correct_answer": "B) Cloroplasto",
                "explanation": "A fotossíntese ocorre nos cloroplastos, ricos em clorofila.",
                "difficulty": "easy",
                "bloom_level": "entender",
                "topic": "Organelas",
                "hint": "Pense na cor verde das plantas."
            }]
        }
    })


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
    example: Optional[str] = None          # BS-017: exemplo de uso do termo


class WcagMetadata(BaseModel):
    reading_level: str
    estimated_duration: str
    complexity_score: float
    wcag_level: str = "AA"                          # BS-017: nível de conformidade
    applicable_guidelines: List[str] = []           # BS-017: diretrizes WCAG aplicáveis


class ImageDescription(BaseModel):
    """Descrição textual rica de imagem/gráfico (alt text — WCAG 1.1.1)."""
    context: str
    description: str


class CognitiveMapNode(BaseModel):
    """Nó pai-filho do mapa cognitivo do conteúdo (acessibilidade cognitiva)."""
    concept: str
    children: Optional[List["CognitiveMapNode"]] = []


CognitiveMapNode.model_rebuild()


class LibrasVideo(BaseModel):
    """Vídeo LIBRAS de um ponto-chave (BS-015). O avatar é renderizado no front
    a partir de `text`, usando a config de embed do provedor."""
    term: str                       # rótulo do ponto-chave (ex.: "Título", termo)
    text: str                       # texto em PT-BR a ser sinalizado em LIBRAS
    provider: str                   # "vlibras" | "handtalk"
    embed_type: str                 # "widget" | "sdk"
    config: Dict[str, Any] = {}     # dados para o front montar o avatar
    source: Optional[str] = None    # "title" | "vocabulary" | "moment"


class AccessibilityResponse(BaseModel):
    document_id: int
    title: str
    simplified_text: str
    audio_script: str
    visual_alternatives: List[str]
    key_vocabulary: List[VocabularyEntry]
    wcag_metadata: WcagMetadata
    libras_suggestions: List[str]
    libras_videos: List[LibrasVideo] = []              # BS-015
    # ── BS-017: conformidade WCAG 2.1 AA ──
    screen_reader_text: Optional[str] = None           # versão plain text p/ leitores de tela
    image_descriptions: List[ImageDescription] = []    # alt text rico (WCAG 1.1.1)
    reading_aids: List[str] = []                        # auxílios de leitura
    accessibility_features: List[str] = []             # recursos de acessibilidade aplicados
    cognitive_map: Optional[CognitiveMapNode] = None    # mapa cognitivo pai-filho


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
    features: List[str] = []


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


# ──────────────────────────────────────────────────────────────────────────────
# BS-020 — modelos de resposta dos endpoints REST (documentação OpenAPI)
# ──────────────────────────────────────────────────────────────────────────────

class MensagemErro(BaseModel):
    """Formato padrão de erro do FastAPI/HTTPException (corpo `{ "detail": ... }`)."""
    detail: str

    model_config = ConfigDict(json_schema_extra={
        "example": {"detail": "Documento não encontrado"}
    })


class UploadResponse(BaseModel):
    """Resposta do upload de PDF. `deduplicated=true` quando o PDF já havia sido
    processado antes (retorno imediato, sem reprocessar)."""
    status: str                       # "processing" (novo) | "completed" (dedup)
    document_id: int
    filename: str
    message: str
    deduplicated: Optional[bool] = None

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "status": "processing",
            "document_id": 12,
            "filename": "apostila-biologia.pdf",
            "message": "PDF recebido. Será processado em segundos.",
        }
    })


class DocumentListItem(BaseModel):
    id: int
    filename: str
    status: DocumentStatus
    progress_percent: int = 0
    created_at: datetime


class GenerationListItem(BaseModel):
    id: int
    type: str            # quiz|summary|slides|mindmap|flashcards|pcd|html_presentation
    created_at: str


class ExporterInfo(BaseModel):
    platform: str
    version: str
    format: str

    model_config = ConfigDict(json_schema_extra={
        "example": {"platform": "Kahoot", "version": "1.0", "format": "json"}
    })
