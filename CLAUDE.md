# EduCore — Contexto para IA

> Lido automaticamente pelo Claude Code no início de qualquer sessão neste repositório. Objetivo: qualquer IA (Claude, ChatGPT, Copilot) que pegar uma demanda do Avante deve conseguir trabalhar sem precisar re-explorar o projeto do zero.
> **Mantenha este arquivo atualizado.** Ao terminar qualquer demanda (`D-XX` do Avante) que mude arquitetura, convenção, endpoint novo ou infraestrutura, atualize a seção relevante aqui antes de abrir o PR. Se uma informação abaixo estiver desatualizada, corrija — não deixe o arquivo mentir.
> Última revisão: 20/07/2026.

---

## 1. O que é o EduCore

SaaS educacional: usuário sobe um PDF, a plataforma processa via RAG (Gemini) e gera quiz, resumo, apresentação de slides, mapa mental, flashcards e conteúdo adaptado (PCD). Ainda **não é comercial** — não existe billing/quota funcionando (ver seção 5).

## 2. Arquitetura — 3 serviços independentes

| Serviço | Stack | Local | Produção |
|---|---|---|---|
| `backend/` | Laravel 13.7, PHP 8.4, Sanctum (bearer token, **não** cookie), Google OAuth | `https://educore.test` (Herd) | Hostinger, `https://educore.devmorais.com.br` |
| `frontend/` | Angular 20.3, PrimeNG 20, Signals | `http://localhost:4200` | Servido estático (SPA) na mesma Hostinger, via `public/router.php` |
| `ai-service/` | Python 3.11, FastAPI, Gemini + fallback (Groq/Cerebras/Mistral/OpenRouter), pgvector/PostgreSQL | `http://localhost:8001` | Railway, `https://educore-production-49c3.up.railway.app` |

Banco: MySQL na Hostinger (identidade/admin/auditoria — só o Laravel usa) + PostgreSQL/pgvector no Supabase (documentos/embeddings/gerações — só o ai-service usa). **Os dois bancos nunca se misturam**: o Laravel não sabe de `documents`/`generations`, e o ai-service não sabe de `users` do MySQL — a ponte é sempre via HTTP (`GET /auth/verify` do Laravel é chamado e cacheado pelo ai-service).

## 3. Deploy — atenção, os dois lados são diferentes

- **ai-service (Railway):** auto-deploy a cada push na `main`. Builder é **Dockerfile** (confirmado no painel, `nixpacks.toml` foi removido por ser redundante). Não precisa de ação manual.
- **backend + frontend (Hostinger):** **NÃO tem auto-deploy.** Depois de mergear na `main`, é preciso rodar manualmente:
  ```bash
  # Frontend
  cd frontend && ng build --configuration=production
  scp -P 65002 -r "dist/web-plataforma/browser/." u846585591@147.93.39.159:/home/u846585591/domains/devmorais.com.br/public_html/educore/

  # Backend (via SSH, chave já configurada, BatchMode funciona)
  ssh -p 65002 u846585591@147.93.39.159
  cd ~/domains/devmorais.com.br/public_html/educore/backend
  git pull origin main && php artisan migrate --force && php artisan config:cache && php artisan route:cache && php artisan view:cache
  ```
  Detalhes completos (credenciais, troubleshooting) em `DEPLOY.private.md` (não versionado, só local).
- **CLI do Railway já está logado e linkado** neste ambiente (`railway whoami` / `railway variables` funcionam direto, projeto `rare-success`/`educore`).

## 4. Convenções do frontend (validadas, não reverter)

- Services em `core/services/*.service.ts` (sufixo `.service.ts` obrigatório).
- Tipos extraídos para `core/types/{domínio}/` com barrel `index.ts` — nunca inline no componente.
- Componentes compartilhados em `shared/components/{atoms,molecules}/{categoria}/`, sufixo `.molecule.ts` pra moleculares.
- **Zero `any` em todo o código de produção** — regra estrita, já confirmada 100% respeitada. `$any(...)` em templates é tolerado só como último recurso.
- Estado: Angular Signals + RxJS pra HTTP/SSE/polling. Sem NgRx.
- Padrão de erro: interceptor global (`core/interceptors/auth.interceptor.ts`) trata 401/422/429/500 via `ToastService` — **não duplicar toast no componente** (bug já corrigido uma vez, ver D-44).

## 5. Estado atual do projeto — não confie no board sem checar o código

Em 04/07/2026 uma auditoria completa (ver `ANALISE-TECNICA-PRODUCAO.md`) achou que **o board antigo do Avante estava com status errado**: várias tarefas "Concluída" eram fachada (frontend pronto, zero backend). Achado principal: **confie no código, não no status do board**, sempre confira rota real em `routes/api.php` / `@router.` do ai-service antes de assumir que algo existe.

**Backlog de execução oficial:** `DEMANDAS-EDUCORE-COMERCIAL.md` — 49 demandas (`D-01` a `D-49`), full-stack, autossuficientes, organizadas em 8 fases/sprints. Cada uma já tem: descrição em formato de prompt pronto pra IA, passo a passo de Git, critérios de aceite. **Esta é a fonte de verdade do que falta fazer** — o board Avante (quadro "Educore", `board_id=7` no banco `u846585591_gestao_tarefas`) foi recriado a partir dela.

### Features com frontend pronto mas SEM backend (fachada) — corrigir na Fase 1
Turmas (`/turmas`), Chat interno (`/admin/chat` — decisão: descontinuar, não terminar), Notificações in-app (sino do header), Recuperar senha (`/esqueci-senha`), Editar perfil (avatar/nome). Ver `D-01`, `D-02`, `D-03`, `D-04`, `D-06` no backlog.

### Já corrigido nesta sessão (04/07/2026)
- ✅ D-13: `AI_SERVICE_URL` movido pra `config/services.php` (antes quebrava com `config:cache`).
- ✅ `DEBUG=False` setado no Railway (antes `/docs`/`/redoc` do ai-service ficavam públicos).
- ✅ 794 arquivos mortos removidos (imagens de template, gerador Node.js morto do PPTX, `nixpacks.toml`, dependências não usadas).
- ✅ 7 branches remotas obsoletas da Claudia apagadas (eram vazias ou já superadas).

### D-05 — Fórum de discussão (20/07/2026) — CONCLUÍDA, saiu da lista de fachada
- ✅ `ForumTopic`/`ForumReply` (tabelas `forum_topics`/`forum_replies`, primeiro uso de `SoftDeletes` no projeto) + `ForumController` com as 6 rotas que o frontend já esperava (`GET/POST /forum/topics`, `DELETE /forum/topics/{id}`, `GET/POST /forum/topics/{id}/replies`, `DELETE /forum/topics/{id}/replies/{id}`), todas atrás de `auth:sanctum` (qualquer autenticado, não só admin — apesar da tela viver em `/admin/forum`).
- ✅ `replies_count`/`last_reply_at` em `forum_topics` são contadores DENORMALIZADOS mantidos manualmente no controller (`increment()`/`decrement()`), não computados via `withCount()` — é o que a migration pedia.
- ✅ Exclusão (soft delete) restrita a autor ou `role=admin`, mesma regra pra tópico e resposta (`ForumController::canModerate()`).
- ✅ Autor exposto como `user: {id, name, avatar, role}` via `->with('user:id,name,avatar,role')` — nunca email, mesmo padrão de outras listagens (`AdminController::auditLogs`).
- 🐛 **Mesmo bug de CORS do D-04/D-09, achado uma terceira vez:** `forum.service.ts` também tinha `withCredentials: true` em toda chamada — removido. Se aparecer em outro service novo, é o mesmo bug (ver seção 6), não copiar o padrão.

### Ainda não corrigido (não assuma que já existe)
Billing/quota (100% inexistente, mapeado em `MULTITENANT-BILLING.md`), LGPD (termos/privacidade/exclusão de conta), storage de PDF ainda em disco local efêmero no Railway (some a cada redeploy), ai-service roda com 1 worker só (concorrência trava com 2+ usuários gerando ao mesmo tempo).

## 6. Armadilhas já conhecidas (não repetir)

- **Nunca `env()` fora de `config/*.php`** — quebra silenciosamente depois de `php artisan config:cache` (já causou bug real em produção duas vezes: `AI_SERVICE_URL` e o mesmo padrão pode existir em outros lugares não auditados ainda).
- **Não confiar em "Concluída" no Avante sem checar o código** (seção 5).
- **`ai-service` — nunca assumir que uma dependência não é usada só por não achar `import` no `.py`** — `@angular/material` no frontend só aparecia usado via `@use` no `.scss`, não em `.ts`. Sempre `grep` amplo (código + estilos + templates) antes de remover algo como morto.
- **Google Slides e fallback de IA (Groq/Cerebras/Mistral) já estão implementados** no `rag_service.py`, mesmo que o ticket original pedisse um arquivo separado (`llm_router.py`) — a implementação real ficou embutida, é intencional, não recriar duplicado.

## 7. Documentos de referência (não duplicar conteúdo aqui)

| Arquivo | Conteúdo |
|---|---|
| `DEMANDAS-EDUCORE-COMERCIAL.md` | Backlog de execução — 49 demandas, fonte de verdade |
| `ROADMAP-COMERCIAL-EDUCORE.md` | Fases/sprints e achados da auditoria do board Avante |
| `ANALISE-TECNICA-PRODUCAO.md` | Auditoria técnica detalhada (segurança, LGPD, infra) |
| `MULTITENANT-BILLING.md` | Desenho técnico de billing (planos, quota, Asaas) |
| `PLANO-MARKETING-EDUCORE.md` / `PLANO-NEGOCIO.md` | Estratégia comercial e de marca |
| `SETUP.md` | Guia de ambiente local passo a passo |
| `DEPLOY.private.md` | Credenciais e troubleshooting de deploy (local, não versionado) |
| `sql-sprints/*.sql` | Scripts de atualização das descrições das demandas por sprint no Avante |
