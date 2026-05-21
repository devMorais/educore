import logging
from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.config import settings

logger = logging.getLogger(__name__)


class ChunkService:
    def __init__(self):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
        )

    def split_text(self, text: str) -> List[str]:
        """
        Divide o texto em chunks inteligentes.
        Respeita parágrafos, frases e palavras — nunca corta no meio.
        """
        if not text or len(text.strip()) == 0:
            logger.warning("Texto vazio recebido para chunking")
            return []

        chunks = self.splitter.split_text(text)

        # Remove chunks muito pequenos (menos de 50 caracteres)
        chunks = [c for c in chunks if len(c.strip()) >= 50]

        logger.info(f"Texto dividido em {len(chunks)} chunks")
        return chunks

    def split_with_metadata(self, text: str, document_id: int) -> List[dict]:
        """
        Divide o texto e retorna chunks com metadados.
        """
        chunks = self.split_text(text)

        return [
            {
                "content": chunk,
                "chunk_index": idx,
                "document_id": document_id,
                "char_count": len(chunk),
                "word_count": len(chunk.split())
            }
            for idx, chunk in enumerate(chunks)
        ]


chunk_service = ChunkService()