import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.routers import documents

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando EduCore AI Service...")
    init_db()
    logger.info("Banco de dados inicializado!")
    yield
    logger.info("Encerrando EduCore AI Service...")


app = FastAPI(
    title="EduCore AI Service",
    description="Microserviço de IA para processamento de PDFs com RAG",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "EduCore AI Service",
        "version": "1.0.0",
        "database": "PostgreSQL + pgvector"
    }