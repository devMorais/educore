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
    cerebras_model: str = "gpt-oss-120b"
    cerebras_base_url: str = "https://api.cerebras.ai/v1"

    openrouter_api_key: str | None = None
    openrouter_model: str = "google/gemma-4-31b-it:free"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    mistral_api_key: str | None = None
    mistral_model: str = "mistral-small-latest"
    mistral_base_url: str = "https://api.mistral.ai/v1"

    # Força um provedor específico na geração (para teste/diagnóstico).
    # Ex.: AI_FORCE_PROVIDER=Groq → usa só o Groq (ignora Gemini e os demais).
    # Vazio = comportamento normal (cadeia completa Gemini → Groq → …).
    ai_force_provider: str | None = None

    # ── Gemini Files API — renovação automática de URI (BS-019) ──
    # O PDF enviado ao Gemini Files API expira em ~48h. Para manter a geração
    # usando o PDF COMPLETO (em vez de cair no RAG), renovamos a URI quando ela
    # está perto de expirar. Estratégia primária = renovação LAZY (no momento da
    # geração, sem custo para docs "frios"); a varredura em background é o
    # complemento conservador (depende do PDF ainda estar em disco).
    gemini_file_ttl_hours: int = 48          # fallback se a API não informar expiration_time
    gemini_uri_renew_buffer_hours: int = 1   # na geração: renova se faltar < 1h p/ expirar
    gemini_uri_proactive_hours: int = 2      # varredura: renova se faltar < 2h p/ expirar
    gemini_uri_sweep_enabled: bool = True    # liga/desliga a varredura periódica em background
    gemini_uri_sweep_interval_hours: int = 12  # de quanto em quanto tempo a varredura roda
    gemini_uri_sweep_max_docs: int = 200     # teto de docs por varredura (protege a cota do Gemini)

    # ── Storage durável do PDF de origem (upgrade recomendado, BS-019) ──
    # O reupload ao Gemini depende do PDF estar acessível. Em hosts com disco
    # EFÊMERO (ex.: Railway), os PDFs em `uploads/` somem a cada redeploy, então
    # docs antigos caem no RAG. Para renovação 100% confiável, guarde o PDF num
    # storage durável. Default "local" (disco) mantém o comportamento atual.
    #   - "local"    → disco (grátis, mas efêmero em serverless)               [implementado]
    #   - "supabase" → Supabase Storage (grátis, já usam Supabase) — RECOMENDADO [pronto p/ ligar]
    #   - "s3"       → AWS S3 / Cloudflare R2 / Backblaze B2 (compatível S3)     [pronto p/ ligar]
    pdf_storage_provider: str = "local"
    supabase_url: str | None = None
    supabase_service_key: str | None = None
    supabase_pdf_bucket: str = "educore-pdfs"
    s3_endpoint_url: str | None = None       # R2/B2 usam endpoint custom; S3 deixa vazio
    s3_bucket: str | None = None
    s3_access_key_id: str | None = None
    s3_secret_access_key: str | None = None
    s3_region: str = "us-east-1"

    # ── Acessibilidade: vídeos LIBRAS no conteúdo PCD (BS-015) ──
    # Provedor: "vlibras" (gratuito, oficial gov.br) | "handtalk" (pago).
    # O avatar é renderizado no FRONT; o backend cura os textos + config de embed.
    libras_enabled: bool = True
    libras_provider: str = "vlibras"
    libras_max_chars: int = 1000  # limite por trecho (Hand Talk aceita até 1000)
    # VLibras (gratuito) — widget JS com o avatar Ícaro
    vlibras_app_url: str = "https://vlibras.gov.br/app"
    vlibras_plugin_url: str = "https://vlibras.gov.br/app/vlibras-plugin.js"
    # Hand Talk (pago, opcional) — SDK web com o avatar Hugo. Token público de site.
    hand_talk_api_key: str | None = None
    hand_talk_plugin_url: str = "https://plugin.handtalk.me/web/latest/handtalk.min.js"

    # ── Acessibilidade: Text-to-Speech do conteúdo PCD (BS-016) ──
    # Provedor: "edge" (grátis, vozes NEURAIS) | "gtts" (grátis, estável) | "google_cloud" (pago).
    # Escala de qualidade/fallback: google_cloud -> edge -> gtts.
    tts_enabled: bool = True
    tts_provider: str = "edge"
    tts_lang: str = "pt-BR"
    tts_max_chars: int = 5000           # limite por chunk (Google Cloud TTS)
    tts_cache_dir: str | None = None    # None = usa o tempdir do SO (cross-platform)
    # edge-tts (gratuito, neural) — vozes pt-BR: FranciscaNeural (f) / AntonioNeural (m)
    edge_tts_voice: str = "pt-BR-FranciscaNeural"
    # Google Cloud TTS (pago, opcional)
    google_tts_api_key: str | None = None
    google_tts_voice: str = "pt-BR-Wavenet-A"
    google_tts_voice_fallback: str = "pt-BR-Standard-A"

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
