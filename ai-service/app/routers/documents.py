from fastapi.responses import FileResponse
import uuid
import os
import shutil
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from app.core.database import get_connection
from app.services.rag_service import rag_service
from app.models.schemas import (
    DocumentResponse,
    GenerationRequest,
    GenerationType
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Recebe PDF e inicia pipeline RAG em background."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos")

    if file.size > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo 50MB")

    file_path = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO documents (filename, original_name, file_path, file_size, status)
            VALUES (%s, %s, %s, %s, 'pending')
            RETURNING id
        """, (file.filename, file.filename, file_path, file.size))

        document_id = cursor.fetchone()[0]
        conn.commit()

        background_tasks.add_task(
            rag_service.process_document,
            file_path,
            file.filename,
            document_id
        )

        return {
            "status": "processing",
            "document_id": document_id,
            "filename": file.filename,
            "message": "PDF recebido! Processamento iniciado em background."
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.get("/{document_id}/status")
async def get_document_status(document_id: int):
    """Verifica o status do processamento do documento."""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT id, filename, status, created_at
            FROM documents WHERE id = %s
        """, (document_id,))

        doc = cursor.fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="Documento não encontrado")

        return {
            "id": doc[0],
            "filename": doc[1],
            "status": doc[2],
            "created_at": doc[3]
        }
    finally:
        cursor.close()
        conn.close()


@router.post("/{document_id}/generate")
async def generate_content(document_id: int, request: GenerationRequest):
    """Gera conteúdo (quiz, resumo, slides) a partir do documento."""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT status FROM documents WHERE id = %s",
            (document_id,)
        )
        doc = cursor.fetchone()

        if not doc:
            raise HTTPException(status_code=404, detail="Documento não encontrado")

        if doc[0] != "completed":
            raise HTTPException(
                status_code=400,
                detail=f"Documento ainda não processado. Status: {doc[0]}"
            )
    finally:
        cursor.close()
        conn.close()

    try:
        if request.type == GenerationType.QUIZ:
            result = rag_service.generate_quiz(
                document_id,
                num_questions=request.options.get("num_questions", 5)
            )
        elif request.type == GenerationType.SUMMARY:
            result = rag_service.generate_summary(document_id)
        elif request.type == GenerationType.SLIDES:
            result = rag_service.generate_slides(
                document_id,
                num_slides=request.options.get("num_slides", 8)
            )
        else:
            raise HTTPException(status_code=400, detail="Tipo de geração não suportado")

        return result

    except Exception as e:
        logger.error(f"Erro na geração: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{document_id}/export-slides")
async def export_to_google_slides(document_id: int, user_email: str = None):
    """Exporta slides para o Google Slides."""
    from app.services.slides_service import slides_service

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT status FROM documents WHERE id = %s",
            (document_id,)
        )
        doc = cursor.fetchone()

        if not doc:
            raise HTTPException(status_code=404, detail="Documento não encontrado")

        if doc[0] != "completed":
            raise HTTPException(
                status_code=400,
                detail=f"Documento ainda não processado. Status: {doc[0]}"
            )
    finally:
        cursor.close()
        conn.close()

    slides_data = rag_service.generate_slides(document_id)

    result = slides_service.create_presentation(
        title=slides_data.get('title', 'Apresentação EduCore'),
        slides_data=slides_data.get('slides', []),
        user_email=user_email
    )

    return result

@router.post("/{document_id}/export-pptx")
async def export_to_pptx(document_id: int):
    """Gera e baixa apresentação .pptx profissional."""
    from app.services.pptx_service import pptx_service

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT status, filename FROM documents WHERE id = %s",
            (document_id,)
        )
        doc = cursor.fetchone()

        if not doc:
            raise HTTPException(status_code=404, detail="Documento não encontrado")

        if doc[0] != "completed":
            raise HTTPException(
                status_code=400,
                detail=f"Documento ainda não processado. Status: {doc[0]}"
            )

        filename = doc[1]
    finally:
        cursor.close()
        conn.close()

    # Gera os slides via IA
    slides_data = rag_service.generate_slides(document_id)

    # Gera o arquivo .pptx
    output_path = f"uploads/{uuid.uuid4()}.pptx"
    pptx_service.generate(
        title=slides_data.get('title', 'Apresentação EduCore'),
        slides=slides_data.get('slides', []),
        output_path=output_path
    )

    # Retorna o arquivo para download
    return FileResponse(
        path=output_path,
        media_type='application/vnd.openxmlformats-officedocument.presentationml.presentation',
        filename=f"EduCore - {slides_data.get('title', 'Apresentacao')}.pptx"
    )


@router.get("/")
async def list_documents():
    """Lista todos os documentos."""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT id, filename, status, created_at
            FROM documents
            ORDER BY created_at DESC
            LIMIT 50
        """)

        docs = cursor.fetchall()
        return [
            {
                "id": d[0],
                "filename": d[1],
                "status": d[2],
                "created_at": d[3]
            }
            for d in docs
        ]
    finally:
        cursor.close()
        conn.close()