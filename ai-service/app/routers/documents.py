import uuid
import os
import json
import hashlib
import shutil
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, Response
from app.core.database import get_connection
from app.services.rag_service import rag_service
from app.models.schemas import GenerationRequest, GenerationType

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_UPLOAD_BYTES = 100 * 1024 * 1024  # 100 MB


# ──────────────────────────────────────────────────────── upload
@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Arquivo muito grande. Máximo 100 MB")

    # ── Deduplication: check if this exact PDF was already processed ──
    file_hash = hashlib.sha256(content).hexdigest()
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT id, original_name, gemini_file_uri
            FROM documents
            WHERE file_hash = %s AND status = 'completed'
            ORDER BY created_at DESC LIMIT 1
            """,
            (file_hash,),
        )
        existing = cursor.fetchone()
        if existing:
            logger.info(f"Dedup: PDF já processado (id={existing[0]})")
            return {
                "status": "completed",
                "document_id": existing[0],
                "filename": existing[1],
                "message": "PDF já processado anteriormente. Pronto para uso imediato!",
                "deduplicated": True,
            }
    finally:
        cursor.close()
        conn.close()

    safe_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(content)

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO documents
                (filename, original_name, file_path, file_size, file_hash, status,
                 progress_percent, pages_processed, total_pages)
            VALUES (%s, %s, %s, %s, %s, 'pending', 0, 0, 0)
            RETURNING id
            """,
            (safe_name, file.filename, file_path, len(content), file_hash),
        )
        document_id = cursor.fetchone()[0]
        conn.commit()

        background_tasks.add_task(
            rag_service.process_document, file_path, file.filename, document_id
        )

        return {
            "status": "processing",
            "document_id": document_id,
            "filename": file.filename,
            "message": "PDF recebido. Será processado em segundos.",
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────────────── status
@router.get("/{document_id}/status")
async def get_document_status(document_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT id, status,
                   COALESCE(progress_percent, 0),
                   COALESCE(pages_processed, 0),
                   COALESCE(total_pages, 0)
            FROM documents WHERE id = %s
            """,
            (document_id,),
        )
        doc = cursor.fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="Documento não encontrado")
        return {
            "id": doc[0],
            "status": doc[1],
            "progress_percent": doc[2],
            "pages_processed": doc[3],
            "total_pages": doc[4],
        }
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────────────── list cached generations
@router.get("/{document_id}/generations")
async def list_generations(document_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, type, created_at FROM generations WHERE document_id=%s ORDER BY created_at DESC",
            (document_id,),
        )
        return [{"id": r[0], "type": r[1], "created_at": str(r[2])} for r in cursor.fetchall()]
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────────────── get cached generation
@router.get("/{document_id}/generations/{gen_type}")
async def get_cached_generation(document_id: int, gen_type: str):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT content FROM generations WHERE document_id=%s AND type=%s ORDER BY created_at DESC LIMIT 1",
            (document_id, gen_type),
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Geração não encontrada no cache")
        return row[0]
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────────────── generate
@router.post("/{document_id}/generate")
async def generate_content(document_id: int, request: GenerationRequest):
    _require_completed(document_id)

    # Return cached result if available
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT content FROM generations WHERE document_id=%s AND type=%s ORDER BY created_at DESC LIMIT 1",
            (document_id, request.type.value),
        )
        cached = cursor.fetchone()
        if cached:
            logger.info(f"Cache hit: doc={document_id} type={request.type.value}")
            return cached[0]
    finally:
        cursor.close()
        conn.close()

    try:
        if request.type == GenerationType.QUIZ:
            result = rag_service.generate_quiz(document_id)
        elif request.type == GenerationType.SUMMARY:
            result = rag_service.generate_summary(document_id)
        elif request.type == GenerationType.SLIDES:
            result = rag_service.generate_slides(document_id)
        elif request.type == GenerationType.MINDMAP:
            result = rag_service.generate_mindmap(document_id)
        elif request.type == GenerationType.FLASHCARDS:
            result = rag_service.generate_flashcards(document_id)
        elif request.type == GenerationType.PCD:
            result = rag_service.generate_pcd_content(document_id)
        else:
            raise HTTPException(status_code=400, detail="Tipo de geração não suportado")

        _save_generation(document_id, request.type.value, result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro na geração [{request.type}]: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────── export PPTX
@router.post("/{document_id}/export-pptx")
async def export_pptx(document_id: int):
    from app.services.pptx_service import pptx_service

    _require_completed(document_id)

    slides_data = rag_service.generate_slides(document_id)
    output_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}.pptx")
    pptx_service.generate(
        title=slides_data.get("title", "Apresentação EduCore"),
        slides=slides_data.get("slides", []),
        output_path=output_path,
    )

    return FileResponse(
        path=output_path,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename=f"EduCore_{slides_data.get('title', 'Apresentacao')}.pptx",
    )


# ──────────────────────────────────────────────────────── export Kahoot
@router.get("/{document_id}/export-kahoot")
async def export_kahoot(document_id: int):
    from app.exporters import EXPORTERS

    _require_completed(document_id)
    quiz = rag_service.generate_quiz(document_id)
    kahoot_data = EXPORTERS["kahoot"].export_quiz(quiz)

    return Response(
        content=json.dumps(kahoot_data, ensure_ascii=False, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="kahoot_quiz_{document_id}.json"'},
    )


# ──────────────────────────────────────────────────────── export Socrative
@router.get("/{document_id}/export-socrative")
async def export_socrative(document_id: int):
    from app.exporters import EXPORTERS

    _require_completed(document_id)
    quiz = rag_service.generate_quiz(document_id)
    socrative_data = EXPORTERS["socrative"].export_quiz(quiz)

    return Response(
        content=json.dumps(socrative_data, ensure_ascii=False, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="socrative_quiz_{document_id}.json"'},
    )


# ──────────────────────────────────────────────────────── export SCORM
@router.get("/{document_id}/export-scorm")
async def export_scorm(document_id: int):
    from app.exporters import EXPORTERS

    _require_completed(document_id)
    quiz = rag_service.generate_quiz(document_id)
    zip_bytes: bytes = EXPORTERS["scorm"].export_quiz(quiz)

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="scorm_quiz_{document_id}.zip"'},
    )


# ──────────────────────────────────────────────────────── exporters info
@router.get("/exporters/platforms")
async def list_exporters():
    from app.exporters import EXPORTERS

    return [exp.get_format_info() for exp in EXPORTERS.values()]


# ──────────────────────────────────────────────────────── list
@router.get("/")
async def list_documents():
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT id, original_name, status, progress_percent, created_at
            FROM documents
            ORDER BY created_at DESC
            LIMIT 50
            """
        )
        return [
            {
                "id": r[0],
                "filename": r[1],
                "status": r[2],
                "progress_percent": r[3],
                "created_at": r[4],
            }
            for r in cursor.fetchall()
        ]
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────────────── helpers
def _save_generation(document_id: int, gen_type: str, content: dict):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO generations (document_id, type, content) VALUES (%s, %s, %s)",
            (document_id, gen_type, json.dumps(content)),
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.warning(f"Falha ao salvar geração no cache: {e}")
    finally:
        cursor.close()
        conn.close()


def _require_completed(document_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT status FROM documents WHERE id = %s", (document_id,))
        doc = cursor.fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="Documento não encontrado")
        if doc[0] != "completed":
            raise HTTPException(
                status_code=400,
                detail=f"Documento não está processado. Status: {doc[0]}",
            )
    finally:
        cursor.close()
        conn.close()
