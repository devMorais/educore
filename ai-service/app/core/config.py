from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Gemini
    gemini_api_key: str

    # LlamaParse
    llamaparse_api_key: str

    # Database
    database_url: str

    # Laravel — URL base para verificação de tokens Sanctum
    laravel_api_url: str = "http://educore.test"

    # Google Slides API — service account JSON (string base64 ou JSON raw)
    google_service_account_json: str | None = None

    # Pexels API — background images for Reveal.js presentations
    pexels_api_key: str | None = None

    # CORS — origens permitidas (BS-003)
    allowed_origins: list[str] = [
        "http://localhost:4200",
        "https://educore.test",
        "http://educore.test",
        "http://127.0.0.1:4200",
    ]

    # Rate Limiting — habilitar/desabilitar (BS-003)
    rate_limit_enabled: bool = True

    # Server
    port: int = 8001
    debug: bool = True

    # RAG — chunks
    chunk_size: int = 1024       # increased from 512 for better context
    chunk_overlap: int = 150     # increased from 50 for better continuity
    max_pages: int = 300         # support for large PDFs

    # Embeddings
    embedding_model: str = "models/gemini-embedding-2"
    embedding_batch_size: int = 20
    embedding_concurrency: int = 5

    # Generation
    generation_model: str = "models/gemini-2.5-flash"

    # ── Provedores de fallback (compatíveis com a API da OpenAI) ──
    # Cada provedor só é ativado se a respectiva API key estiver no .env.
    # Ordem de tentativa: Gemini → Groq → Cerebras → OpenRouter → Mistral.
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"
    groq_base_url: str = "https://api.groq.com/openai/v1"

    cerebras_api_key: str | None = None
    cerebras_model: str = "llama-3.3-70b"
    cerebras_base_url: str = "https://api.cerebras.ai/v1"

    openrouter_api_key: str | None = None
    openrouter_model: str = "meta-llama/llama-3.3-70b-instruct:free"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    mistral_api_key: str | None = None
    mistral_model: str = "mistral-small-latest"
    mistral_base_url: str = "https://api.mistral.ai/v1"

    # Quiz
    default_quiz_questions: int = 30
    quiz_context_chunks: int = 20

    # Slides
    default_slide_count: int = 20
    slides_context_chunks: int = 30

    # Mind map
    mindmap_context_chunks: int = 25
    mindmap_max_depth: int = 3
    mindmap_max_children: int = 7

    # Flashcards
    default_flashcard_count: int = 20

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
