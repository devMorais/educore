import logging
import json
import re
from google import genai
from google.genai import types
from app.core.config import settings
from app.core.database import get_connection
from app.services.pdf_service import pdf_service
from app.services.chunk_service import chunk_service
from app.services.embed_service import embed_service
from app.services.gemini_file_service import gemini_file_service

logger = logging.getLogger(__name__)
client = genai.Client(api_key=settings.gemini_api_key)


def _parse_json(text: str) -> dict:
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    if match:
        text = match.group(1)
    return json.loads(text)


def _build_context(chunks: list[dict]) -> str:
    return "\n\n---\n\n".join(c["content"] for c in chunks)


def _get_gemini_file_uri(document_id: int) -> str | None:
    """Fetch the Gemini file URI for a document, if available and still active."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT gemini_file_uri FROM documents WHERE id = %s",
            (document_id,),
        )
        row = cursor.fetchone()
        if not row or not row[0]:
            return None
        uri = row[0]
        # Quick availability check (cached implicitly by Google for 48h)
        if gemini_file_service.is_available(uri):
            return uri
        # URI expired — clear it so next call falls back to RAG
        cursor.execute(
            "UPDATE documents SET gemini_file_uri = NULL WHERE id = %s",
            (document_id,),
        )
        conn.commit()
        return None
    finally:
        cursor.close()
        conn.close()


def _generate_with_file(file_uri: str, prompt: str) -> dict:
    """Generate content by passing the full PDF to Gemini — no chunking needed."""
    contents = gemini_file_service.build_content_parts(file_uri, prompt)
    response = client.models.generate_content(model=settings.generation_model, contents=contents)
    return _parse_json(response.text)


def _generate_with_rag(chunks: list[dict], prompt_template: str) -> dict:
    """Fallback: use RAG context chunks."""
    context = _build_context(chunks)
    full_prompt = prompt_template.replace("{CONTEXT}", context)
    response = client.models.generate_content(model=settings.generation_model, contents=full_prompt)
    return _parse_json(response.text)


class RAGService:
    def __init__(self):
        self.model = settings.generation_model

    # ──────────────────────────────────────────────────── pipeline
    async def process_document(self, file_path: str, filename: str, document_id: int) -> dict:
        """
        Two-phase processing:
        Phase 1 (fast, ~10-30s): Upload to Gemini Files API → status='completed'
        Phase 2 (background): Extract → Chunk → Embed → RAG knowledge base
        """
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "UPDATE documents SET status='processing', progress_percent=5 WHERE id=%s",
                (document_id,),
            )
            conn.commit()

            # ── Phase 1: Gemini Files API (unlocks generation immediately) ──
            logger.info(f"[Phase 1] Enviando para Gemini Files API: {filename}")
            try:
                file_uri = await gemini_file_service.upload(file_path, filename)
                cursor.execute(
                    "UPDATE documents SET gemini_file_uri=%s, progress_percent=30 WHERE id=%s",
                    (file_uri, document_id),
                )
                conn.commit()
                logger.info(f"[Phase 1] Gemini file_uri salvo: {file_uri}")
            except Exception as e:
                logger.warning(f"[Phase 1] Gemini upload falhou ({e}) — continuando sem file_uri")

            # ── Phase 2: RAG pipeline (background, enriches knowledge base) ──
            logger.info(f"[Phase 2] Iniciando RAG pipeline: {filename}")
            cursor.execute(
                "UPDATE documents SET rag_status='processing', progress_percent=35 WHERE id=%s",
                (document_id,),
            )
            conn.commit()

            def on_extract_progress(pages_done: int, total_pages: int):
                pct = 35 + int((pages_done / max(total_pages, 1)) * 35)
                try:
                    c = conn.cursor()
                    c.execute(
                        "UPDATE documents SET progress_percent=%s, pages_processed=%s, total_pages=%s WHERE id=%s",
                        (pct, pages_done, total_pages, document_id),
                    )
                    conn.commit()
                    c.close()
                except Exception:
                    pass

            text = await pdf_service.extract_text(file_path, filename, on_extract_progress)

            if text and len(text.strip()) >= 50:
                chunks = chunk_service.split_with_metadata(text, document_id)
                logger.info(f"[Phase 2] {len(chunks)} chunks gerados")

                def on_embed_progress(done: int, total: int):
                    pct = 70 + int((done / max(total, 1)) * 28)
                    try:
                        c = conn.cursor()
                        c.execute(
                            "UPDATE documents SET progress_percent=%s WHERE id=%s",
                            (pct, document_id),
                        )
                        conn.commit()
                        c.close()
                    except Exception:
                        pass

                await embed_service.save_chunks_with_embeddings(document_id, chunks, on_embed_progress)
                cursor.execute(
                    "UPDATE documents SET rag_status='completed' WHERE id=%s",
                    (document_id,),
                )
            else:
                cursor.execute(
                    "UPDATE documents SET rag_status='skipped' WHERE id=%s",
                    (document_id,),
                )

            cursor.execute(
                "UPDATE documents SET status='completed', progress_percent=100 WHERE id=%s",
                (document_id,),
            )
            conn.commit()
            return {"status": "completed", "document_id": document_id}

        except Exception as e:
            cursor.execute(
                "UPDATE documents SET status='failed' WHERE id=%s", (document_id,)
            )
            conn.commit()
            logger.error(f"Pipeline RAG falhou: {e}")
            raise
        finally:
            cursor.close()
            conn.close()

    # ──────────────────────────────────────────────────────── quiz
    def generate_quiz(self, document_id: int, num_questions: int = None) -> dict:
        n = num_questions or settings.default_quiz_questions
        easy = max(1, int(n * 0.33))
        medium = max(1, int(n * 0.40))
        hard = n - easy - medium

        prompt = f"""Você é um professor especialista criando uma avaliação educacional de alto nível em português brasileiro.

TAREFA: Crie exatamente {n} questões divididas:
- {easy} FÁCEIS (conceitos diretos) — type: "multiple_choice"
- {medium} MÉDIAS (aplicação de conceitos) — type: "multiple_choice"
- {int(hard * 0.75)} DIFÍCEIS (análise, síntese) — type: "multiple_choice"
- {hard - int(hard * 0.75)} VERDADEIRO/FALSO — type: "true_false"

REGRAS:
1. Para multiple_choice: 4 alternativas únicas, apenas 1 correta, sem "todas acima" ou "nenhuma"
2. Para true_false: options deve ser ["Verdadeiro", "Falso"]
3. Cada questão avalia um tópico diferente
4. explanation: 2-3 frases pedagógicas
5. Não repita perguntas semelhantes
6. topic identifica o tema específico

Retorne APENAS JSON válido:
{{
  "title": "título descritivo do quiz",
  "questions": [
    {{
      "question": "texto da pergunta",
      "type": "multiple_choice",
      "options": ["A) opção 1", "B) opção 2", "C) opção 3", "D) opção 4"],
      "correct_answer": "A) opção correta",
      "explanation": "explicação pedagógica detalhada",
      "difficulty": "easy",
      "topic": "nome do tópico"
    }}
  ]
}}"""

        file_uri = _get_gemini_file_uri(document_id)
        if file_uri:
            logger.info(f"Quiz via Gemini Files API: doc={document_id}")
            result = _generate_with_file(file_uri, prompt)
        else:
            logger.info(f"Quiz via RAG: doc={document_id}")
            chunks = embed_service.search_similar_chunks(
                query="conceitos principais, definições, teorias, fatos importantes, dados, exemplos, processos",
                document_id=document_id,
                limit=settings.quiz_context_chunks,
            )
            kb_chunks = embed_service.search_knowledge_base(
                query="conceitos educacionais relacionados",
                exclude_document_id=document_id,
                limit=5,
            )
            rag_prompt = f"CONTEÚDO DO DOCUMENTO:\n{{CONTEXT}}\n\nCONHECIMENTO ADICIONAL:\n{_build_context(kb_chunks)}\n\n{prompt}"
            result = _generate_with_rag(chunks, rag_prompt)

        result["document_id"] = document_id
        result["total_questions"] = len(result.get("questions", []))
        return result

    # ────────────────────────────────────────────────────── summary
    def generate_summary(self, document_id: int) -> dict:
        prompt = """Você é um especialista em síntese de conteúdo educacional.

TAREFA: Crie um resumo educacional completo e rico.

Retorne APENAS JSON válido:
{
  "title": "título preciso do conteúdo",
  "summary": "resumo em 4-6 parágrafos bem desenvolvidos, cada parágrafo separado por \\n\\n",
  "key_points": [
    "ponto-chave 1 — descrição completa",
    "ponto-chave 2 — descrição completa",
    "ponto-chave 3 — descrição completa",
    "ponto-chave 4 — descrição completa",
    "ponto-chave 5 — descrição completa",
    "ponto-chave 6 — descrição completa",
    "ponto-chave 7 — descrição completa"
  ]
}"""

        file_uri = _get_gemini_file_uri(document_id)
        if file_uri:
            result = _generate_with_file(file_uri, prompt)
        else:
            chunks = embed_service.search_similar_chunks(
                query="ideias principais, argumentos centrais, conclusões, resumo, pontos-chave",
                document_id=document_id,
                limit=15,
            )
            result = _generate_with_rag(chunks, f"CONTEÚDO:\n{{CONTEXT}}\n\n{prompt}")

        result["document_id"] = document_id
        result["word_count"] = len(result.get("summary", "").split())
        return result

    # ──────────────────────────────────────────────────────── slides
    def generate_slides(self, document_id: int, num_slides: int = None) -> dict:
        n = num_slides or settings.default_slide_count
        prompt = f"""Você é um designer instrucional e especialista em apresentações educacionais de ALTO NÍVEL.

TAREFA: Crie uma apresentação com {n} slides:
1. Slide de CAPA (layout: "cover")
2. Slide de OBJETIVOS (layout: "objectives") — 4-5 objetivos Bloom
3. 2-3 DIVISORES DE SEÇÃO (layout: "section_divider")
4. Slides de CONTEÚDO variando: "content_bullets", "two_column", "quote_highlight", "stats_numbers", "timeline"
5. Slide de SÍNTESE (layout: "summary")
6. Slide de AVALIAÇÃO (layout: "assessment") — 3 questões de reflexão
7. Slide de ENCERRAMENTO (layout: "closing")

Princípios: UM conceito por slide, regra 6×6, títulos provocativos, speaker notes detalhados.

Retorne APENAS JSON válido:
{{
  "title": "título completo",
  "slides": [
    {{
      "title": "título do slide",
      "layout": "cover",
      "content": ["item 1"],
      "notes": "notas para o apresentador",
      "visual_suggestion": "sugestão visual",
      "accent_color": "blue"
    }}
  ]
}}"""

        file_uri = _get_gemini_file_uri(document_id)
        if file_uri:
            result = _generate_with_file(file_uri, prompt)
        else:
            chunks = embed_service.search_similar_chunks(
                query="estrutura, tópicos principais, argumentos, evidências, dados, conclusões",
                document_id=document_id,
                limit=settings.slides_context_chunks,
            )
            result = _generate_with_rag(chunks, f"CONTEÚDO:\n{{CONTEXT}}\n\n{prompt}")

        result["document_id"] = document_id
        result["total_slides"] = len(result.get("slides", []))
        return result

    # ──────────────────────────────────────────────────── mindmap
    def generate_mindmap(self, document_id: int) -> dict:
        max_d = settings.mindmap_max_depth
        max_c = settings.mindmap_max_children
        prompt = f"""Crie um mapa mental hierárquico em português brasileiro.

REGRAS:
- Máx {max_d} níveis: raiz → subtemas → conceitos → detalhes
- Máx {max_c} filhos por nó (Lei de Miller)
- Cada nó: 3-7 palavras
- IDs únicos: "root", "1", "1.1", "1.1.1"

Retorne APENAS JSON válido:
{{
  "title": "tema do documento",
  "root": {{
    "id": "root",
    "topic": "tema central",
    "children": [
      {{
        "id": "1",
        "topic": "área principal 1",
        "children": [
          {{"id": "1.1", "topic": "conceito", "children": []}}
        ]
      }}
    ]
  }}
}}"""

        file_uri = _get_gemini_file_uri(document_id)
        if file_uri:
            result = _generate_with_file(file_uri, prompt)
        else:
            chunks = embed_service.search_similar_chunks(
                query="tópicos principais, subtópicos, conceitos, categorias, hierarquia",
                document_id=document_id,
                limit=settings.mindmap_context_chunks,
            )
            result = _generate_with_rag(chunks, f"CONTEÚDO:\n{{CONTEXT}}\n\n{prompt}")

        result["document_id"] = document_id
        return result

    # ──────────────────────────────────────────────────── flashcards
    def generate_flashcards(self, document_id: int, num_cards: int = None) -> dict:
        n = num_cards or settings.default_flashcard_count
        half = n // 2
        prompt = f"""Crie {n} flashcards de estudo de alta qualidade em português brasileiro.

DISTRIBUIÇÃO:
- {half} CONCEITO → DEFINIÇÃO
- {n - half} PERGUNTA → RESPOSTA

REGRAS: Frente ≤ 15 palavras, verso ≤ 40 palavras, topics variados, ordem básico→complexo.

Retorne APENAS JSON válido:
{{
  "title": "conjunto de flashcards",
  "cards": [
    {{"front": "conceito ou pergunta", "back": "definição ou resposta", "topic": "área"}}
  ]
}}"""

        file_uri = _get_gemini_file_uri(document_id)
        if file_uri:
            result = _generate_with_file(file_uri, prompt)
        else:
            chunks = embed_service.search_similar_chunks(
                query="definições, conceitos-chave, terminologia, fatos, processos",
                document_id=document_id,
                limit=15,
            )
            result = _generate_with_rag(chunks, f"CONTEÚDO:\n{{CONTEXT}}\n\n{prompt}")

        result["document_id"] = document_id
        result["total_cards"] = len(result.get("cards", []))
        return result

    # ──────────────────────────────────────────────────────── pcd
    def generate_pcd_content(self, document_id: int) -> dict:
        prompt = """Crie material educacional ACESSÍVEL em 4 formatos para pessoas com deficiência (PCD) em português brasileiro.

FORMATO 1 — TEXTO SIMPLIFICADO: nível 5ª série, frases curtas (≤15 palavras), voz ativa, 8-10 parágrafos.
FORMATO 2 — ROTEIRO DE ÁUDIO: tom conversacional, [PAUSA CURTA]/[PAUSA LONGA], [IMAGEM: descrição].
FORMATO 3 — ALTERNATIVAS VISUAIS: 5-8 descrições textuais de possíveis imagens/gráficos.
FORMATO 4 — VOCABULÁRIO-CHAVE: 12-15 termos com definições acessíveis.
FORMATO 5 — SUGESTÕES LIBRAS: 5-7 momentos onde vídeo LIBRAS seria impactante.

Retorne APENAS JSON válido:
{
  "title": "título",
  "simplified_text": "texto simplificado...",
  "audio_script": "roteiro...",
  "visual_alternatives": ["descrição 1"],
  "key_vocabulary": [{"term": "termo", "definition": "definição acessível"}],
  "wcag_metadata": {"reading_level": "Fundamental II", "estimated_duration": "8 minutos", "complexity_score": 0.6},
  "libras_suggestions": ["sugestão específica"]
}"""

        file_uri = _get_gemini_file_uri(document_id)
        if file_uri:
            result = _generate_with_file(file_uri, prompt)
        else:
            chunks = embed_service.search_similar_chunks(
                query="conteúdo principal, ideias centrais, informações essenciais",
                document_id=document_id,
                limit=20,
            )
            result = _generate_with_rag(chunks, f"CONTEÚDO:\n{{CONTEXT}}\n\n{prompt}")

        result["document_id"] = document_id
        return result


rag_service = RAGService()
