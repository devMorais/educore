"""
Router de administração do AI Service (BS-010).
Endpoints protegidos: apenas usuários com role='admin' podem acessar.
"""

import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.auth import verify_token
from app.core.database import get_connection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


async def require_admin(user: dict = Depends(verify_token)) -> dict:
    """Dependência que garante role=admin, caso contrário retorna 403."""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas administradores podem acessar este recurso.",
        )
    return user


@router.get("/stats")
async def get_stats(_: dict = Depends(require_admin)):
    """
    Retorna métricas agregadas de documentos e gerações do AI Service.
    Inclui séries temporais dos últimos 30 dias para uploads e gerações.
    """
    conn = get_connection()
    cur  = conn.cursor()

    try:
        # Totais gerais
        cur.execute("SELECT COUNT(*) FROM documents")
        total_documents = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM generations")
        total_generations = cur.fetchone()[0]

        # Distribuição por status
        cur.execute("""
            SELECT status, COUNT(*) AS count
            FROM documents
            GROUP BY status
            ORDER BY count DESC
        """)
        by_status = [{"status": row[0], "count": row[1]} for row in cur.fetchall()]

        # Distribuição por tipo de geração
        cur.execute("""
            SELECT type, COUNT(*) AS count
            FROM generations
            GROUP BY type
            ORDER BY count DESC
        """)
        by_type = [{"type": row[0], "count": row[1]} for row in cur.fetchall()]

        # Uploads por dia (últimos 30 dias)
        cur.execute("""
            SELECT DATE(created_at) AS date, COUNT(*) AS count
            FROM documents
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY date
            ORDER BY date
        """)
        uploads_per_day = [
            {"date": str(row[0]), "count": row[1]} for row in cur.fetchall()
        ]

        # Gerações por dia (últimos 30 dias)
        cur.execute("""
            SELECT DATE(created_at) AS date, COUNT(*) AS count
            FROM generations
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY date
            ORDER BY date
        """)
        generations_per_day = [
            {"date": str(row[0]), "count": row[1]} for row in cur.fetchall()
        ]

        # Tipos mais frequentes de geração (top 3)
        cur.execute("""
            SELECT type, COUNT(*) AS count
            FROM generations
            GROUP BY type
            ORDER BY count DESC
            LIMIT 3
        """)
        top_document_types = [{"type": row[0], "count": row[1]} for row in cur.fetchall()]

        # Tempo médio de processamento (em segundos) para documentos concluídos
        cur.execute("""
            SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))
            FROM documents
            WHERE status = 'completed'
        """)
        avg_row = cur.fetchone()
        avg_processing_time = round(float(avg_row[0]), 2) if avg_row and avg_row[0] else 0

        return {
            "total_documents":      total_documents,
            "total_generations":    total_generations,
            "by_status":            by_status,
            "by_type":              by_type,
            "uploads_per_day":      uploads_per_day,
            "generations_per_day":  generations_per_day,
            "top_document_types":   top_document_types,
            "avg_processing_time":  avg_processing_time,
        }

    finally:
        cur.close()
        conn.close()


@router.get("/documents")
async def list_all_documents(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    _: dict = Depends(require_admin),
):
    """
    Lista todos os documentos da plataforma (sem filtro por usuário).
    Paginado — admins podem ver documentos de todos os usuários.
    """
    conn = get_connection()
    cur  = conn.cursor()

    try:
        offset = (page - 1) * per_page

        cur.execute("SELECT COUNT(*) FROM documents")
        total = cur.fetchone()[0]

        cur.execute("""
            SELECT id, filename, original_name, file_size, status,
                   progress_percent, user_id, created_at, updated_at
            FROM documents
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """, (per_page, offset))

        rows = cur.fetchall()
        documents = [
            {
                "id":               row[0],
                "filename":         row[1],
                "original_name":    row[2],
                "file_size":        row[3],
                "status":           row[4],
                "progress_percent": row[5],
                "user_id":          row[6],
                "created_at":       row[7].isoformat() if row[7] else None,
                "updated_at":       row[8].isoformat() if row[8] else None,
            }
            for row in rows
        ]

        return {
            "data":         documents,
            "total":        total,
            "page":         page,
            "per_page":     per_page,
            "last_page":    -(-total // per_page),  # ceil division
        }

    finally:
        cur.close()
        conn.close()
