# EduCore AI Service — API

Microserviço de IA que transforma **PDFs** em material educacional usando o
**Gemini 2.5-Flash** com pipeline **RAG** (chunking + embeddings + pgvector) e
uma cadeia de provedores de fallback (Groq → Cerebras → OpenRouter → Mistral).

## O que dá pra fazer

- **Upload** de um PDF (processamento assíncrono em 2 fases: Gemini Files API + RAG).
- **Gerar** 6 tipos de conteúdo a partir do documento:
  `quiz` · `summary` (resumo) · `slides` · `mindmap` (mapa mental) ·
  `flashcards` · `pcd` (conteúdo acessível, WCAG 2.1 AA).
- **Exportar** para PowerPoint (PPTX), HTML (Reveal.js), Kahoot, Socrative e SCORM.
- **Áudio (TTS)** do conteúdo acessível e **vídeos LIBRAS** (acessibilidade).

## Autenticação

Todos os endpoints (exceto `/health`) exigem um **Bearer token** do Laravel
Sanctum no header `Authorization`. O token é verificado contra
`GET /api/auth/verify` do Laravel (com cache de 60s).

```
Authorization: Bearer <seu_token_sanctum>
```

No Swagger UI, clique em **Authorize** 🔒 e cole o token.

## Erros padronizados

| Código | Quando acontece |
|-------:|-----------------|
| **401** | Token ausente, inválido ou expirado |
| **403** | Autenticado, mas sem permissão sobre o recurso (ou rota de admin sem role) |
| **404** | Documento/recurso não encontrado (ou não pertence ao usuário) |
| **422** | Corpo/parâmetros inválidos (erro de validação) |
| **429** | Limite de requisições excedido (rate limit) |

## Observações

- `/docs` (Swagger) e `/redoc` ficam disponíveis **apenas com `DEBUG=True`**.
  Em produção, defina `DEBUG=False` para ocultá-los.
- Rate limit global: **100 req/min por IP**; upload: **10/h por usuário**;
  geração: **30/min por usuário**.
