import asyncio
import contextlib
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
from app.routers import documents, admin
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
    description="Microserviço de IA para processamento de PDFs com RAG",
    version="1.1.0",
    lifespan=lifespan
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


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "EduCore AI Service",
        "version": "1.1.0",
        "database": "PostgreSQL + pgvector",
        "features": ["documents", "admin"]
    }
