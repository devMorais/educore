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
Turmas (`/turmas`), Chat interno (`/admin/chat` — decisão: descontinuar, não terminar), Fórum (`/admin/forum`), Recuperar senha (`/esqueci-senha`), Editar perfil (avatar/nome). Ver `D-01`, `D-03`, `D-05`, `D-06` no backlog.

### Já corrigido nesta sessão (04/07/2026)
- ✅ D-13: `AI_SERVICE_URL` movido pra `config/services.php` (antes quebrava com `config:cache`).
- ✅ `DEBUG=False` setado no Railway (antes `/docs`/`/redoc` do ai-service ficavam públicos).
- ✅ 794 arquivos mortos removidos (imagens de template, gerador Node.js morto do PPTX, `nixpacks.toml`, dependências não usadas).
- ✅ 7 branches remotas obsoletas da Claudia apagadas (eram vazias ou já superadas).

### D-04 — Notificações in-app (20/07/2026) — CONCLUÍDA, saiu da lista de fachada
- ✅ Tabela própria `notifications` (`user_id`, `type`, `title`, `body`, `data` JSON, `read_at`) — **não** é o sistema nativo do Laravel (`Notifiable::notifications()`, usado hoje só pelo canal `mail`), é um domínio próprio (`App\Models\Notification` + `App\Services\NotificationService::send()`).
- ✅ 4 rotas em `routes/api.php` (`GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all`), autenticadas, isoladas por `user_id`. Listagem é paginada internamente (`paginate()`), mas devolve array plano — o sino do header espera `NotificationItem[]`, não o envelope padrão do paginator.
- ✅ **Novo padrão: chamada interna serviço-a-serviço (ai-service → Laravel).** Endpoint genérico `POST /api/internal/notifications`, protegido por header `X-Internal-Key` comparado (via `hash_equals`) contra `config('services.internal.api_key')` (env `INTERNAL_API_KEY`) — middleware `App\Http\Middleware\VerifyInternalApiKey`, alias `internal-key` em `bootstrap/app.php`. **Precisa do MESMO valor** no `ai-service/.env` (`LARAVEL_INTERNAL_API_KEY`, `app/core/config.py`). O ai-service monta o texto da notificação (título/corpo em pt-BR) e manda pronto — o Laravel não conhece o domínio de "documentos" (mantém a separação da seção 2). Ponto de disparo real: `RAGService._notify_document_completed()` em `rag_service.py`, chamado ao fim de `process_document()` (fire-and-forget, nunca derruba o pipeline se o Laravel estiver fora do ar).
- ✅ Badge do sino (polling 30s) e marcar como lida (individual/todas) já consumiam essas rotas — só faltava o backend existir.
- 🐛 **Achado durante o teste manual, corrigido junto:** o `<app-notification-bell>` só estava plugado no `<app-navbar>` (header público, `app.html`), que é ocultado em `/painel`, `/admin`, `/login`, `/cadastro`, `/esqueci-senha` (`ROTAS_SEM_CHROME_PUBLICO` em `app.ts`). Ou seja, o sino nunca aparecia pro usuário logado de verdade. Adicionado também no header do `/painel` (`panel.ts`/`panel.html`). Se alguma outra área autenticada com layout próprio precisar do sino, adicionar lá manualmente também — não está centralizado.
- 🐛 **Bug de CORS achado e corrigido (afetava mais que notificações):** `ApiService` (`core/services/api.service.ts`) mandava `withCredentials: true` em toda chamada (get/post/patch). O CORS do Laravel responde `Access-Control-Allow-Origin: *` (curinga) — e a spec de CORS **proíbe** curinga em requisições com `credentials: include`, então o navegador bloqueava a resposta antes do JS conseguir ler (erro só aparece no console/Network, não em texto de erro amigável). `auth.service.ts` nunca teve esse problema por já não usar `withCredentials`. Removido de `ApiService` — o EduCore usa Bearer token, nunca cookie, então a flag não tinha função nenhuma. **Isso também destravou o dashboard admin** (único outro consumidor de `ApiService`), que provavelmente estava com o mesmo bug silencioso sem ninguém ter notado.
- ⚠️ **Dívida técnica notada, não corrigida (fora do escopo do D-04):** boa parte dos `*.spec.ts` do frontend (ex: `Chat`, `Dashboard`) usa o boilerplate padrão do `ng generate` sem `provideHttpClient()` no `TestBed` — qualquer serviço que injete `HttpClient` (direto ou via outro serviço) quebra com `NG0201`. `npx ng test` roda com ~24 falhas desse tipo hoje, pré-existentes.

### Ainda não corrigido (não assuma que já existe)
Billing/quota (100% inexistente, mapeado em `MULTITENANT-BILLING.md`), LGPD (termos/privacidade/exclusão de conta), storage de PDF ainda em disco local efêmero no Railway (some a cada redeploy), ai-service roda com 1 worker só (concorrência trava com 2+ usuários gerando ao mesmo tempo).

## 6. Armadilhas já conhecidas (não repetir)

- **Nunca `env()` fora de `config/*.php`** — quebra silenciosamente depois de `php artisan config:cache` (já causou bug real em produção duas vezes: `AI_SERVICE_URL` e o mesmo padrão pode existir em outros lugares não auditados ainda).
- **Não confiar em "Concluída" no Avante sem checar o código** (seção 5).
- **`ai-service` — nunca assumir que uma dependência não é usada só por não achar `import` no `.py`** — `@angular/material` no frontend só aparecia usado via `@use` no `.scss`, não em `.ts`. Sempre `grep` amplo (código + estilos + templates) antes de remover algo como morto.
- **Google Slides e fallback de IA (Groq/Cerebras/Mistral) já estão implementados** no `rag_service.py`, mesmo que o ticket original pedisse um arquivo separado (`llm_router.py`) — a implementação real ficou embutida, é intencional, não recriar duplicado.
- **Nunca usar `withCredentials: true` em chamadas HTTP pro Laravel** — o CORS responde `Access-Control-Allow-Origin: *`, e a spec proíbe curinga com `credentials: include`; o navegador bloqueia a resposta (erro só aparece no console, silencioso pro usuário). O EduCore usa Bearer token, nunca cookie — não há motivo pra essa flag existir. Já causou bug real em produção (D-04): `ApiService` tinha isso e as notificações in-app nunca funcionavam no navegador, apesar do backend responder 200 certinho via curl.
- **Componentes de layout (sino, etc.) não são globais** — `/painel`, `/admin` e as telas de auth usam layout próprio, sem o `<app-navbar>` público (ver `ROTAS_SEM_CHROME_PUBLICO` em `app.ts`). Um componente "já existir" no navbar não significa que aparece pro usuário logado — sempre conferir em qual layout a tela que importa de verdade está.

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
