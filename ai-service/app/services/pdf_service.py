import os
import tempfile
import logging
from typing import Optional
from llama_parse import LlamaParse
import fitz  # PyMuPDF
from app.core.config import settings

logger = logging.getLogger(__name__)


class PDFService:
    def __init__(self):
        self.llamaparse = LlamaParse(
            api_key=settings.llamaparse_api_key,
            result_type="markdown",
            verbose=True,
            language="pt"
        )

    async def extract_text(self, file_path: str, filename: str) -> str:
        """
        Extrai texto do PDF usando LlamaParse como primário
        e PyMuPDF como fallback.
        """
        logger.info(f"Iniciando extração do PDF: {filename}")

        try:
            text = await self._extract_with_llamaparse(file_path)
            if text and len(text.strip()) > 100:
                logger.info(f"LlamaParse extraiu {len(text)} caracteres")
                return text
        except Exception as e:
            logger.warning(f"LlamaParse falhou: {e} — usando PyMuPDF como fallback")

        return self._extract_with_pymupdf(file_path)

    async def _extract_with_llamaparse(self, file_path: str) -> str:
        """Extração premium com LlamaParse — preserva estrutura."""
        documents = await self.llamaparse.aload_data(file_path)
        return "\n\n".join([doc.text for doc in documents])

    def _extract_with_pymupdf(self, file_path: str) -> str:
        """Extração local com PyMuPDF — fallback gratuito."""
        logger.info("Usando PyMuPDF para extração")
        doc = fitz.open(file_path)
        text_parts = []

        for page_num, page in enumerate(doc):
            text = page.get_text("text")
            if text.strip():
                text_parts.append(f"## Página {page_num + 1}\n\n{text}")

        doc.close()
        full_text = "\n\n".join(text_parts)
        logger.info(f"PyMuPDF extraiu {len(full_text)} caracteres")
        return full_text

    def get_pdf_info(self, file_path: str) -> dict:
        """Retorna metadados do PDF."""
        doc = fitz.open(file_path)
        info = {
            "pages": len(doc),
            "title": doc.metadata.get("title", ""),
            "author": doc.metadata.get("author", ""),
            "file_size": os.path.getsize(file_path)
        }
        doc.close()
        return info


pdf_service = PDFService()