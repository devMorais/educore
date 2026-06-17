import logging
import asyncio
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger(__name__)

client = genai.Client(api_key=settings.gemini_api_key)


@dataclass
class GeminiUpload:
    """Resultado de um upload ao Gemini Files API."""
    uri: str
    expires_at: datetime  # sempre tz-aware (UTC)


def _expira_em(file_obj) -> datetime:
    """
    Expiração da URI. Preferimos o `expiration_time` REAL retornado pela API
    (mais preciso que assumir 48h fixas); se a API não informar, caímos no
    fallback NOW()+TTL (configurável). Sempre retorna datetime tz-aware (UTC).
    """
    exp = getattr(file_obj, "expiration_time", None)
    if exp is not None:
        # A SDK pode devolver naive (UTC) ou aware — normaliza para aware/UTC.
        return exp if exp.tzinfo else exp.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) + timedelta(hours=settings.gemini_file_ttl_hours)


def _ascii_safe(nome: str) -> str:
    """
    Converte o nome do arquivo para ASCII (o display_name vai em header HTTP).
    Translitera acentos (ç→c, ã→a) e descarta caracteres não-ASCII como o traço
    longo "–", evitando UnicodeEncodeError no upload ao Gemini Files API.
    """
    normalizado = unicodedata.normalize("NFKD", nome or "")
    ascii_nome = normalizado.encode("ascii", "ignore").decode("ascii").strip()
    return ascii_nome or "document.pdf"


class GeminiFileService:
    """Manages PDF uploads to the Gemini Files API for direct document processing."""

    async def upload(self, file_path: str, display_name: str = "") -> GeminiUpload:
        """
        Upload assíncrono de um PDF ao Gemini Files API (não bloqueia o event loop).
        Retorna GeminiUpload(uri, expires_at). A URI vale ~48h.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._upload_sync, file_path, display_name)

    def upload_sync(self, file_path: str, display_name: str = "") -> GeminiUpload:
        """
        Versão SÍNCRONA do upload — usada na renovação lazy (BS-019), que acontece
        dentro do caminho de geração (síncrono). Retorna GeminiUpload(uri, expires_at).
        """
        return self._upload_sync(file_path, display_name)

    def _upload_sync(self, file_path: str, display_name: str) -> GeminiUpload:
        logger.info(f"Enviando para Gemini Files API: {display_name}")
        file_obj = client.files.upload(
            file=file_path,
            config=types.UploadFileConfig(
                mime_type="application/pdf",
                display_name=_ascii_safe(display_name or file_path.split("/")[-1]),
            ),
        )
        # Wait until file is ACTIVE (processing on Google's side)
        import time
        max_wait = 120
        waited = 0
        while file_obj.state.name == "PROCESSING" and waited < max_wait:
            time.sleep(2)
            waited += 2
            file_obj = client.files.get(name=file_obj.name)

        if file_obj.state.name != "ACTIVE":
            raise RuntimeError(f"Gemini file não ficou ACTIVE: {file_obj.state.name}")

        expires_at = _expira_em(file_obj)
        logger.info(f"Gemini Files API: {file_obj.uri} (expira em {expires_at.isoformat()})")
        return GeminiUpload(uri=file_obj.uri, expires_at=expires_at)

    async def delete(self, file_uri: str):
        """Delete a file from Gemini Files API (cleanup)."""
        try:
            file_name = file_uri.split("/")[-1]
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, client.files.delete, file_name)
        except Exception as e:
            logger.warning(f"Não foi possível deletar arquivo Gemini: {e}")

    def is_available(self, file_uri: str) -> bool:
        """Check if a Gemini file is still available (not expired)."""
        try:
            file_name = file_uri.split("/")[-1]
            file_obj = client.files.get(name=file_name)
            return file_obj.state.name == "ACTIVE"
        except Exception:
            return False

    def build_content_parts(self, file_uri: str, prompt: str) -> list:
        """Build the content list for Gemini generation with a PDF file."""
        return [
            types.Part(
                file_data=types.FileData(
                    mime_type="application/pdf",
                    file_uri=file_uri,
                )
            ),
            types.Part(text=prompt),
        ]


gemini_file_service = GeminiFileService()
