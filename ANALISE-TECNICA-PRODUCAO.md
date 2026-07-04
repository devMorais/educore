# 🔍 EduCore — Análise Técnica Completa & Roteiro para Produção Comercial

> Auditoria sênior dos 3 serviços (Laravel/backend, Angular/frontend, FastAPI/ai-service) com foco em responder uma pergunta: **o que falta para cobrar de cliente real com segurança jurídica e técnica?**
> Complementa (não duplica) `MULTITENANT-BILLING.md` (billing técnico), `PLANO-MARKETING-EDUCORE.md` e `PLANO-NEGOCIO.md` (estratégia/vendas) — este documento cobre tudo que aqueles não cobrem: segurança, LGPD, confiabilidade, escala, testes e qualidade.
> Última atualização: 04/07/2026.

---

## Sumário executivo

O fluxo núcleo do produto **funciona de ponta a ponta e é bem construído**: login → upload de PDF → pipeline RAG → quiz/resumo/slides, com isolamento real entre usuários, rate limiting, cache, auditoria e uma suíte Cypress e2e (20 specs `bs-*`/`us-*`) que cobre inclusive casos de segurança (isolamento de dados, CSRF, refresh de token). A base arquitetural é sólida para o estágio atual.

Mas o sistema **não está pronto para cobrar de cliente real hoje**. Cinco blocos de risco precisam fechar antes do go-live comercial, em ordem de gravidade:

1. **LGPD/Compliance — maior risco jurídico.** Zero termos de uso, zero política de privacidade, zero consentimento no cadastro, zero exclusão/exportação de dados. Como o produto lida com dados de professores e potencialmente alunos menores de idade (feature "turmas"), isso não é um nice-to-have — é o que impede legalmente vender.
2. **Segurança administrativa quebrada.** "Bloquear usuário" no painel admin não bloqueia nada de fato (token continua válido, e o próprio usuário consegue se autodesbloquear via verificação de e-mail). Existe uma credencial de admin hardcoded num seeder.
3. **Armazenamento de arquivo efêmero.** Os PDFs do ai-service vivem em disco local no Railway — um ambiente que **não persiste disco entre deploys**. Todo PDF processado some no próximo redeploy.
4. **Gargalo de concorrência.** O ai-service roda com 1 worker e a maior parte das chamadas caras (Gemini, PPTX, TTS) é síncrona dentro do event loop assíncrono — dois usuários gerando conteúdo ao mesmo tempo já travam o serviço inteiro para todo mundo, incluindo o health check.
5. **Billing 100% inexistente** (confirmado nesta auditoria — já mapeado tecnicamente em `MULTITENANT-BILLING.md`, mas nenhuma linha de código existe ainda).

Além disso, o Angular instalado tem **7 vulnerabilidades classificadas como "high"** (bypass de sanitização = XSS), com correção disponível via patch — é o item de menor esforço e maior urgência da lista inteira.

O restante dos achados (observabilidade, testes automatizados fracos, performance de frontend, features incompletas expostas ao usuário) não impede o lançamento, mas deveria entrar logo na sequência — o risco cresce junto com a base de usuários pagantes.

---

## 1. Metodologia

Auditoria de código feita diretamente nos 3 serviços (`backend/`, `frontend/`, `ai-service/`), cruzando com os documentos de planejamento já existentes no repositório para não duplicar trabalho: `MULTITENANT-BILLING.md` já mapeia billing/multi-tenancy em detalhe (referenciado, não repetido aqui); `PLANO-MARKETING-EDUCORE.md` e `PLANO-NEGOCIO.md` (em `C:\Users\UITEC\Herd\`) já mapeiam estratégia comercial. Este documento cobre o que nenhum dos anteriores cobria: segurança, compliance, confiabilidade de infraestrutura, escala, qualidade de teste e dívida técnica.

---

## 2. Diagnóstico por camada

| Camada | Estado atual | Veredito |
|---|---|---|
| Fluxo core (login→upload→RAG→quiz/resumo/slides) | Funcional ponta a ponta, validado por Cypress e2e real | ✅ Pronto |
| Autenticação & isolamento multiusuário | Sanctum bearer + Google OAuth, `ownership_check` em todas as rotas do ai-service | ✅ Sólido (bugs pontuais, ver §3.1) |
| Segurança administrativa | "Bloquear usuário" não bloqueia de fato; CORS ausente no Laravel; seeder com senha hardcoded | 🔴 Bloqueador |
| LGPD / Compliance legal | Zero termos, zero privacidade, zero consentimento, zero exclusão/exportação de dados | 🔴 Bloqueador — maior risco jurídico |
| Armazenamento de arquivos (ai-service) | Disco local efêmero no Railway — PDFs somem a cada redeploy | 🔴 Bloqueador |
| Escala/concorrência (ai-service) | 1 worker; chamadas síncronas bloqueiam o event loop inteiro | 🔴 Bloqueador para uso simultâneo real |
| Billing / monetização | 100% inexistente (confirmado); sprints já mapeados em `MULTITENANT-BILLING.md` | 🔴 Bloqueador — greenfield |
| Dependências de segurança (frontend) | 7 vulnerabilidades "high" (XSS) no Angular instalado | 🔴 Bloqueador — fix rápido disponível |
| Observabilidade (nos 3 serviços) | Zero Sentry/APM; logs em arquivo/stdout sem estrutura, sem correlation ID | 🟡 Importante |
| Testes automatizados | Cypress e2e é forte; testes unitários Laravel/Angular/ai-service são fracos ou inexistentes | 🟡 Importante |
| Performance/SEO frontend | SSR presente no código mas desativado; bundle sem lazy loading; sem analytics | 🟡 Importante |
| UX/Produto | Painel admin real; 2 features incompletas ficam visíveis ao usuário (chat interno, "assistente de IA") | 🟡 Importante |
| Acessibilidade | LIBRAS bem implementado; resto raso (sem estratégia WCAG sistemática) | 🟢 Bom início |

---

## 3. Achados detalhados

### 3.1 Segurança

- 🔴 **Bloqueio de usuário é cosmético.** `AdminController::updateStatus` (`app/Http/Controllers/Api/AdminController.php:179-206`) só zera `email_verified_at`. Não revoga `personal_access_tokens` — o usuário "bloqueado" segue autenticado normalmente. Pior: ao clicar no link de verificação de e-mail, `AuthController::verifyEmail` (`:66-90`) reativa a conta sem checar se ela foi bloqueada por um admin — **o próprio usuário se autodesbloqueia**.
- 🔴 **CORS não existe no Laravel.** Não há `config/cors.php`. Funciona hoje só porque produção é same-origin; quebra em dev local cross-origin real e em qualquer integração futura (app mobile, split de domínio, terceiros).
- 🔴 **Sem "esqueci minha senha".** A tabela `password_reset_tokens` existe mas está órfã — nenhuma rota a usa. Quem se cadastrou com email/senha (não Google) fica sem caminho de recuperação.
- 🔴 **Credencial de admin hardcoded.** `database/seeders/AdminSeeder.php:17-25` cria `admin@educore.test` / `Admin@123!` em texto plano.
- 🟡 **Auto-promoção a admin sem gate.** Registro público promove a admin o primeiro usuário cadastrado (ou o primeiro sem admin existente) — sem allowlist/convite.
- 🟡 **Senha fraca permitida** (`min:8` apenas, sem exigir maiúscula/número/símbolo) e **sem lockout de conta** por tentativas falhas (só rate-limit por IP).
- 🟡 **Sem 2FA** em nenhum nível.
- 🔴 **[ai-service] Validação de arquivo só por extensão** (`.pdf` no nome), sem checar magic bytes (`%PDF-`) nem `content_type`.
- 🔴 **[ai-service] Rate limit não cobre `/html-view` e `/audio`** — endpoints `GET` que disparam geração real de IA (slides/TTS) quando não há cache, sem `@limiter.limit`, protegidos só pelo limite genérico de 100 req/min/IP.
- 🟡 **[ai-service] `DEBUG=True` por default** no `config.py` — se a env var não foi setada manualmente no Railway, `/docs`/`/redoc`/`/openapi.json` estão públicos em produção agora. **Precisa confirmar no painel do Railway com urgência.**
- 🟢 Pontos positivos confirmados: mass assignment protegido corretamente nos Models, CSRF correto para API bearer, OAuth Google com `state` anti-CSRF de uso único, CORS do ai-service corretamente restrito por `ALLOWED_ORIGINS` (lista fechada, não wildcard), nenhum segredo commitado no repositório (`.gitignore` cobre corretamente `.env`, `google-credentials.json`, `*.private.md`).

### 3.2 LGPD / Compliance legal

- 🔴 Nenhuma página de Termos de Uso ou Política de Privacidade — os links do rodapé (`footer.molecule.html`) apontam para `href="#"` (âncoras mortas).
- 🔴 Nenhum checkbox de aceite de termos no cadastro, sem timestamp de consentimento versionado no backend.
- 🔴 Nenhum banner de consentimento de cookies.
- 🔴 Nenhum endpoint de exportação de dados ou exclusão de conta ("direito ao esquecimento").
- ⚠️ **Agravante:** a feature "turmas" (`classes`) lida com matrícula de alunos — se houver menores de idade no fluxo (contexto escolar/professor), isso aciona também o ECA além da LGPD (art. 14, tratamento de dados de crianças/adolescentes exige consentimento específico de responsável). **Recomendação: validar com jurídico antes do lançamento** se o público incluir estudantes menores diretamente cadastrados (e não só documentos/materiais de aula).

### 3.3 Confiabilidade & Infraestrutura

- 🔴 **[ai-service] Storage de PDF é disco local efêmero.** `uploads/` no Railway não persiste entre deploys — o próprio código já reconhece isso em comentário (`config.py:96-112`, campos `pdf_storage_provider`/`s3_*`/`supabase_url` já existem mas nenhum provedor real está implementado, default `"local"`). Consequência: todo PDF processado some no próximo redeploy, quebrando permanentemente a renovação de URI do Gemini (BS-019) e qualquer necessidade de reprocessamento.
- 🔴 **[ai-service] Documento pode travar para sempre em "processing".** O pipeline roda via `BackgroundTasks` do FastAPI (in-process, sem fila/broker real). Se o processo cair no meio do processamento (crash, OOM, redeploy), o documento fica com `status='processing'` indefinidamente — não existe watchdog/sweep para detectar e marcar como `failed`.
- 🔴 **[ai-service] Escala: 1 worker, chamadas síncronas bloqueando o event loop.** `uvicorn` roda sem `--workers`; as chamadas mais caras (SDK do Gemini, geração de PPTX com `python-pptx`, TTS, `httpx` bloqueante pro Pexels) são funções síncronas chamadas direto dentro de handlers `async def`, sem `run_in_executor`/`asyncio.to_thread`. **Dois usuários gerando conteúdo ao mesmo tempo já travam o serviço inteiro**, inclusive o `/health` de outros usuários. Este é o maior bloqueador técnico de escala do sistema.
- 🟡 **[Laravel] `env()` fora de `config/` quebra com `config:cache`** (que roda em produção): `AdminController.php:243,261` e `HealthController.php:140` usam `env('AI_SERVICE_URL', ...)` direto — depois do cache, cai no fallback hardcoded `localhost:8001`.
- 🟡 **[Laravel] Cron do scheduler não confirmado na Hostinger.** Sem ele, a fila de auditoria (BS-022) nunca processa.
- 🟡 **[ai-service] Sem Alembic** — schema gerido por `CREATE TABLE IF NOT EXISTS` imperativo em todo boot (`init_db()`), sem versionamento; risco de corrida de DDL com múltiplas instâncias.
- 🟡 **[ai-service] Sem connection pooling** — nova conexão `psycopg2` a cada chamada (2-3 por request), pressiona o limite do Session Pooler do Supabase sob carga.

### 3.4 Custo e controle de gasto de IA

- 🔴 **[ai-service] `max_pages=300` nunca é aplicado** — só existe como comentário de intenção no `config.py`, sem nenhuma checagem real no pipeline. Só o tamanho do arquivo (100MB) é limitado.
- 🔴 **[ai-service] Sem timeout global** no pipeline de extração — um documento grande pode rodar por minutos/horas sem corte.
- 🔴 **[ai-service] Sem rastreio de custo por geração** — a tabela `generations` não guarda tokens/chamadas consumidas, impossibilitando reconciliar gasto real por usuário/plano (pré-requisito para billing saudável).
- 🟡 **Sem circuit breaker** entre chamadas de provedores — cada novo request tenta do zero mesmo se o provedor estiver fora por minutos.

### 3.5 Observabilidade

- 🔴 **Zero Sentry/APM em qualquer um dos 3 serviços.** Descobrir erro em produção depende de entrar via SSH/logs do Railway manualmente — sem alerta em tempo real.
- 🟡 Sem correlation/request ID propagado entre serviços (dificulta rastrear uma requisição Angular → Laravel → ai-service).
- 🟡 **[ai-service] Logging não estruturado** (texto plano via `logging.basicConfig`), difícil de indexar/alertar em escala.
- 🟡 **[ai-service] Mensagem de erro pode vazar detalhe interno** — exceções genéricas retornam `str(e)` cru pro cliente em vez de mensagem normalizada + log interno.

### 3.6 Testes automatizados

- 🟢 **Ponto forte real: Cypress e2e** — 20 specs (`bs-001` a `bs-010` de segurança, `us-001` a `us-010` de UX) cobrindo isolamento de dados, CORS, rate limit, refresh de token, CSRF de OAuth, upload/validação. Essa é a rede de segurança de fato do projeto.
- 🔴 **[Laravel] 4 arquivos de teste**, só `AuthTest.php` tem conteúdo real (8 testes). Zero cobertura para `AdminController` inteiro (roles/bloqueio/auditoria — justamente as operações administrativas sensíveis), `CheckRole`, `HealthController`, verificação de e-mail, OAuth, refresh de token.
- 🔴 **[Angular] 28 arquivos `.spec.ts`, todos boilerplate** (`expect(component).toBeTruthy()`) — nenhum testa lógica de negócio real (login, refresh, persistência de resultado, força de senha, SSE/polling).
- 🔴 **[ai-service] Zero testes automatizados** — nenhum `pytest`/`conftest.py` no projeto inteiro.

### 3.7 Qualidade de código & dependências

- 🔴 **[Frontend] `npm audit`: 7 vulnerabilidades "high" + 1 "moderate"** nos pacotes `@angular/*` instalados (20.3.21, faixa vulnerável 20.0.0-next.0–20.3.24) — bypass de sanitização (XSS), corrigível via patch (`npm audit fix`, upgrade ≥20.3.25). É o item de menor esforço/maior urgência de toda a auditoria.
- 🟡 **[Frontend] Sem lazy loading de rotas** — bundle inicial de 1.38MB carrega o painel admin inteiro (dashboard+users+chat+forum+charts) e os 6 tipos de resultado mesmo para um visitante anônimo na home.
- 🟡 **[Frontend] SSR presente no código mas desativado de fato** (`app.routes.server.ts` força `RenderMode.Client` em todas as rotas) — anula o ganho de SEO/TTFB de todo o setup de `@angular/ssr` já configurado. Deploy real também confirma isso: produção serve SPA estática via PHP/LiteSpeed, o servidor Express do Angular SSR não é usado.
- 🟡 **[Frontend] 18MB / 438 imagens mortas** em `public/images/` (sobras de template de LMS, zero referências no código) — vão pro build de produção sem uso.
- 🟡 **[Frontend] `@angular/material` e `@angular/cdk` nunca importados** — dependências mortas (o projeto usa PrimeNG).
- 🟡 **[Frontend] 100% Reactive Forms ausente** — formulários usam `ngModel` + regex duplicada em cada componente (login/register/forgot-password), sem `FormGroup`/`Validators` centralizados.
- 🟡 **[Frontend] Duplicação de toast de erro** — o interceptor HTTP global já mostra toast em 401/422/429/500, mas vários componentes (`panel.ts`, `chat.ts`, `forum.ts`) mostram outro toast pro mesmo erro.
- 🟡 **[ai-service] Dependências mortas:** `google-generativeai` (SDK legado, não importado em lugar nenhum — só `google-genai` é usado) e o gerador de PPTX em Node.js (`generate_pptx.js` + `node_modules`, substituído há tempo pelo `pptx_service.py` nativo, mas ainda no repo/build).
- 🟢 Sem `any` no código de produção Angular (regra do projeto respeitada), sem `TODO`/`FIXME` esquecido.

### 3.8 UX / Produto incompleto exposto ao usuário

- 🔴 **`admin/chat`**: o próprio código documenta em comentário que "o endpoint do backend ainda não existe" — feature de chat da equipe está no ar, mas não funciona de verdade.
- 🔴 **Botão "Assistente de IA" no painel** (`panel.ts`) só dispara um toast "Em breve" — funcionalidade prometida na UI que não existe.
- 🟡 Link "Preços" do menu/rodapé aponta para uma seção de estatísticas da home, não para uma página de planos real (consistente com billing inexistente, mas precisa sumir ou virar página real antes de vender assinatura).

---

## 4. Backlog priorizado — Backend (Laravel + AI-Service)

### 🔴 Crítico — bloqueia lançamento comercial

| ID | Serviço | Demanda |
|---|---|---|
| BE-01 | Laravel | Corrigir bloqueio de usuário: revogar `personal_access_tokens` ao setar status=blocked; impedir que `verifyEmail` reative conta bloqueada |
| BE-02 | Laravel | Implementar fluxo "esqueci minha senha" (rota + `Notification` de reset, reaproveitando `password_reset_tokens`) |
| BE-03 | Laravel | Criar `config/cors.php` com origins explícitas |
| BE-04 | Laravel | Remover/proteger `AdminSeeder` (credencial hardcoded) — nunca deve rodar em produção sem senha gerada |
| BE-05 | Laravel | Travar auto-promoção a admin do "primeiro usuário" atrás de allowlist/flag de ambiente |
| BE-06 | Laravel | Mover `AI_SERVICE_URL` para `config/services.php` (hoje quebra com `config:cache` em produção) |
| BE-07 | AI-Service | Migrar `uploads/` de disco local para storage persistente (S3/R2/Supabase Storage) — hoje some a cada redeploy no Railway |
| BE-08 | AI-Service | Watchdog para documentos travados em "processing" (timeout + marcar `failed` + opção de reprocessar) |
| BE-09 | AI-Service | Rodar com múltiplos workers e mover chamadas síncronas (Gemini SDK, python-pptx, TTS, `httpx` bloqueante) para thread pool — hoje 1 usuário gerando conteúdo trava o serviço inteiro |
| BE-10 | Laravel + AI-Service | LGPD: endpoint de exportação e exclusão de dados do usuário; campo de consentimento de termos com timestamp versionado no cadastro |
| BE-11 | AI-Service | Validação de arquivo por magic bytes (`%PDF-`), não só extensão |
| BE-12 | AI-Service | Rate limit em `/html-view` e `/audio` (hoje disparam geração de IA sem proteção por usuário) |
| BE-13 | AI-Service | Confirmar `DEBUG=False` em produção no Railway + trocar default de `debug` no `config.py` para `False` |
| BE-14 | Billing | Sprint 1 do `MULTITENANT-BILLING.md`: migrations `plans`/`subscriptions`/`usage_counters`, estender `/auth/verify`, `enforce_quota` no ai-service, `POST /api/usage/increment` |

### 🟡 Importante — antes de escalar vendas

| ID | Serviço | Demanda |
|---|---|---|
| BE-15 | Laravel | Sentry (ou similar) + exception handler abrangente + correlation/request ID nos logs |
| BE-16 | AI-Service | Sentry + logging estruturado (JSON) + correlation ID |
| BE-17 | Laravel | Cobertura de testes: `AdminController` (roles/bloqueio/auditoria), `CheckRole`, `HealthController`, verificação de e-mail, OAuth, refresh |
| BE-18 | AI-Service | Suíte pytest: `ownership_check`, rate limiting, chunking, fallback de provedores, parsing de resposta do LLM |
| BE-19 | Laravel | Política de senha forte (`Rules\Password`) + lockout de conta por tentativas falhas (reaproveitando `audit_logs`) |
| BE-20 | Laravel | `VerifyEmail` como job em fila (`ShouldQueue`) + templates de e-mail com branding EduCore (boas-vindas, verificação, reset de senha) |
| BE-21 | Laravel | Confirmar cron `schedule:run` ativo na Hostinger + alerta se fila de auditoria acumular |
| BE-22 | AI-Service | Aplicar `max_pages` de fato + timeout global do pipeline + circuit breaker entre provedores de IA |
| BE-23 | AI-Service | Rastrear custo por geração (tokens/chamadas) na tabela `generations` |
| BE-24 | AI-Service | Migrar `init_db()` para Alembic + connection pooling (SQLAlchemy engine ou pool psycopg2) |
| BE-25 | Laravel | Índices em `users.role` e `users.last_login_at` |
| BE-26 | Laravel | Documentação de API: Swagger/OpenAPI (`dedoc/scramble` ou similar) ou Postman collection |
| BE-27 | Billing | Sprint 2/3 do `MULTITENANT-BILLING.md`: gateway Asaas, webhooks, e-mails de cobrança, dashboard MRR/churn |

### 🟢 Nice-to-have

| ID | Serviço | Demanda |
|---|---|---|
| BE-28 | Laravel | 2FA opcional (TOTP) |
| BE-29 | AI-Service | Remover dependências mortas: `google-generativeai` (SDK legado), `generate_pptx.js`/`node_modules` (gerador Node substituído) |
| BE-30 | Laravel | Alerta automático de `failed_jobs` (hoje só visível manualmente via `/health`) |

---

## 5. Backlog priorizado — Frontend (Angular)

### 🔴 Crítico — bloqueia lançamento comercial

| ID | Demanda |
|---|---|
| FE-01 | `npm audit fix` — atualizar Angular para ≥20.3.25 (7 vulnerabilidades high de XSS) |
| FE-02 | Páginas reais de Termos de Uso e Política de Privacidade + checkbox de aceite versionado no cadastro |
| FE-03 | Banner de consentimento de cookies |
| FE-04 | Exclusão de conta / exportação de dados pessoais na tela de perfil (LGPD) |
| FE-05 | Implementar o "Assistente de IA" do painel de verdade, ou remover o botão até estar pronto |
| FE-06 | Decidir o destino do `admin/chat`: implementar o backend de verdade ou remover a feature antes de vender |
| FE-07 | Billing: página `/precos`, `/conta/assinatura`, interceptor para HTTP 402, badge de uso no header (ver `MULTITENANT-BILLING.md` §5) |

### 🟡 Importante — antes de escalar vendas

| ID | Demanda |
|---|---|
| FE-08 | Lazy loading de rotas (`loadComponent`) — hoje bundle inicial carrega o painel admin inteiro pro visitante anônimo |
| FE-09 | Decidir sobre SSR: ativar de fato (hoje `RenderMode.Client` força CSR em tudo, anulando o setup já presente) ou remover o scaffold morto |
| FE-10 | Remover 18MB/438 imagens mortas de template em `public/images` |
| FE-11 | Remover dependências não usadas (`@angular/material`, `@angular/cdk`) |
| FE-12 | Instrumentar analytics (GA4/Plausible) — hoje impossível medir funil de conversão do plano de marketing já escrito |
| FE-13 | Unificar tratamento de erro: remover duplicação de toasts (interceptor + componente mostrando 2x para o mesmo erro) |
| FE-14 | Unificar toast: `features/classes` usa `MessageService` próprio do PrimeNG em vez do `ToastService` compartilhado |
| FE-15 | Testes unitários reais (28 specs hoje são só boilerplate) — cobrir `auth.service`, `result-store`, força de senha, SSE/polling |
| FE-16 | `ErrorHandler` global customizado + tela de fallback para erro não tratado (hoje tela em branco) |
| FE-17 | Migrar formulários (login/register/forgot-password) para Reactive Forms — hoje regex de validação duplicada em cada tela |

### 🟢 Nice-to-have

| ID | Demanda |
|---|---|
| FE-18 | Acessibilidade além do LIBRAS: `aria-*`, `tabindex`, `role` em componentes clicáveis customizados (ex: card de turma) |
| FE-19 | PWA (manifest + service worker) |
| FE-20 | Scaffold de i18n, se houver plano de expansão internacional |
| FE-21 | Resolver `$any(...)` nos templates admin (users/professors/students) — escape hatch de tipagem em eventos DOM |

---

## 6. Billing & Monetização

Mapeado em detalhe técnico em `MULTITENANT-BILLING.md` — não duplicado aqui. Resumo do estado confirmado nesta auditoria: **billing é 100% greenfield**, nenhuma tabela `plans`/`subscriptions`/`payments`/`usage_counters` existe em nenhum dos dois bancos, nenhuma lógica de quota ou gateway de pagamento está implementada em nenhum dos 3 serviços. Os IDs `BE-14`/`BE-27` (backend) e `FE-07` (frontend) acima apontam para esse documento — use-o como fonte da verdade para a implementação, ele já tem migrations, rotas e sequência de sprints desenhadas.

---

## 7. Roteiro sugerido até o go-live comercial

**Sprint 0 — Bloqueadores de segurança, compliance e infraestrutura** (não vende sem isso)
`FE-01` (fix rápido, fazer primeiro) → `BE-01, BE-02, BE-03, BE-04, BE-05, BE-06` (segurança backend) → `BE-07, BE-08, BE-09` (confiabilidade ai-service) → `BE-10, FE-02, FE-03, FE-04` (LGPD) → `BE-11, BE-12, BE-13` (segurança ai-service) → `FE-05, FE-06` (remover promessas quebradas da UI)

**Sprint 1 — Billing básico (sem cobrança ainda)**
`BE-14` + `FE-07` (parte de planos/quota) — ver Sprint 1 do `MULTITENANT-BILLING.md`

**Sprint 2 — Cobrança ativa**
`BE-27` (Asaas + webhooks) + resto de `FE-07` (`/precos`, checkout) — ver Sprint 2 do `MULTITENANT-BILLING.md`

**Sprint 3 — Operação e confiabilidade**
`BE-15, BE-16` (observabilidade) → `BE-17, BE-18, FE-15` (testes) → `BE-19, BE-20, BE-21` (e-mail/cron) → `BE-22, BE-23, BE-24` (custo/escala ai-service)

**Sprint 4 — Performance, UX e polish**
`FE-08, FE-09, FE-10, FE-11, FE-12, FE-13, FE-14, FE-16, FE-17` → `BE-25, BE-26` → itens 🟢 conforme sobrar tempo

Este roteiro técnico **precede** o roteiro de marketing já escrito em `PLANO-MARKETING-EDUCORE.md` — aquele documento já é explícito: "não gaste 1 real ou 1 hora em aquisição" antes do billing funcionar ponta a ponta. Este documento mostra que, além do billing, há bloqueadores de segurança e compliance que também precisam fechar antes.

---

## 8. Checklist "pronto para vender" (go/no-go)

- [ ] `npm audit fix` aplicado (Angular sem vulnerabilidades high)
- [ ] Bloqueio de usuário revoga token de verdade
- [ ] Esqueci minha senha funcionando
- [ ] Termos de Uso + Política de Privacidade publicados e com aceite versionado no cadastro
- [ ] Endpoint de exclusão/exportação de dados do usuário
- [ ] PDFs armazenados em storage persistente (não disco local do Railway)
- [ ] Documento nunca fica travado em "processing" para sempre
- [ ] ai-service aguenta 2+ usuários gerando conteúdo ao mesmo tempo sem travar
- [ ] Planos + quota implementados (Sprint 1 do `MULTITENANT-BILLING.md`)
- [ ] Gateway de pagamento ativo + página `/precos` no ar (Sprint 2)
- [ ] Sentry (ou equivalente) rodando nos 3 serviços
- [ ] "Assistente de IA" e `admin/chat` — implementados de verdade ou removidos da UI

Só depois de marcar todos os itens acima faz sentido seguir para o roteiro de aquisição de `PLANO-MARKETING-EDUCORE.md`.

---

## 9. Tarefas prontas para importar no Avante

Todas as demandas acima (backend + frontend) estão consolidadas em `demandas-tecnicas-tasks.json`, no mesmo formato de `marketing-educore-tasks.json`, pronto para o importador JSON em massa do Avante.
