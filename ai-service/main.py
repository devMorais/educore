import asyncio
import contextlib
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.core.limiter import limiter
from app.routers import documents, admin, health
from app.services.rag_service import check_expired_uris

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def _sweep_loop():
    """
    Laço da varredura de URIs do Gemini (BS-019). Dorme `interval` e renova URIs
    perto de expirar. Erros são logados e NÃO derrubam o serviço.
    """
    intervalo = max(1, settings.gemini_uri_sweep_interval_hours) * 3600
    while True:
        try:
            await asyncio.sleep(intervalo)
            await check_expired_uris()
        except asyncio.CancelledError:
            break
        except Exception as e:  # nunca deixa o laço morrer por um erro pontual
            logger.error(f"[BS-019] varredura de URIs falhou: {e}")


# ── BS-020: documentação OpenAPI ──────────────────────────────────────────────
def _carregar_descricao() -> str:
    """Lê a descrição rica da API de openapi_description.md (fallback se ausente)."""
    caminho = os.path.join(os.path.dirname(__file__), "openapi_description.md")
    try:
        with open(caminho, encoding="utf-8") as fh:
            return fh.read()
    except OSError:
        return "Microserviço de IA para processamento de PDFs com RAG."


# Metadados das tags — controlam a ordem e a descrição dos grupos no Swagger/ReDoc
OPENAPI_TAGS = [
    {"name": "Sistema", "description": "Health check e status do serviço (público)."},
    {"name": "Documentos", "description": "Upload, status, listagem e exclusão de PDFs."},
    {"name": "Geração de Conteúdo",
     "description": "Gera e recupera Quiz, Resumo, Slides, Mapa Mental, Flashcards e PCD."},
    {"name": "Exportação",
     "description": "Exporta para PPTX, HTML (Reveal.js), Kahoot, Socrative e SCORM."},
    {"name": "Acessibilidade", "description": "Áudio (TTS) do conteúdo acessível (PCD)."},
    {"name": "Admin", "description": "Métricas e administração — requer role=admin."},
]

# /docs e /redoc apenas em DEBUG (em produção, defina DEBUG=False para ocultá-los)
_DOCS_ATIVO = settings.debug


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando EduCore AI Service...")
    init_db()
    logger.info("Banco de dados inicializado!")

    sweep_task = None
    if settings.gemini_uri_sweep_enabled:
        sweep_task = asyncio.create_task(_sweep_loop())
        logger.info(
            f"[BS-019] Varredura de renovação de URIs ativa "
            f"(a cada {settings.gemini_uri_sweep_interval_hours}h)"
        )

    yield

    if sweep_task:
        sweep_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await sweep_task
    logger.info("Encerrando EduCore AI Service...")


app = FastAPI(
    title="EduCore AI Service",
    description=_carregar_descricao(),
    version="1.1.0",
    lifespan=lifespan,
    openapi_tags=OPENAPI_TAGS,
    contact={"name": "EduCore — SENAC-DF", "url": "https://educore.devmorais.com.br"},
    # /docs, /redoc e /openapi.json só existem em DEBUG=True (ocultos em produção)
    docs_url="/docs" if _DOCS_ATIVO else None,
    redoc_url="/redoc" if _DOCS_ATIVO else None,
    openapi_url="/openapi.json" if _DOCS_ATIVO else None,
)

# CORS restrito — origens controladas via ALLOWED_ORIGINS em config/env (BS-003)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting global: 100 req/min por IP (BS-003)
if settings.rate_limit_enabled:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
    logger.info("Rate limiting habilitado: 100 req/min global por IP")

app.include_router(documents.router)
app.include_router(admin.router)
app.include_router(health.router)  # BS-024: GET /health detalhado (substitui o /health simples)
