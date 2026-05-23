import json
import asyncio
import logging
from typing import List, Optional
from google import genai
from app.core.config import settings
from app.core.database import get_connection

logger = logging.getLogger(__name__)

client = genai.Client(api_key=settings.gemini_api_key)


class EmbedService:
    def __init__(self):
        self.model = settings.embedding_model
        self.batch_size = settings.embedding_batch_size
        self.concurrency = settings.embedding_concurrency

    # ------------------------------------------------------------------ sync
    def generate_embedding(self, text: str) -> List[float]:
        result = client.models.embed_content(
            model=self.model,
            contents=text,
            config={"task_type": "RETRIEVAL_DOCUMENT"},
        )
        return result.embeddings[0].values

    # ----------------------------------------------------------------- async
    async def _embed_one(self, semaphore: asyncio.Semaphore, text: str) -> Optional[List[float]]:
        async with semaphore:
            loop = asyncio.get_event_loop()
            try:
                return await loop.run_in_executor(None, self.generate_embedding, text)
            except Exception as e:
                logger.error(f"Embedding falhou: {e}")
                return None

    async def generate_embeddings_parallel(self, texts: List[str]) -> List[Optional[List[float]]]:
        """Generate embeddings in parallel with a concurrency semaphore."""
        semaphore = asyncio.Semaphore(self.concurrency)
        tasks = [self._embed_one(semaphore, text) for text in texts]
        results = await asyncio.gather(*tasks)
        total = len(results)
        ok = sum(1 for r in results if r is not None)
        logger.info(f"Embeddings: {ok}/{total} gerados com sucesso")
        return list(results)

    # --------------------------------------------------------------- persist
    async def save_chunks_with_embeddings(
        self,
        document_id: int,
        chunks: List[dict],
        progress_callback=None,
    ) -> int:
        """Save chunks with their embeddings using parallel generation."""
        texts = [c["content"] for c in chunks]
        embeddings = await self.generate_embeddings_parallel(texts)

        conn = get_connection()
        cursor = conn.cursor()
        saved = 0

        try:
            for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                if embedding is None:
                    continue
                cursor.execute(
                    """
                    INSERT INTO document_chunks
                        (document_id, content, chunk_index, embedding, metadata)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        document_id,
                        chunk["content"],
                        chunk["chunk_index"],
                        embedding,
                        json.dumps({"word_count": chunk.get("word_count", 0)}),
                    ),
                )
                saved += 1
                if progress_callback and (idx + 1) % 10 == 0:
                    progress_callback(idx + 1, len(chunks))

            conn.commit()
            logger.info(f"{saved} chunks salvos no banco")
            return saved

        except Exception as e:
            conn.rollback()
            logger.error(f"Erro ao salvar chunks: {e}")
            raise
        finally:
            cursor.close()
            conn.close()

    # ----------------------------------------------------------------- search
    def search_similar_chunks(
        self, query: str, document_id: int, limit: int = 10
    ) -> List[dict]:
        query_embedding = self.generate_embedding(query)
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                """
                SELECT content, chunk_index,
                       1 - (embedding <=> %s::vector) AS similarity
                FROM document_chunks
                WHERE document_id = %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (query_embedding, document_id, query_embedding, limit),
            )
            return [
                {"content": r[0], "chunk_index": r[1], "similarity": float(r[2])}
                for r in cursor.fetchall()
            ]
        except Exception as e:
            logger.error(f"Busca semântica falhou: {e}")
            raise
        finally:
            cursor.close()
            conn.close()

    def search_knowledge_base(
        self,
        query: str,
        exclude_document_id: Optional[int] = None,
        limit: int = 5,
        min_similarity: float = 0.75,
    ) -> List[dict]:
        """
        Cross-document knowledge base search.
        Finds semantically similar chunks from ALL processed documents.
        Only returns high-confidence matches (similarity >= min_similarity).
        """
        try:
            query_embedding = self.generate_embedding(query)
        except Exception:
            return []

        conn = get_connection()
        cursor = conn.cursor()
        try:
            exclude_clause = "AND dc.document_id != %s" if exclude_document_id else ""
            params: list = [query_embedding, query_embedding]
            if exclude_document_id:
                params.insert(1, exclude_document_id)

            cursor.execute(
                f"""
                SELECT dc.content,
                       dc.document_id,
                       d.original_name,
                       1 - (dc.embedding <=> %s::vector) AS similarity
                FROM document_chunks dc
                JOIN documents d ON d.id = dc.document_id
                WHERE d.status = 'completed'
                  {exclude_clause}
                  AND 1 - (dc.embedding <=> %s::vector) >= {min_similarity}
                ORDER BY dc.embedding <=> %s::vector
                LIMIT %s
                """,
                (*params, query_embedding, limit),
            )
            return [
                {
                    "content": r[0],
                    "document_id": r[1],
                    "source": r[2],
                    "similarity": float(r[3]),
                }
                for r in cursor.fetchall()
            ]
        except Exception as e:
            logger.warning(f"Knowledge base search falhou: {e}")
            return []
        finally:
            cursor.close()
            conn.close()


embed_service = EmbedService()
