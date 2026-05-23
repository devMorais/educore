import os
import asyncio
import logging
from typing import Optional, Callable, AsyncIterator
from llama_parse import LlamaParse
import fitz  # PyMuPDF
from app.core.config import settings

logger = logging.getLogger(__name__)

# Batch size for LlamaParse on large documents
_LLAMAPARSE_BATCH_PAGES = 50


class PDFService:
    def __init__(self):
        self.llamaparse = LlamaParse(
            api_key=settings.llamaparse_api_key,
            result_type="markdown",
            verbose=False,
            language="pt",
        )

    async def extract_text(
        self,
        file_path: str,
        filename: str,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> str:
        """
        Extracts text from PDF.
        - Uses LlamaParse (premium, structure-preserving) as primary.
        - Falls back to PyMuPDF page-by-page streaming for large/failed PDFs.
        - Reports progress via progress_callback(pages_done, total_pages).
        """
        info = self.get_pdf_info(file_path)
        total_pages = info["pages"]
        logger.info(f"Iniciando extração: {filename} ({total_pages} páginas)")

        try:
            text = await self._extract_with_llamaparse(file_path, total_pages, progress_callback)
            if text and len(text.strip()) > 100:
                logger.info(f"LlamaParse: {len(text)} caracteres extraídos")
                if progress_callback:
                    progress_callback(total_pages, total_pages)
                return text
        except Exception as e:
            logger.warning(f"LlamaParse falhou ({e}) — usando PyMuPDF streaming")

        return await self._extract_with_pymupdf_streaming(file_path, total_pages, progress_callback)

    async def _extract_with_llamaparse(
        self,
        file_path: str,
        total_pages: int,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> str:
        if total_pages <= _LLAMAPARSE_BATCH_PAGES:
            # Small document: single request
            documents = await self.llamaparse.aload_data(file_path)
            if progress_callback:
                progress_callback(total_pages, total_pages)
            return "\n\n".join([doc.text for doc in documents])

        # Large document: split PDF into batches of 50 pages then parse each
        import tempfile, shutil
        text_parts: list[str] = []
        pages_done = 0

        doc = fitz.open(file_path)
        batches = range(0, total_pages, _LLAMAPARSE_BATCH_PAGES)
        tasks = []

        with tempfile.TemporaryDirectory() as tmpdir:
            batch_paths = []
            for batch_start in batches:
                batch_end = min(batch_start + _LLAMAPARSE_BATCH_PAGES, total_pages)
                batch_path = os.path.join(tmpdir, f"batch_{batch_start}.pdf")
                batch_doc = fitz.open()
                batch_doc.insert_pdf(doc, from_page=batch_start, to_page=batch_end - 1)
                batch_doc.save(batch_path)
                batch_doc.close()
                batch_paths.append((batch_start, batch_end, batch_path))

            doc.close()

            # Parse batches in parallel (max 4 concurrent to respect API limits)
            semaphore = asyncio.Semaphore(4)

            async def parse_batch(batch_start, batch_end, batch_path):
                async with semaphore:
                    docs = await self.llamaparse.aload_data(batch_path)
                    return batch_end, "\n\n".join([d.text for d in docs])

            tasks = [
                parse_batch(bs, be, bp)
                for bs, be, bp in batch_paths
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in sorted(results, key=lambda x: x[0] if not isinstance(x, Exception) else 0):
                if isinstance(r, Exception):
                    logger.warning(f"Batch LlamaParse falhou: {r}")
                    continue
                pages_done, text = r
                text_parts.append(text)
                if progress_callback:
                    progress_callback(pages_done, total_pages)

        return "\n\n".join(text_parts)

    async def _extract_with_pymupdf_streaming(
        self,
        file_path: str,
        total_pages: int,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> str:
        """Stream text page-by-page without loading entire PDF into memory."""
        logger.info(f"PyMuPDF streaming: {total_pages} páginas")
        text_parts: list[str] = []

        doc = fitz.open(file_path)
        try:
            for page_num in range(total_pages):
                page = doc[page_num]
                text = page.get_text("text")
                if text.strip():
                    text_parts.append(f"## Página {page_num + 1}\n\n{text}")

                # Yield control to the event loop every 10 pages
                if page_num % 10 == 0:
                    await asyncio.sleep(0)
                    if progress_callback:
                        progress_callback(page_num + 1, total_pages)
        finally:
            doc.close()

        full_text = "\n\n".join(text_parts)
        logger.info(f"PyMuPDF: {len(full_text)} caracteres extraídos")
        if progress_callback:
            progress_callback(total_pages, total_pages)
        return full_text

    def get_pdf_info(self, file_path: str) -> dict:
        doc = fitz.open(file_path)
        info = {
            "pages": len(doc),
            "title": doc.metadata.get("title", ""),
            "author": doc.metadata.get("author", ""),
            "file_size": os.path.getsize(file_path),
        }
        doc.close()
        return info


pdf_service = PDFService()
