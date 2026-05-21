import json
import logging
from typing import List
from google import genai
from app.core.config import settings
from app.core.database import get_connection

logger = logging.getLogger(__name__)

client = genai.Client(api_key=settings.gemini_api_key)


class EmbedService:
    def __init__(self):
        self.model = settings.embedding_model

    def generate_embedding(self, text: str) -> List[float]:
        try:
            result = client.models.embed_content(
                model=self.model,
                contents=text,
                config={"task_type": "RETRIEVAL_DOCUMENT"}
            )
            return result.embeddings[0].values
        except Exception as e:
            logger.error(f"Erro ao gerar embedding: {e}")
            raise e

    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        embeddings = []
        for idx, text in enumerate(texts):
            try:
                embedding = self.generate_embedding(text)
                embeddings.append(embedding)
                if (idx + 1) % 10 == 0:
                    logger.info(f"Embeddings gerados: {idx + 1}/{len(texts)}")
            except Exception as e:
                logger.error(f"Erro no chunk {idx}: {e}")
                embeddings.append(None)
        return embeddings

    def save_chunks_with_embeddings(self, document_id: int, chunks: List[dict]) -> int:
        conn = get_connection()
        cursor = conn.cursor()
        saved = 0

        try:
            for chunk in chunks:
                embedding = self.generate_embedding(chunk["content"])

                if embedding:
                    cursor.execute("""
                        INSERT INTO document_chunks
                            (document_id, content, chunk_index, embedding, metadata)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (
                        document_id,
                        chunk["content"],
                        chunk["chunk_index"],
                        embedding,
                        json.dumps({"word_count": chunk.get("word_count", 0)})
                    ))
                    saved += 1

            conn.commit()
            logger.info(f"{saved} chunks salvos com embeddings")
            return saved

        except Exception as e:
            conn.rollback()
            logger.error(f"Erro ao salvar chunks: {e}")
            raise e
        finally:
            cursor.close()
            conn.close()

    def search_similar_chunks(self, query: str, document_id: int, limit: int = 5) -> List[dict]:
        query_embedding = self.generate_embedding(query)

        conn = get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                SELECT content, chunk_index,
                       1 - (embedding <=> %s::vector) AS similarity
                FROM document_chunks
                WHERE document_id = %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """, (query_embedding, document_id, query_embedding, limit))

            results = cursor.fetchall()
            return [
                {
                    "content": row[0],
                    "chunk_index": row[1],
                    "similarity": float(row[2])
                }
                for row in results
            ]

        except Exception as e:
            logger.error(f"Erro na busca semântica: {e}")
            raise e
        finally:
            cursor.close()
            conn.close()


embed_service = EmbedService()