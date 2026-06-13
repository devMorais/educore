"""
Health check detalhado do AI Service (BS-024).

GET /health agrega o estado de cada dependência:
  - database     (Postgres/pgvector) via SELECT 1
  - gemini_api   via list_models
  - llamaparse_api (reachability)
  - disk_space   (espaço livre)

Cada verificação tem timeout de 3s. Status geral: healthy | degraded | critical.
HTTP 200 se healthy/degraded, 503 se critical (database/disco fora).
"""
import asyncio
import logging
import shutil
import time
from datetime import datetime, timezone

import httpx
import psycopg2
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from google import genai

from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Sistema"])

_START_TS = time.time()           # ≈ início do processo (import no startup)
_VERSION = "1.1.0"
_TIMEOUT = 3.0                     # segundos por verificação
_CRITICOS = {"database", "disk_space"}  # se um destes cair → status geral 'critical'

_gemini = genai.Client(api_key=settings.gemini_api_key)


# ─────────────────────────────────────────── verificações (síncronas)
def _check_database() -> dict:
    """Conexão + SELECT 1 no Postgres."""
    try:
        conn = psycopg2.connect(settings.database_url, connect_timeout=3)
        try:
            cur = conn.cursor()
            cur.execute("SELECT 1")
            cur.fetchone()
            cur.close()
        finally:
            conn.close()
        return {"status": "healthy"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)[:160]}


def _check_gemini() -> dict:
    """Reachability do Gemini via list_models (consome 1 item do iterador)."""
    try:
        next(iter(_gemini.models.list()), None)
        return {"status": "healthy"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)[:160]}


def _check_llamaparse() -> dict:
    """Reachability do LlamaParse (LlamaCloud). Qualquer resposta HTTP = alcançável."""
    if not settings.llamaparse_api_key:
        return {"status": "not_configured"}
    try:
        r = httpx.get(
            "https://api.cloud.llamaindex.ai/",
            headers={"Authorization": f"Bearer {settings.llamaparse_api_key}"},
            timeout=3.0,
        )
        return {"status": "healthy", "http_status": r.status_code}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)[:160]}


def _check_disk() -> dict:
    """Espaço livre em disco. <3% livre → unhealthy (crítico); <10% → degraded."""
    try:
        usage = shutil.disk_usage(".")
        free_pct = usage.free / usage.total * 100
        status = "healthy" if free_pct > 10 else ("degraded" if free_pct > 3 else "unhealthy")
        return {
            "status": status,
            "free_mb": round(usage.free / 1024 / 1024),
            "total_mb": round(usage.total / 1024 / 1024),
            "free_percent": round(free_pct, 1),
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)[:160]}


# ─────────────────────────────────────────── orquestração
async def _run(fn) -> dict:
    """Roda uma verificação síncrona em thread, com timeout de 3s."""
    loop = asyncio.get_event_loop()
    try:
        return await asyncio.wait_for(loop.run_in_executor(None, fn), timeout=_TIMEOUT)
    except asyncio.TimeoutError:
        return {"status": "unhealthy", "error": "timeout (>3s)"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)[:160]}


def _aggregate(components: dict) -> str:
    """critical se um componente crítico está unhealthy; degraded se algo não-saudável."""
    if any(components[k].get("status") == "unhealthy" for k in _CRITICOS):
        return "critical"
    if any(c.get("status") in ("unhealthy", "degraded") for c in components.values()):
        return "degraded"
    return "healthy"


@router.get("/health", summary="Health check detalhado do AI Service")
async def health():
    database, gemini_api, llamaparse_api, disk_space = await asyncio.gather(
        _run(_check_database),
        _run(_check_gemini),
        _run(_check_llamaparse),
        _run(_check_disk),
    )
    components = {
        "database": database,
        "gemini_api": gemini_api,
        "llamaparse_api": llamaparse_api,
        "disk_space": disk_space,
    }
    overall = _aggregate(components)

    return JSONResponse(
        status_code=503 if overall == "critical" else 200,
        content={
            "service": "EduCore AI Service",
            "status": overall,
            "version": _VERSION,
            "uptime_seconds": round(time.time() - _START_TS),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "components": components,
        },
    )
