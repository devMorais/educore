import uuid
import os
import json
import hashlib
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse, Response
from app.core.database import get_connection
from app.core.auth import get_current_user, verify_token
from app.core.config import settings
from app.core.limiter import limiter, get_user_identifier
from typing import List
from app.services.rag_service import rag_service
from app.services.tts_service import tts_service
from app.models.schemas import (
    GenerationRequest, GenerationType,
    UploadResponse, DocumentStatusResponse, DocumentListItem,
    GenerationListItem, ExporterInfo, MensagemErro,
)

logger = logging.getLogger(__name__)
# Sem tag no router: cada endpoint declara a sua (agrupamento limpo no Swagger)
router = APIRouter(prefix="/documents")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_UPLOAD_BYTES = 100 * 1024 * 1024  # 100 MB

# ── BS-020: respostas de erro reutilizáveis no OpenAPI ──
_E401 = {401: {"model": MensagemErro, "description": "Token ausente, inválido ou expirado"}}
_E403 = {403: {"model": MensagemErro, "description": "Sem permissão sobre o recurso"}}
_E404 = {404: {"model": MensagemErro, "description": "Documento/recurso não encontrado"}}
_E422 = {422: {"description": "Erro de validação dos dados enviados"}}
_E429 = {429: {"model": MensagemErro, "description": "Limite de requisições excedido (rate limit)"}}
_E503 = {503: {"model": MensagemErro, "description": "Modelo de IA sobrecarregado — tente novamente"}}


# ──────────────────────────────────────────────────────── helper: ownership
def ownership_check(document_id: int, user_id: int, status_code: int = 404) -> None:
    """
    Verifica se o documento existe e pertence ao usuário.
    Levanta HTTPException com o status_code informado se não for dono.
    Usa 404 por padrão para não revelar existência de documentos alheios.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT user_id FROM documents WHERE id = %s",
            (document_id,),
        )
        doc = cursor.fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="Documento não encontrado")
        if doc[0] != user_id:
            raise HTTPException(
                status_code=status_code,
                detail="Acesso negado" if status_code == 403 else "Documento não encontrado",
            )
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────────────── upload
@router.post(
    "/upload",
    tags=["Documentos"],
    summary="Enviar um PDF para processamento",
    description=(
        "Recebe um PDF (até **100 MB**), inicia o processamento assíncrono "
        "(Gemini Files API + RAG) e devolve o `document_id`. Se o mesmo PDF já "
        "tiver sido processado por este usuário, retorna o existente "
        "(`deduplicated=true`) sem reprocessar. Limite: **10 uploads/hora**."
    ),
    response_model=UploadResponse,
    response_model_exclude_none=True,
    responses={
        **_E401, **_E422, **_E429,
        400: {"model": MensagemErro, "description": "Arquivo não é PDF"},
        413: {"model": MensagemErro, "description": "Arquivo maior que 100 MB"},
    },
)
@limiter.limit(f"{settings.rate_upload_per_hour}/hour", key_func=get_user_identifier)
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = get_current_user,
):
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Arquivo muito grande. Máximo 100 MB")

    user_id = current_user["user_id"]
    file_hash = hashlib.sha256(content).hexdigest()

    # Deduplicação: mesmo hash E mesmo usuário
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT id, original_name
            FROM documents
            WHERE file_hash = %s AND user_id = %s AND status = 'completed'
            ORDER BY created_at DESC LIMIT 1
            """,
            (file_hash, user_id),
        )
        existing = cursor.fetchone()
        if existing:
            logger.info(f"Dedup: PDF já processado pelo usuário {user_id} (id={existing[0]})")
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
                 progress_percent, pages_processed, total_pages, user_id)
            VALUES (%s, %s, %s, %s, %s, 'pending', 0, 0, 0, %s)
            RETURNING id
            """,
            (safe_name, file.filename, file_path, len(content), file_hash, user_id),
        )
        document_id = cursor.fetchone()[0]
        conn.commit()

        background_tasks.add_task(
            rag_service.process_document, file_path, file.filename, document_id, user_id
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
@router.get(
    "/{document_id}/status",
    tags=["Documentos"],
    summary="Status de processamento do documento",
    description="Use em polling para acompanhar o progresso (0–100%) até `status=completed`.",
    response_model=DocumentStatusResponse,
    response_model_exclude_none=True,
    responses={**_E401, **_E404},
)
async def get_document_status(
    document_id: int,
    current_user: dict = get_current_user,
):
    # 404 se não existe ou não é dono — não revela documentos alheios
    ownership_check(document_id, current_user["user_id"], status_code=404)

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT id, status,
                   COALESCE(progress_percent, 0),
                   COALESCE(pages_processed, 0),
                   COALESCE(total_pages, 0),
                   gemini_file_expires_at,
                   (gemini_file_uri IS NOT NULL
                    AND gemini_file_expires_at IS NOT NULL
                    AND gemini_file_expires_at > NOW()) AS gemini_active
            FROM documents WHERE id = %s
            """,
            (document_id,),
        )
        doc = cursor.fetchone()
        return {
            "id": doc[0],
            "status": doc[1],
            "progress_percent": doc[2],
            "pages_processed": doc[3],
            "total_pages": doc[4],
            # BS-019: validade da URI do Gemini (PDF completo) — None se nunca enviado/expirado
            "gemini_file_expires_at": doc[5].isoformat() if doc[5] else None,
            "gemini_active": bool(doc[6]),
        }
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────────────── list cached generations
@router.get(
    "/{document_id}/generations",
    tags=["Geração de Conteúdo"],
    summary="Listar gerações em cache do documento",
    description="Retorna os conteúdos já gerados (tipo + data), do mais recente ao mais antigo.",
    response_model=List[GenerationListItem],
    responses={**_E401, **_E404},
)
async def list_generations(
    document_id: int,
    current_user: dict = get_current_user,
):
    ownership_check(document_id, current_user["user_id"])

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
@router.get(
    "/{document_id}/generations/{gen_type}",
    tags=["Geração de Conteúdo"],
    summary="Recuperar uma geração específica do cache",
    description=(
        "Retorna o JSON da geração em cache (`quiz`, `summary`, `slides`, `mindmap`, "
        "`flashcards`, `pcd`). O formato varia conforme o tipo — ver os schemas "
        "correspondentes na seção **Schemas**."
    ),
    response_model=dict,
    responses={**_E401, **_E404},
)
async def get_cached_generation(
    document_id: int,
    gen_type: str,
    current_user: dict = get_current_user,
):
    ownership_check(document_id, current_user["user_id"])

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
@router.post(
    "/{document_id}/generate",
    tags=["Geração de Conteúdo"],
    summary="Gerar conteúdo a partir do documento",
    description=(
        "Gera um dos 6 tipos de conteúdo (campo `type`): `quiz`, `summary`, "
        "`slides`, `mindmap`, `flashcards`, `pcd`. O resultado fica em cache "
        "(próximas chamadas do mesmo tipo retornam o cache). O **formato da "
        "resposta varia conforme o `type`** — ver `QuizResponse`, `SummaryResponse`, "
        "`SlidesResponse`, `MindMapResponse`, `FlashcardsResponse` e "
        "`AccessibilityResponse` na seção **Schemas**. Limite: **20/hora**."
    ),
    response_model=dict,
    responses={
        **_E401, **_E403, **_E404, **_E422, **_E429, **_E503,
        400: {"model": MensagemErro, "description": "Documento não processado ou tipo inválido"},
    },
)
@limiter.limit(f"{settings.rate_generations_per_hour}/hour", key_func=get_user_identifier)
async def generate_content(
    request: Request,
    document_id: int,
    body: GenerationRequest,
    current_user: dict = get_current_user,
):
    # 403 explícito conforme critério BS-002
    ownership_check(document_id, current_user["user_id"], status_code=403)
    _require_completed(document_id)

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT content FROM generations WHERE document_id=%s AND type=%s ORDER BY created_at DESC LIMIT 1",
            (document_id, body.type.value),
        )
        cached = cursor.fetchone()
        if cached:
            logger.info(f"Cache hit: doc={document_id} type={body.type.value}")
            return cached[0]
    finally:
        cursor.close()
        conn.close()

    try:
        google_url = None
        if body.type == GenerationType.QUIZ:
            result = rag_service.generate_quiz(document_id)
        elif body.type == GenerationType.SUMMARY:
            result = rag_service.generate_summary(document_id)
        elif body.type == GenerationType.SLIDES:
            result = rag_service.generate_slides(document_id)
            google_url = _try_google_slides(result, current_user.get("email"))
            if google_url:
                result["google_slides_url"] = google_url
        elif body.type == GenerationType.MINDMAP:
            result = rag_service.generate_mindmap(document_id)
        elif body.type == GenerationType.FLASHCARDS:
            result = rag_service.generate_flashcards(document_id)
        elif body.type == GenerationType.PCD:
            result = rag_service.generate_pcd_content(document_id)
        else:
            raise HTTPException(status_code=400, detail="Tipo de geração não suportado")

        _save_generation(document_id, body.type.value, result, google_slides_url=google_url)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro na geração [{body.type}]: {e}")
        msg = str(e)
        # Gemini sobrecarregado/limite de taxa após os retries → 503 com mensagem amigável
        if any(t in msg for t in ("503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED")):
            raise HTTPException(
                status_code=503,
                detail="O modelo de IA está sobrecarregado no momento. Aguarde alguns segundos e tente novamente.",
            )
        raise HTTPException(status_code=500, detail=msg)


# ──────────────────────────────────────────────────────── áudio (TTS / BS-016)
@router.get(
    "/{document_id}/audio",
    tags=["Acessibilidade"],
    summary="Áudio (TTS) do conteúdo acessível",
    description=(
        "Retorna um **MP3** com a narração do roteiro de áudio da geração PCD "
        "(em cache). Gere o conteúdo `pcd` antes. O front deve buscar como blob."
    ),
    response_class=FileResponse,
    responses={
        **_E401, **_E403, **_E404, **_E503,
        200: {"content": {"audio/mpeg": {}}, "description": "Arquivo MP3 do áudio"},
    },
)
async def get_audio(
    request: Request,
    document_id: int,
    current_user: dict = get_current_user,
):
    """
    Retorna o MP3 (Text-to-Speech) do roteiro de áudio do conteúdo PCD.
    O áudio é gerado a partir do `audio_script` da geração PCD e fica em cache.
    Auth via Bearer — o front deve buscar como blob (HttpClient) e tocar via objectURL.
    """
    ownership_check(document_id, current_user["user_id"], status_code=403)

    if not settings.tts_enabled:
        raise HTTPException(status_code=404, detail="Áudio (TTS) desabilitado.")

    # Recupera o audio_script da geração PCD mais recente do documento
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT content FROM generations WHERE document_id=%s AND type='pcd' "
            "ORDER BY created_at DESC LIMIT 1",
            (document_id,),
        )
        row = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Gere o conteúdo PCD antes de ouvir o áudio.")

    content = row[0]
    if isinstance(content, str):
        content = json.loads(content)
    texto = (content.get("audio_script") or content.get("simplified_text") or "").strip()
    if not texto:
        raise HTTPException(status_code=404, detail="Sem texto disponível para gerar o áudio.")

    try:
        caminho = tts_service.get_or_synthesize(document_id, texto)
    except Exception as e:
        logger.error(f"TTS falhou [doc={document_id}]: {e}")
        raise HTTPException(
            status_code=503,
            detail="Não foi possível gerar o áudio agora. Use a leitura por voz do navegador.",
        )

    return FileResponse(
        caminho,
        media_type="audio/mpeg",
        filename=f"educore_audio_{document_id}.mp3",
    )


# ──────────────────────────────────────────────────────── export PPTX
@router.post(
    "/{document_id}/export-pptx",
    tags=["Exportação"],
    summary="Exportar slides para PowerPoint (.pptx)",
    description="Gera (ou reaproveita do cache) os slides e devolve um arquivo **.pptx** para download.",
    response_class=FileResponse,
    responses={
        **_E401, **_E404,
        400: {"model": MensagemErro, "description": "Documento não processado"},
        200: {"content": {"application/vnd.openxmlformats-officedocument.presentationml.presentation": {}},
              "description": "Arquivo .pptx"},
    },
)
@limiter.limit(f"{settings.rate_export_per_hour}/hour", key_func=get_user_identifier)
async def export_pptx(
    request: Request,
    document_id: int,
    current_user: dict = get_current_user,
):
    from app.services.pptx_service import pptx_service

    ownership_check(document_id, current_user["user_id"])
    _require_completed(document_id)

    slides_data = _get_or_generate_slides(document_id)
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


# ──────────────────────────────────────────────────────── view HTML (Reveal.js) — nova guia
@router.get(
    "/{document_id}/html-view",
    tags=["Exportação"],
    summary="Visualizar a apresentação (HTML/Reveal.js)",
    description=(
        "Serve a apresentação como HTML para abrir em nova guia. **Autentica via "
        "query param** `?token=<bearer>` (permite `window.open()` sem headers)."
    ),
    response_class=Response,
    responses={**_E401, **_E404, 200: {"content": {"text/html": {}}, "description": "HTML da apresentação"}},
)
async def view_html(
    document_id: int,
    token: str,
):
    """
    Serve o HTML da apresentação diretamente no browser (nova guia).
    Autentica via query param ?token= para permitir window.open() sem headers.
    """
    from fastapi.security import HTTPAuthorizationCredentials
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    user = await verify_token(creds)

    ownership_check(document_id, user["user_id"])
    _require_completed(document_id)

    slides_data = _get_or_generate_slides(document_id)
    html_content = _get_or_generate_html(document_id, slides_data)

    return Response(content=html_content, media_type="text/html")


# ──────────────────────────────────────────────────────── export HTML (Reveal.js) — download
@router.post(
    "/{document_id}/export-html",
    tags=["Exportação"],
    summary="Baixar a apresentação (HTML/Reveal.js)",
    description="Gera a apresentação e devolve um arquivo **.html** autocontido para download.",
    response_class=Response,
    responses={**_E401, **_E404, 200: {"content": {"text/html": {}}, "description": "Arquivo .html"}},
)
@limiter.limit(f"{settings.rate_export_per_hour}/hour", key_func=get_user_identifier)
async def export_html(
    request: Request,
    document_id: int,
    current_user: dict = get_current_user,
):
    ownership_check(document_id, current_user["user_id"])
    _require_completed(document_id)

    slides_data = _get_or_generate_slides(document_id)
    html_content = _get_or_generate_html(document_id, slides_data)

    safe_title = (
        (slides_data.get("title") or "Apresentacao")
        .encode("ascii", "ignore").decode()
        .replace(" ", "_")[:60]
    )
    return Response(
        content=html_content,
        media_type="text/html",
        headers={"Content-Disposition": f'attachment; filename="EduCore_{safe_title}.html"'},
    )


# ──────────────────────────────────────────────────────── export Kahoot
@router.get(
    "/{document_id}/export-kahoot",
    tags=["Exportação"],
    summary="Exportar quiz para o Kahoot (JSON)",
    description="Gera o quiz e devolve um JSON no formato de importação do Kahoot.",
    response_class=Response,
    responses={**_E401, **_E404, 200: {"content": {"application/json": {}}, "description": "JSON do Kahoot"}},
)
@limiter.limit(f"{settings.rate_export_per_hour}/hour", key_func=get_user_identifier)
async def export_kahoot(
    request: Request,
    document_id: int,
    current_user: dict = get_current_user,
):
    from app.exporters import EXPORTERS

    ownership_check(document_id, current_user["user_id"])
    _require_completed(document_id)
    quiz = rag_service.generate_quiz(document_id)
    kahoot_data = EXPORTERS["kahoot"].export_quiz(quiz)

    return Response(
        content=json.dumps(kahoot_data, ensure_ascii=False, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="kahoot_quiz_{document_id}.json"'},
    )


# ──────────────────────────────────────────────────────── export Socrative
@router.get(
    "/{document_id}/export-socrative",
    tags=["Exportação"],
    summary="Exportar quiz para o Socrative (JSON)",
    description="Gera o quiz e devolve um JSON no formato de importação do Socrative.",
    response_class=Response,
    responses={**_E401, **_E404, 200: {"content": {"application/json": {}}, "description": "JSON do Socrative"}},
)
@limiter.limit(f"{settings.rate_export_per_hour}/hour", key_func=get_user_identifier)
async def export_socrative(
    request: Request,
    document_id: int,
    current_user: dict = get_current_user,
):
    from app.exporters import EXPORTERS

    ownership_check(document_id, current_user["user_id"])
    _require_completed(document_id)
    quiz = rag_service.generate_quiz(document_id)
    socrative_data = EXPORTERS["socrative"].export_quiz(quiz)

    return Response(
        content=json.dumps(socrative_data, ensure_ascii=False, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="socrative_quiz_{document_id}.json"'},
    )


# ──────────────────────────────────────────────────────── export SCORM
@router.get(
    "/{document_id}/export-scorm",
    tags=["Exportação"],
    summary="Exportar quiz como pacote SCORM (.zip)",
    description="Gera o quiz e devolve um pacote **SCORM** (.zip) para importar em LMS (Moodle, etc.).",
    response_class=Response,
    responses={**_E401, **_E404, 200: {"content": {"application/zip": {}}, "description": "Pacote SCORM .zip"}},
)
@limiter.limit(f"{settings.rate_export_per_hour}/hour", key_func=get_user_identifier)
async def export_scorm(
    request: Request,
    document_id: int,
    current_user: dict = get_current_user,
):
    from app.exporters import EXPORTERS

    ownership_check(document_id, current_user["user_id"])
    _require_completed(document_id)
    quiz = rag_service.generate_quiz(document_id)
    zip_bytes: bytes = EXPORTERS["scorm"].export_quiz(quiz)

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="scorm_quiz_{document_id}.zip"'},
    )


# ──────────────────────────────────────────────────────── exporters info
@router.get(
    "/exporters/platforms",
    tags=["Exportação"],
    summary="Listar plataformas de exportação disponíveis",
    description="Retorna as plataformas suportadas (Kahoot, Socrative, SCORM…) e seus formatos.",
    response_model=List[ExporterInfo],
    responses={**_E401},
)
async def list_exporters(current_user: dict = get_current_user):
    from app.exporters import EXPORTERS

    return [exp.get_format_info() for exp in EXPORTERS.values()]


# ──────────────────────────────────────────────────────── list
@router.get(
    "/",
    tags=["Documentos"],
    summary="Listar meus documentos",
    description="Retorna os 50 documentos mais recentes do usuário autenticado.",
    response_model=List[DocumentListItem],
    responses={**_E401},
)
async def list_documents(current_user: dict = get_current_user):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Retorna apenas documentos do usuário autenticado
        cursor.execute(
            """
            SELECT id, original_name, status, progress_percent, created_at
            FROM documents
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 50
            """,
            (current_user["user_id"],),
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


# ──────────────────────────────────────────────────────── delete (BS-005)
@router.delete(
    "/{document_id}",
    status_code=204,
    tags=["Documentos"],
    summary="Excluir um documento",
    description=(
        "Remove o documento, seus chunks, gerações em cache e o arquivo no Gemini "
        "Files API. Retorna **204 No Content** em caso de sucesso."
    ),
    responses={
        **_E401, **_E404,
        204: {"description": "Documento excluído com sucesso (sem corpo)"},
    },
)
async def delete_document(
    document_id: int,
    current_user: dict = get_current_user,
):
    """
    DELETE /documents/{document_id}

    Exclui o documento, seus chunks, gerações em cache e o arquivo do Gemini Files API.
    Retorna 204 No Content em sucesso.
    Retorna 404 se o documento não existir ou não pertencer ao usuário autenticado
    (resposta idêntica para não revelar existência de documentos alheios).
    """
    user_id = current_user["user_id"]

    # 404 se não encontrado ou não é dono — evita revelar existência de docs alheios
    ownership_check(document_id, user_id)

    # Recupera metadados e remove arquivo do Gemini Files API (best-effort)
    # A camada de serviço é responsável por recursos externos
    doc_meta = await rag_service.delete_document(document_id)

    # Deleta do banco — ON DELETE CASCADE remove document_chunks e generations
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM documents WHERE id = %s", (document_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error("Erro ao deletar documento %d do banco: %s", document_id, e)
        raise HTTPException(status_code=500, detail="Erro interno ao excluir o documento")
    finally:
        cursor.close()
        conn.close()

    # Remove o arquivo PDF do disco (best-effort: loga aviso se falhar)
    file_path = doc_meta.get("file_path")
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
            logger.info("[DELETE] Arquivo físico removido do disco: %s", file_path)
        except OSError as exc:
            logger.warning(
                "[DELETE] Não foi possível remover arquivo do disco (%s): %s", file_path, exc
            )

    # Log de auditoria estruturado para rastreabilidade
    logger.info(
        "[AUDIT] doc_id=%d user_id=%d acao=DELETE arquivo='%s' tamanho=%d bytes gemini_uri=%s",
        document_id,
        user_id,
        doc_meta.get("original_name", "desconhecido"),
        doc_meta.get("file_size", 0),
        doc_meta.get("gemini_file_uri") or "N/A",
    )

    # 204 No Content — sem corpo de resposta (RFC 9110)
    return Response(status_code=204)


# ──────────────────────────────────────────────────────── helpers
def _get_or_generate_html(document_id: int, slides_data: dict) -> str:
    """Returns cached HTML from DB; only calls reveal_service if no cache exists."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT content FROM generations WHERE document_id=%s AND type='html_presentation' "
            "ORDER BY created_at DESC LIMIT 1",
            (document_id,),
        )
        row = cursor.fetchone()
        if row:
            cached = row[0]
            if isinstance(cached, dict) and "html" in cached:
                logger.info("html-view: cache hit para doc=%d", document_id)
                return cached["html"]
    finally:
        cursor.close()
        conn.close()

    from app.services.reveal_service import reveal_service
    output_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}.html")
    reveal_service.generate(
        title=slides_data.get("title", "Apresentação EduCore"),
        slides=slides_data.get("slides", []),
        output_path=output_path,
    )
    with open(output_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    try:
        os.remove(output_path)
    except Exception:
        pass

    _save_generation(document_id, "html_presentation", {"html": html_content})
    logger.info("html-view: gerado e cacheado no banco para doc=%d", document_id)
    return html_content


def _get_or_generate_slides(document_id: int) -> dict:
    """Returns cached slides from DB; only calls Gemini if no cache exists."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT content FROM generations WHERE document_id=%s AND type='slides' "
            "ORDER BY created_at DESC LIMIT 1",
            (document_id,),
        )
        row = cursor.fetchone()
        if row:
            logger.info("export: usando slides do cache para doc=%d", document_id)
            return row[0]
    finally:
        cursor.close()
        conn.close()
    logger.info("export: gerando slides via Gemini para doc=%d", document_id)
    return rag_service.generate_slides(document_id)


def _save_generation(document_id: int, gen_type: str, content: dict,
                     google_slides_url: str | None = None):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO generations (document_id, type, content, google_slides_url)
               VALUES (%s, %s, %s, %s)""",
            (document_id, gen_type, json.dumps(content), google_slides_url),
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.warning(f"Falha ao salvar geração no cache: {e}")
    finally:
        cursor.close()
        conn.close()


def _try_google_slides(slides_result: dict, user_email: str | None) -> str | None:
    """Attempts to create a Google Slides presentation. Returns URL or None (graceful fallback)."""
    try:
        from app.services.slides_service import slides_service
        if not slides_service.available:
            return None
        gs = slides_service.create_presentation(
            title=slides_result.get("title", "Apresentação EduCore"),
            slides_data=slides_result.get("slides", []),
            user_email=user_email,
        )
        if gs:
            logger.info("Google Slides criado: %s", gs["url"])
            return gs["url"]
    except Exception as exc:
        logger.warning("Falha ao criar Google Slides (fallback para PPTX): %s", exc)
    return None


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
