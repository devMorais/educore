import logging
import json
import os
import re
import time
import random
import httpx
from google import genai
from google.genai import types
from google.genai import errors as genai_errors
from app.core.config import settings
from app.core.database import get_connection
from app.services.pdf_service import pdf_service
from app.services.chunk_service import chunk_service
from app.services.embed_service import embed_service
from app.services.gemini_file_service import gemini_file_service
from app.services.libras_service import libras_service

logger = logging.getLogger(__name__)
client = genai.Client(api_key=settings.gemini_api_key)


def _parse_json(text: str) -> dict:
    """
    Extrai e parseia JSON da resposta do modelo, de forma robusta:
    - remove blocos cercados por ```json ... ```
    - se ainda houver prosa em volta (ex.: "Aqui está o quiz: {...}"), recorta
      do primeiro { ou [ até o último } ou ] — alguns modelos (Llama/Gemma)
      adicionam preâmbulo, o que quebraria um json.loads direto.
    """
    text = (text or "").strip()

    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    if match:
        text = match.group(1).strip()

    if text and text[0] not in "{[":
        inicios = [i for i in (text.find("{"), text.find("[")) if i != -1]
        if inicios:
            ini = min(inicios)
            fim = max(text.rfind("}"), text.rfind("]"))
            if fim > ini:
                text = text[ini:fim + 1]

    return json.loads(text)


def _build_context(chunks: list[dict]) -> str:
    return "\n\n---\n\n".join(c["content"] for c in chunks)


def _get_gemini_file_uri(document_id: int) -> str | None:
    """
    Retorna a URI do Gemini para o documento, renovando-a sob demanda (BS-019).

    Estratégia LAZY (sem custo para documentos "frios"):
      • Sem URI registrada            → None (cai no RAG).
      • URI com folga (> buffer)       → retorna direto, SEM bater na API do Gemini
                                         (checagem por timestamp local = caminho rápido).
      • URI perto de expirar/expirada  → tenta reupload do PDF local:
            – sucesso          → grava nova uri/expires_at e retorna a nova URI;
            – PDF ausente/erro  → loga WARNING e retorna None (fallback RAG).
    """
    # Em teste forçado para outro provedor, ignora o caminho do PDF-Gemini
    forcado = settings.ai_force_provider
    if forcado and forcado.lower() != "gemini":
        return None

    conn = get_connection()
    cursor = conn.cursor()
    try:
        # A comparação de expiração é feita no Postgres (NOW()), evitando
        # qualquer ambiguidade de timezone no lado do Python.
        cursor.execute(
            """
            SELECT gemini_file_uri,
                   (gemini_file_expires_at IS NOT NULL
                    AND gemini_file_expires_at > NOW() + make_interval(hours => %s)) AS fresca,
                   file_path,
                   original_name
            FROM documents WHERE id = %s
            """,
            (settings.gemini_uri_renew_buffer_hours, document_id),
        )
        row = cursor.fetchone()
        if not row or not row[0]:
            return None
        uri, fresca, file_path, original_name = row
        if fresca:
            return uri  # caminho quente: zero round-trip à API do Gemini

        logger.info(f"[BS-019] URI do doc={document_id} perto de expirar/expirada — renovando")
        return _renovar_uri(document_id, file_path, original_name, cursor, conn)
    finally:
        cursor.close()
        conn.close()


def _renovar_uri(document_id: int, file_path: str | None,
                 original_name: str | None, cursor, conn) -> str | None:
    """
    Reenvia o PDF local ao Gemini Files API e atualiza uri/expires_at (BS-019).
    Retorna a nova URI, ou None se o PDF não estiver em disco / o upload falhar
    (nesses casos a geração segue pelo RAG).

    Nota de concorrência: duas gerações simultâneas do MESMO documento expirado
    podem disparar dois reuploads; é idempotente o suficiente (a última escrita
    vence e a URI antiga expira sozinha em ~48h). Para esta escala, evitamos o
    custo de um lock distribuído. Em volume maior, serializar com
    `pg_advisory_xact_lock(document_id)` resolveria.
    """
    if not file_path or not os.path.exists(file_path):
        logger.warning(
            f"[BS-019][AUDIT] doc={document_id} renovacao=FALHOU motivo=pdf_ausente "
            f"path={file_path!r} -> fallback RAG"
        )
        # Limpa a URI vencida para não retentar (e pagar latência) a cada geração.
        cursor.execute(
            "UPDATE documents SET gemini_file_uri = NULL WHERE id = %s",
            (document_id,),
        )
        conn.commit()
        return None

    try:
        up = gemini_file_service.upload_sync(file_path, original_name or "document.pdf")
        cursor.execute(
            "UPDATE documents SET gemini_file_uri = %s, gemini_file_expires_at = %s, "
            "updated_at = NOW() WHERE id = %s",
            (up.uri, up.expires_at, document_id),
        )
        conn.commit()
        logger.info(
            f"[BS-019][AUDIT] doc={document_id} renovacao=OK "
            f"nova_uri={up.uri} expira_em={up.expires_at.isoformat()}"
        )
        return up.uri
    except Exception as e:
        logger.warning(
            f"[BS-019][AUDIT] doc={document_id} renovacao=ERRO "
            f"{type(e).__name__}: {str(e)[:140]} -> fallback RAG"
        )
        return None


async def check_expired_uris() -> dict:
    """
    Varredura periódica (BS-019): renova proativamente URIs perto de expirar.

    Conservadora de propósito:
      • só docs com `gemini_file_uri` setada e a < `proactive_hours` do limite;
      • teto de docs por execução (protege a cota/storage do Gemini Files API);
      • pula docs cujo PDF não está mais em disco (host efêmero, ex. Railway),
        deixando-os para o fallback RAG — sem poluir com erros.
    Retorna um resumo para auditoria/observabilidade.
    """
    proativo = settings.gemini_uri_proactive_hours
    teto = settings.gemini_uri_sweep_max_docs

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT id, file_path, original_name
            FROM documents
            WHERE gemini_file_uri IS NOT NULL
              AND gemini_file_expires_at IS NOT NULL
              AND gemini_file_expires_at < NOW() + make_interval(hours => %s)
            ORDER BY gemini_file_expires_at ASC
            LIMIT %s
            """,
            (proativo, teto),
        )
        candidatos = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    renovados = ausentes = erros = 0
    for doc_id, file_path, original_name in candidatos:
        if not file_path or not os.path.exists(file_path):
            ausentes += 1
            logger.warning(f"[BS-019][SWEEP] doc={doc_id} pdf_ausente -> mantém p/ fallback RAG")
            continue
        c = get_connection()
        cur = c.cursor()
        try:
            up = await gemini_file_service.upload(file_path, original_name or "document.pdf")
            cur.execute(
                "UPDATE documents SET gemini_file_uri = %s, gemini_file_expires_at = %s, "
                "updated_at = NOW() WHERE id = %s",
                (up.uri, up.expires_at, doc_id),
            )
            c.commit()
            renovados += 1
            logger.info(
                f"[BS-019][SWEEP][AUDIT] doc={doc_id} renovacao=OK expira_em={up.expires_at.isoformat()}"
            )
        except Exception as e:
            erros += 1
            logger.warning(f"[BS-019][SWEEP] doc={doc_id} erro {type(e).__name__}: {str(e)[:120]}")
        finally:
            cur.close()
            c.close()

    resumo = {
        "candidatos": len(candidatos),
        "renovados": renovados,
        "pdf_ausente": ausentes,
        "erros": erros,
    }
    logger.info(f"[BS-019][SWEEP] resumo={resumo}")
    return resumo


# Códigos HTTP que valem nova tentativa no MESMO provedor (instabilidade breve).
# 429 (cota/limite) NÃO entra: é melhor cair rápido para o próximo provedor
# do que esperar — a cadeia de fallback resolve.
_CODIGOS_RETRY = {500, 503}
_MAX_TENTATIVAS = 3


def _espera_backoff(tentativa: int) -> None:
    """Backoff exponencial (1s, 2s, 4s…) com jitter, limitado a ~8s."""
    time.sleep(min(2 ** (tentativa - 1), 8) + random.uniform(0, 0.5))


# ─────────────────────────────────────────────── Gemini (SDK nativo)
def _gerar_conteudo(contents):
    """
    Chama o Gemini com retry e backoff em erros transitórios (503/429/500).
    Aceita texto (str) ou Parts multimodais (PDF). Demais erros sobem na hora.
    """
    for tentativa in range(1, _MAX_TENTATIVAS + 1):
        try:
            return client.models.generate_content(
                model=settings.generation_model, contents=contents
            )
        except genai_errors.APIError as e:
            codigo = getattr(e, "code", None)
            if codigo not in _CODIGOS_RETRY or tentativa == _MAX_TENTATIVAS:
                raise
            logger.warning(
                f"Gemini retornou {codigo} (tentativa {tentativa}/{_MAX_TENTATIVAS}); "
                f"tentando novamente após backoff."
            )
            _espera_backoff(tentativa)


def _gemini_texto(prompt: str) -> str:
    """Gemini como provedor de TEXTO (1º da cadeia de fallback)."""
    return (_gerar_conteudo(prompt).text or "").strip()


# ──────────────────────────────────── provedores compatíveis com OpenAI
def _chat_openai(base_url: str, api_key: str, model: str, prompt: str) -> str:
    """
    Chamada genérica a um endpoint /chat/completions (Groq, Cerebras,
    OpenRouter, Mistral — todos compatíveis com a API da OpenAI), com retry.
    """
    url = f"{base_url.rstrip('/')}/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.6,
        # Teto alto de saída: quizzes/slides geram JSON longo (~5k tokens);
        # sem isso o provedor trunca a resposta e o JSON fica inválido.
        "max_tokens": 8192,
    }
    for tentativa in range(1, _MAX_TENTATIVAS + 1):
        resp = httpx.post(url, headers=headers, json=payload, timeout=90.0)
        if resp.status_code in _CODIGOS_RETRY and tentativa < _MAX_TENTATIVAS:
            _espera_backoff(tentativa)
            continue
        resp.raise_for_status()
        return (resp.json()["choices"][0]["message"]["content"] or "").strip()
    resp.raise_for_status()  # esgotou retries em erro transitório
    return ""


def _provedores_texto() -> list[tuple[str, callable]]:
    """
    Monta a ordem de tentativa de geração de TEXTO. O Gemini é sempre o 1º;
    cada provedor extra só entra se a respectiva API key estiver configurada.
    """
    provedores: list[tuple[str, callable]] = [("Gemini", _gemini_texto)]
    extras = [
        ("Groq",       settings.groq_api_key,       settings.groq_base_url,       settings.groq_model),
        ("Cerebras",   settings.cerebras_api_key,   settings.cerebras_base_url,   settings.cerebras_model),
        ("OpenRouter", settings.openrouter_api_key, settings.openrouter_base_url, settings.openrouter_model),
        ("Mistral",    settings.mistral_api_key,    settings.mistral_base_url,    settings.mistral_model),
    ]
    for nome, key, base, model in extras:
        if key:
            provedores.append((nome, _fazer_chamador(base, key, model)))

    # Provedor forçado (teste/diagnóstico): usa só ele, se disponível
    forcado = settings.ai_force_provider
    if forcado:
        filtrados = [p for p in provedores if p[0].lower() == forcado.lower()]
        if filtrados:
            logger.info(f"[TESTE] Provedor forçado ativo: {filtrados[0][0]}")
            return filtrados
        logger.warning(f"[TESTE] Provedor forçado '{forcado}' indisponível; usando a cadeia normal.")

    return provedores


def _fazer_chamador(base: str, key: str, model: str):
    """Fábrica de closure (evita late-binding no loop de provedores)."""
    return lambda prompt: _chat_openai(base, key, model, prompt)


def _gerar_json(prompt: str) -> dict:
    """
    Tenta os provedores em ordem e retorna o 1º que devolver um JSON VÁLIDO.
    O parsing acontece DENTRO do loop: se um provedor truncar ou enviar JSON
    inválido, cai para o próximo (em vez de estourar 500). Robustez para a demo.
    """
    erros = []
    for nome, fn in _provedores_texto():
        try:
            texto = fn(prompt)
            if not texto:
                erros.append(f"{nome}: resposta vazia")
                continue
            dados = _parse_json(texto)  # valida o JSON ainda dentro do loop
            if nome != "Gemini":
                logger.info(f"Geração concluída via provedor de fallback: {nome}")
            return dados
        except Exception as e:
            logger.warning(f"Provedor {nome} falhou ({type(e).__name__}): {str(e)[:140]}")
            erros.append(f"{nome}: {e}")
    raise RuntimeError("Todos os provedores de IA falharam — " + " | ".join(erros))


# ─────────────────────────────────────────────────── geração de conteúdo
def _generate_with_file(file_uri: str, prompt: str) -> dict:
    """Gera passando o PDF inteiro ao Gemini (caminho rápido, sem chunking)."""
    contents = gemini_file_service.build_content_parts(file_uri, prompt)
    response = _gerar_conteudo(contents)
    return _parse_json(response.text)


def _generate_with_rag(chunks: list[dict], prompt_template: str) -> dict:
    """Usa o contexto RAG e a cadeia de provedores (Gemini → Groq → …)."""
    context = _build_context(chunks)
    full_prompt = prompt_template.replace("{CONTEXT}", context)
    return _gerar_json(full_prompt)


class RAGService:
    def __init__(self):
        self.model = settings.generation_model

    # ──────────────────────────────────────────────────── pipeline
    async def process_document(
        self, file_path: str, filename: str, document_id: int, user_id: int
    ) -> dict:
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
                up = await gemini_file_service.upload(file_path, filename)
                cursor.execute(
                    "UPDATE documents SET gemini_file_uri=%s, gemini_file_expires_at=%s, "
                    "progress_percent=30 WHERE id=%s",
                    (up.uri, up.expires_at, document_id),
                )
                conn.commit()
                logger.info(
                    f"[Phase 1] Gemini file_uri salvo: {up.uri} (expira {up.expires_at.isoformat()})"
                )
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

            await self._notify_document_completed(user_id, document_id, filename)

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

    async def _notify_document_completed(
        self, user_id: int, document_id: int, filename: str
    ) -> None:
        """
        D-04: avisa o Laravel (POST /api/internal/notifications) que o
        documento terminou de processar, pra criar a notificação in-app do
        usuário. Chamada interna simples (chave compartilhada), best-effort —
        uma falha aqui nunca deve derrubar o pipeline de processamento.
        """
        if not settings.laravel_internal_api_key:
            logger.warning(
                "LARAVEL_INTERNAL_API_KEY não configurada — notificação de "
                f"conclusão do documento {document_id} não foi enviada."
            )
            return

        try:
            async with httpx.AsyncClient(timeout=5.0, verify=False) as client:
                resposta = await client.post(
                    f"{settings.laravel_api_url}/api/internal/notifications",
                    headers={"X-Internal-Key": settings.laravel_internal_api_key},
                    json={
                        "user_id": user_id,
                        "type": "document_completed",
                        "title": "Documento processado",
                        "body": f'Seu PDF "{filename}" terminou de processar e já está pronto para uso.',
                        "data": {"document_id": document_id},
                    },
                )
            if resposta.status_code >= 400:
                logger.warning(
                    f"Laravel recusou a notificação do documento {document_id}: "
                    f"{resposta.status_code} {resposta.text[:200]}"
                )
            else:
                logger.info(
                    f"Notificação de conclusão enviada ao Laravel "
                    f"(documento {document_id}, usuário {user_id})"
                )
        except httpx.RequestError as exc:
            logger.warning(f"Falha ao notificar o Laravel (documento {document_id}): {exc}")

    # ──────────────────────────────────────────────────────── quiz
    def generate_quiz(self, document_id: int, num_questions: int = None) -> dict:
        n = num_questions or settings.default_quiz_questions
        # Distribuição por Taxonomia de Bloom (ordem cognitiva): 30% baixa / 50% média / 20% alta
        bloom_baixa = max(1, round(n * 0.30))
        bloom_media = max(1, round(n * 0.50))
        bloom_alta = max(1, n - bloom_baixa - bloom_media)

        prompt = f"""Você é um professor especialista criando uma avaliação pedagógica de alto nível em português brasileiro, fundamentada na TAXONOMIA DE BLOOM.

TAREFA: Crie exatamente {n} questões.

DISTRIBUIÇÃO POR NÍVEL DE BLOOM (campo bloom_level):
- {bloom_baixa} de ORDEM BAIXA — "lembrar" ou "entender"
- {bloom_media} de ORDEM MÉDIA — "aplicar" ou "analisar"
- {bloom_alta} de ORDEM ALTA — "avaliar" ou "criar"

VARIEDADE DE TIPOS (campo type) — use TODOS, com pelo menos 2-3 de cada tipo não-múltipla:
- "multiple_choice" (maioria): 4 alternativas únicas, 1 correta, sem "todas/nenhuma das anteriores".
- "true_false": options = ["Verdadeiro","Falso"]; a explanation DEVE justificar a resposta.
- "fill_blank": a pergunta traz uma lacuna "_____"; options = 4 candidatos; correct_answer = a palavra/expressão correta.
- "ordering": options = itens fora de ordem; correct_answer = a sequência correta unida por " > " (ex.: "Item A > Item C > Item B").

REGRAS:
1. correct_answer DEVE ser exatamente um item de options (em "ordering", a ordenação correta desses itens).
2. Avalie COMPREENSÃO e raciocínio — NÃO crie questões que dependam de decorar datas, nomes próprios ou números isolados.
3. Cada questão aborda um tópico diferente (campo topic).
4. hint: dica curta que orienta sem entregar a resposta.
5. source_chunk: trecho curto do CONTEÚDO que fundamenta a questão.
6. explanation: 2-3 frases pedagógicas. Não repita perguntas semelhantes.

Retorne APENAS JSON válido:
{{
  "title": "título descritivo do quiz",
  "questions": [
    {{
      "question": "texto da pergunta (use _____ em fill_blank)",
      "type": "multiple_choice",
      "options": ["A) opção 1", "B) opção 2", "C) opção 3", "D) opção 4"],
      "correct_answer": "A) opção 1",
      "explanation": "explicação pedagógica detalhada",
      "difficulty": "easy",
      "bloom_level": "entender",
      "topic": "nome do tópico",
      "hint": "dica curta",
      "source_chunk": "trecho do documento que embasa a questão"
    }}
  ]
}}"""

        file_uri = _get_gemini_file_uri(document_id)
        result = None
        if file_uri:
            logger.info(f"Quiz via Gemini Files API: doc={document_id}")
            try:
                result = _generate_with_file(file_uri, prompt)
            except Exception as e:
                logger.warning(f"Gemini (PDF direto) falhou ({e}); usando RAG + fallback")
        if result is None:
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

        # BS-018: valida que correct_answer está entre as options (exceto 'ordering')
        for q in result.get("questions", []):
            if q.get("type") != "ordering" and q.get("correct_answer") not in (q.get("options") or []):
                logger.warning(f"Quiz: correct_answer fora de options — '{str(q.get('question',''))[:50]}'")

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
        result = None
        if file_uri:
            try:
                result = _generate_with_file(file_uri, prompt)
            except Exception as e:
                logger.warning(f"Gemini (PDF direto) falhou ({e}); usando RAG + fallback")
        if result is None:
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
        prompt = f"""Você é um DESIGNER INSTRUCIONAL SÊNIOR e especialista em aprendizagem ativa.
Sua missão: criar apresentações educacionais de NÍVEL OURO que transformam conteúdo em experiência de aprendizagem.

═══════════════════════════════════════════════════════════
PADRÃO OURO PEDAGÓGICO — REGRAS OBRIGATÓRIAS
═══════════════════════════════════════════════════════════

ESTRUTURA OBRIGATÓRIA ({n} slides):
  1 × CAPA          (layout: "cover")
  1 × OBJETIVOS     (layout: "objectives") — 4-6 objetivos nos níveis de Bloom: lembrar→criar
  2-3 × DIVISOR     (layout: "section_divider") — separa grandes blocos temáticos
  N × CONTEÚDO      (layouts variados: "content_bullets", "two_column", "quote_highlight",
                     "stats_numbers", "timeline") — UM conceito por slide, REGRA 6×6
  1 × VERIFICAÇÃO   (layout: "assessment") — 3-5 questões de reflexão ativas/provocativas
  1 × PARA SABER +  (layout: "content_bullets", title: "Para Saber Mais") — fontes e próximos passos
  1 × SÍNTESE       (layout: "summary") — os 5-7 pontos mais importantes
  1 × ENCERRAMENTO  (layout: "closing")

REGRA 6×6 (OBRIGATÓRIA para content_bullets, two_column, summary):
  • Máximo 6 itens por slide
  • Máximo 6 palavras por item (fragmentos, não frases completas)
  • Exceção: quote_highlight pode ter 1 citação longa

TÍTULOS ATIVOS E PROVOCATIVOS (OBRIGATÓRIO):
  ✓ "Por que 70% dos projetos falham?" (pergunta retórica)
  ✓ "O erro que todos cometem em X" (tensão cognitiva)
  ✓ "3 princípios que mudam tudo" (número + impacto)
  ✗ "Introdução ao Tema" — PROIBIDO (genérico demais)
  ✗ "Conceitos Básicos" — PROIBIDO (genérico demais)

SPEAKER NOTES (OBRIGATÓRIO — mínimo 3 frases por slide):
  Frase 1: gancho ou contexto para o apresentador iniciar o slide.
  Frase 2: aprofundamento, dado concreto ou exemplo que não está no slide.
  Frase 3: pergunta para engajar a audiência ou transição para o próximo slide.

VISUAL_SUGGESTION (OBRIGATÓRIO em cada slide):
  Descreva com precisão: tipo de imagem, composição, paleta de cores, emoção transmitida.
  Exemplo: "Infográfico circular mostrando ciclo de feedback com 4 etapas em azul e laranja,
            fundo branco clean, estilo flat design — transmite processo contínuo e clareza"

ACCENT_COLOR — variar para criar ritmo visual (máximo 40% da mesma cor):
  "blue" = informativo/padrão | "orange" = urgência/impacto | "green" = positivo/conclusão | "purple" = reflexão/criatividade

CAMPO estimated_time_minutes por slide:
  cover/closing/section_divider: 0.5 | conteúdo simples: 1.5 | conteúdo rico/debate: 2-3

═══════════════════════════════════════════════════════════

Retorne APENAS JSON válido (sem markdown, sem texto extra):
{{
  "title": "Título Completo e Descritivo da Apresentação",
  "estimated_time_minutes": {n * 2},
  "slides": [
    {{
      "title": "Título Ativo e Provocativo",
      "layout": "cover",
      "content": ["subtítulo ou contexto em até 10 palavras"],
      "notes": "Frase de abertura para o apresentador. Dado ou contexto adicional relevante. Pergunta de engajamento ou transição.",
      "visual_suggestion": "Descrição detalhada da imagem ideal: tipo, composição, cores, emoção",
      "accent_color": "blue",
      "estimated_time_minutes": 0.5
    }}
  ]
}}"""

        file_uri = _get_gemini_file_uri(document_id)
        result = None
        if file_uri:
            try:
                result = _generate_with_file(file_uri, prompt)
            except Exception as e:
                logger.warning(f"Gemini (PDF direto) falhou ({e}); usando RAG + fallback")
        if result is None:
            chunks = embed_service.search_similar_chunks(
                query="estrutura, tópicos principais, argumentos, evidências, dados, conclusões, exemplos",
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
        result = None
        if file_uri:
            try:
                result = _generate_with_file(file_uri, prompt)
            except Exception as e:
                logger.warning(f"Gemini (PDF direto) falhou ({e}); usando RAG + fallback")
        if result is None:
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
        result = None
        if file_uri:
            try:
                result = _generate_with_file(file_uri, prompt)
            except Exception as e:
                logger.warning(f"Gemini (PDF direto) falhou ({e}); usando RAG + fallback")
        if result is None:
            chunks = embed_service.search_similar_chunks(
                query="definições, conceitos-chave, terminologia, fatos, processos",
                document_id=document_id,
                limit=15,
            )
            result = _generate_with_rag(chunks, f"CONTEÚDO:\n{{CONTEXT}}\n\n{prompt}")

        result["document_id"] = document_id
        result["total_cards"] = len(result.get("cards", []))
        return result

    # ──────────────────────────────────────────────────────── delete (BS-005)
    async def delete_document(self, document_id: int) -> dict:
        """
        Recupera metadados do documento e remove o arquivo do Gemini Files API.

        Esta camada é responsável apenas por recursos externos (Gemini).
        A deleção do banco (com CASCADE em chunks e generations) e do disco
        fica no router para manter o controle transacional.

        Retorna os metadados para uso no log de auditoria.
        """
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                """
                SELECT original_name, file_path, gemini_file_uri, file_size, user_id
                FROM documents WHERE id = %s
                """,
                (document_id,),
            )
            row = cursor.fetchone()
            if not row:
                return {}

            original_name, file_path, gemini_file_uri, file_size, user_id = row

            # Remove do Gemini Files API se URI ainda registrada
            # best-effort: arquivos expiram em 48h de qualquer forma
            if gemini_file_uri:
                logger.info(
                    "[DELETE] Removendo arquivo do Gemini Files API: %s (doc=%d)",
                    gemini_file_uri, document_id,
                )
                await gemini_file_service.delete(gemini_file_uri)

            return {
                "original_name": original_name,
                "file_path": file_path,
                "gemini_file_uri": gemini_file_uri,
                "file_size": file_size or 0,
                "user_id": user_id,
            }
        finally:
            cursor.close()
            conn.close()

    # ──────────────────────────────────────────────────────── pcd
    def generate_pcd_content(self, document_id: int) -> dict:
        prompt = """Você é especialista em ACESSIBILIDADE educacional. Crie material PCD em português brasileiro em CONFORMIDADE com as diretrizes WCAG 2.1 nível AA.

REGRAS DE LINGUAGEM (obrigatórias, WCAG 3.1):
- Nível de leitura 5ª série (índice Flesch ~60-70).
- Frases com NO MÁXIMO 15 palavras, na estrutura SVO (Sujeito-Verbo-Objeto), voz ativa.
- Evite jargão; toda palavra incomum deve estar no vocabulário.
- AUTOVERIFIQUE antes de responder: releia cada frase do simplified_text e do screen_reader_text; se alguma passar de 15 palavras, REESCREVA dividindo em frases menores.

FORMATOS:
1. TEXTO SIMPLIFICADO: 8-10 parágrafos seguindo as regras acima.
2. SCREEN_READER_TEXT: versão em texto puro (sem marcações/símbolos) otimizada para leitores de tela.
3. ROTEIRO DE ÁUDIO: tom conversacional com [PAUSA CURTA]/[PAUSA LONGA] e [IMAGEM: descrição].
4. ALTERNATIVAS VISUAIS: 5-8 descrições de imagens/gráficos.
5. DESCRIÇÕES DE IMAGENS (alt text rico, WCAG 1.1.1): 4-6 itens {context, description}.
6. VOCABULÁRIO-CHAVE: 20-25 termos, cada um com definição acessível E um exemplo de uso.
7. AUXÍLIOS DE LEITURA (reading_aids): 4-6 dicas práticas (ex.: "leia em partes", "use o áudio").
8. RECURSOS DE ACESSIBILIDADE (accessibility_features): liste o que foi aplicado (ex.: "frases ≤15 palavras", "voz ativa", "vocabulário definido").
9. MAPA COGNITIVO (cognitive_map): hierarquia pai-filho do conteúdo (concept + children) p/ acessibilidade cognitiva.
10. SUGESTÕES LIBRAS: 5-7 momentos de maior impacto.

Retorne APENAS JSON válido:
{
  "title": "título claro",
  "simplified_text": "texto simplificado (frases ≤15 palavras)...",
  "screen_reader_text": "texto puro para leitores de tela...",
  "audio_script": "roteiro com [PAUSA CURTA]...",
  "visual_alternatives": ["descrição 1"],
  "image_descriptions": [{"context": "qual imagem/seção", "description": "descrição rica (alt text)"}],
  "key_vocabulary": [{"term": "termo", "definition": "definição acessível", "example": "frase de exemplo usando o termo"}],
  "reading_aids": ["dica de leitura 1"],
  "accessibility_features": ["frases ≤15 palavras", "voz ativa"],
  "cognitive_map": {"concept": "tema central", "children": [{"concept": "subtema", "children": []}]},
  "wcag_metadata": {"reading_level": "Fundamental II (5ª série)", "estimated_duration": "8 minutos", "complexity_score": 0.4, "wcag_level": "AA", "applicable_guidelines": ["1.1.1 Conteúdo não textual", "1.4.8 Apresentação visual", "3.1.3 Palavras incomuns", "3.1.5 Nível de leitura"]},
  "libras_suggestions": ["sugestão específica"]
}"""

        file_uri = _get_gemini_file_uri(document_id)
        result = None
        if file_uri:
            try:
                result = _generate_with_file(file_uri, prompt)
            except Exception as e:
                logger.warning(f"Gemini (PDF direto) falhou ({e}); usando RAG + fallback")
        if result is None:
            chunks = embed_service.search_similar_chunks(
                query="conteúdo principal, ideias centrais, informações essenciais",
                document_id=document_id,
                limit=20,
            )
            result = _generate_with_rag(chunks, f"CONTEÚDO:\n{{CONTEXT}}\n\n{prompt}")

        # BS-015: vídeos LIBRAS dos pontos-chave (título, vocabulário, momentos)
        result["libras_videos"] = libras_service.build_videos_from_pcd(result)
        result["document_id"] = document_id
        return result


rag_service = RAGService()
