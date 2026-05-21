import logging
import json
from google import genai
from app.core.config import settings
from app.core.database import get_connection
from app.services.pdf_service import pdf_service
from app.services.chunk_service import chunk_service
from app.services.embed_service import embed_service

logger = logging.getLogger(__name__)

client = genai.Client(api_key=settings.gemini_api_key)


class RAGService:
    def __init__(self):
        self.model = settings.generation_model

    async def process_document(self, file_path: str, filename: str, document_id: int) -> dict:
        conn = get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(
                "UPDATE documents SET status = 'processing' WHERE id = %s",
                (document_id,)
            )
            conn.commit()

            logger.info(f"Extraindo texto: {filename}")
            text = await pdf_service.extract_text(file_path, filename)

            if not text or len(text.strip()) < 50:
                raise ValueError("PDF sem conteúdo legível")

            logger.info("Dividindo em chunks...")
            chunks = chunk_service.split_with_metadata(text, document_id)

            logger.info(f"Gerando embeddings para {len(chunks)} chunks...")
            saved = embed_service.save_chunks_with_embeddings(document_id, chunks)

            cursor.execute(
                "UPDATE documents SET status = 'completed' WHERE id = %s",
                (document_id,)
            )
            conn.commit()

            return {
                "status": "completed",
                "document_id": document_id,
                "chunks_saved": saved,
                "text_length": len(text)
            }

        except Exception as e:
            cursor.execute(
                "UPDATE documents SET status = 'failed' WHERE id = %s",
                (document_id,)
            )
            conn.commit()
            logger.error(f"Erro no pipeline RAG: {e}")
            raise e
        finally:
            cursor.close()
            conn.close()

    def generate_quiz(self, document_id: int, num_questions: int = 5) -> dict:
        chunks = embed_service.search_similar_chunks(
            query="conceitos principais, definições, fatos importantes",
            document_id=document_id,
            limit=8
        )

        context = "\n\n".join([c["content"] for c in chunks])

        prompt = f"""
        Com base no seguinte conteúdo educacional, crie {num_questions} perguntas de múltipla escolha.

        CONTEÚDO:
        {context}

        INSTRUÇÕES:
        - Crie perguntas claras e objetivas
        - Cada pergunta deve ter 4 alternativas (A, B, C, D)
        - Indique a resposta correta
        - Adicione uma explicação breve
        - Responda APENAS em JSON válido no formato:

        {{
            "title": "Quiz sobre o documento",
            "questions": [
                {{
                    "question": "pergunta aqui",
                    "options": ["A) opção", "B) opção", "C) opção", "D) opção"],
                    "correct_answer": "A) opção correta",
                    "explanation": "explicação aqui"
                }}
            ]
        }}
        """

        response = client.models.generate_content(
            model=self.model,
            contents=prompt
        )
        text = response.text.strip()

        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        result = json.loads(text)
        result["document_id"] = document_id
        result["total_questions"] = len(result.get("questions", []))
        return result

    def generate_summary(self, document_id: int) -> dict:
        chunks = embed_service.search_similar_chunks(
            query="ideias principais, resumo, conclusão",
            document_id=document_id,
            limit=10
        )

        context = "\n\n".join([c["content"] for c in chunks])

        prompt = f"""
        Resuma o seguinte conteúdo educacional de forma clara e objetiva.

        CONTEÚDO:
        {context}

        Responda APENAS em JSON válido:
        {{
            "title": "título do conteúdo",
            "summary": "resumo em 3-5 parágrafos",
            "key_points": ["ponto 1", "ponto 2", "ponto 3", "ponto 4", "ponto 5"]
        }}
        """

        response = client.models.generate_content(
            model=self.model,
            contents=prompt
        )
        text = response.text.strip()

        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        result = json.loads(text)
        result["document_id"] = document_id
        result["word_count"] = len(result.get("summary", "").split())
        return result

    def generate_slides(self, document_id: int, num_slides: int = 8) -> dict:
        chunks = embed_service.search_similar_chunks(
            query="tópicos principais, estrutura, organização do conteúdo",
            document_id=document_id,
            limit=10
        )

        context = "\n\n".join([c["content"] for c in chunks])

        prompt = f"""
        Crie uma estrutura de apresentação de slides para o seguinte conteúdo educacional.

        CONTEÚDO:
        {context}

        Crie {num_slides} slides. Responda APENAS em JSON válido:
        {{
            "title": "título da apresentação",
            "slides": [
                {{
                    "title": "título do slide",
                    "content": ["tópico 1", "tópico 2", "tópico 3"],
                    "notes": "notas do apresentador"
                }}
            ]
        }}
        """

        response = client.models.generate_content(
            model=self.model,
            contents=prompt
        )
        text = response.text.strip()

        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        result = json.loads(text)
        result["document_id"] = document_id
        result["total_slides"] = len(result.get("slides", []))
        return result


rag_service = RAGService()