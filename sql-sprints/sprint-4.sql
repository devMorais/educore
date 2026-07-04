-- ============================================================
-- EduCore — Sprint 4: descricoes enriquecidas em formato de prompt
-- Atualiza o campo description das tarefas ja existentes (nao recria nada)
-- ============================================================

UPDATE tasks SET description = '[D-12] Proteger a auto-promoção a admin do "primeiro usuário"

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
AuthController::register e handleGoogleCallback promovem automaticamente a admin qualquer cadastro feito quando não existe admin na base — via endpoints PÚBLICOS (registro e login Google).

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\backend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-12-protecao-auto-promocao-admin
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- backend/app/Http/Controllers/Api/AuthController.php (métodos register e handleGoogleCallback)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Lógica de auto-promoção removida dos endpoints públicos de registro e OAuth
- [ ] Existe um caminho seguro documentado para criar o primeiro admin (comando artisan make:admin {email} OU variável de ambiente INITIAL_ADMIN_EMAIL checada só uma vez no boot da aplicação)
- [ ] Teste Feature Laravel: registrar o primeiro usuário do zero e confirmar que ele NÃO recebe role admin automaticamente

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "fix(D-12): remover auto-promocao a admin do cadastro publico"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-12]%' LIMIT 1;

UPDATE tasks SET description = '[D-13] Corrigir configuração da URL do AI Service

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
AdminController.php e HealthController.php usam env(''AI_SERVICE_URL'', ...) diretamente no código, fora de config/. Isso quebra silenciosamente depois de php artisan config:cache (rodado no deploy) — env() fora do bootstrap retorna null, caindo no valor hardcoded http://localhost:8001.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\backend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-13-corrigir-config-ai-service-url
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- backend/config/services.php (adicionar a chave ai_service.url)
- backend/app/Http/Controllers/Api/AdminController.php (trocar env() por config())
- backend/app/Http/Controllers/Api/HealthController.php (trocar env() por config())
- backend/.env.example (documentar AI_SERVICE_URL)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] config/services.php tem a chave ai_service.url lendo de env(''AI_SERVICE_URL'')
- [ ] As duas ocorrências em AdminController e HealthController usam config(''services.ai_service.url'')
- [ ] Depois de rodar php artisan config:cache, /api/health e /api/admin/stats continuam enxergando a URL correta do ai-service
- [ ] AI_SERVICE_URL documentada no .env.example

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "fix(D-13): mover AI_SERVICE_URL para config/services.php"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-13]%' LIMIT 1;

UPDATE tasks SET description = '[D-14] Corrigir vulnerabilidades de segurança do Angular

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Angular (frontend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
npm audit reporta 7 vulnerabilidades "high" e 1 "moderate" nos pacotes @angular/* instalados (versão 20.3.21), incluindo duas falhas de bypass de sanitização (XSS).

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-14-corrigir-vulnerabilidades-angular
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- frontend/package.json
- frontend/cypress/e2e/ (suíte e2e completa que precisa ser revalidada depois)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] npm audit fix executado (ou pacotes @angular/* atualizados manualmente para >=20.3.25)
- [ ] npm audit não reporta mais vulnerabilidades "high" ou "critical" relacionadas ao Angular
- [ ] Toda a suíte Cypress e2e (20 specs bs-*/us-*) roda e passa sem regressão após a atualização
- [ ] Build de produção (ng build --configuration=production) completa sem erro novo

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "fix(D-14): corrigir vulnerabilidades XSS do Angular (npm audit)"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-14]%' LIMIT 1;

UPDATE tasks SET description = '[D-25] Definir e implementar backup dos bancos de dados

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Infraestrutura (Supabase + Hostinger, fora do código do monorepo).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Não existe nenhuma rotina de backup para o MySQL (Hostinger) ou PostgreSQL (Supabase). Esta é uma demanda de configuração de infraestrutura, não só código.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\backend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-25-backup-bancos-dados
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- Painel do Supabase (ativar backups automáticos, verificar plano/retenção)
- hPanel da Hostinger -> Cron Jobs (configurar rotina de mysqldump)
- DEPLOY.private.md (documentar o procedimento de restauração passo a passo — este arquivo é local, não vai pro GitHub)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Backup automático diário do Supabase ativado, com pelo menos 7 dias de retenção
- [ ] Cron job configurado na Hostinger rodando mysqldump diariamente e enviando o arquivo para um storage externo, com rotação de 7-14 dias
- [ ] Procedimento de restauração testado manualmente pelo menos uma vez (restaurar um backup em ambiente de teste e confirmar integridade)
- [ ] Passo a passo de restauração documentado em DEPLOY.private.md

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "docs(D-25): configurar e documentar backup dos bancos de dados"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-25]%' LIMIT 1;

UPDATE tasks SET description = '[D-26] Migrar schema do ai-service para migrations versionadas com connection pooling

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Python/FastAPI (ai-service/).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
O schema do PostgreSQL é criado por init_db(), que roda CREATE TABLE IF NOT EXISTS a cada boot — sem versionamento. Cada chamada abre uma nova conexão psycopg2 (2-3 por requisição), pressionando o limite do Supabase.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\ai-service
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-26-alembic-connection-pooling
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- ai-service/app/core/database.py (LEIA — init_db() e get_connection() atuais)
- CRIAR: estrutura do Alembic (alembic init, migration inicial gerada a partir do schema atual)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Alembic configurado, com migration inicial recriando o schema atual do zero
- [ ] alembic upgrade head cria o schema corretamente em um banco vazio
- [ ] get_connection() substituído por um pool de conexões (psycopg2.pool.SimpleConnectionPool ou engine SQLAlchemy com pool)
- [ ] Múltiplas instâncias do ai-service subindo ao mesmo tempo não geram erro de DDL concorrente
- [ ] Número de conexões simultâneas ao Postgres não cresce linearmente com requisições (verificável nas métricas do Supabase)

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "refactor(D-26): migrations Alembic + connection pooling no ai-service"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-26]%' LIMIT 1;

UPDATE tasks SET description = '[D-27] Implementar planos e quota de uso (sem cobrança ainda)

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/) + Python/FastAPI (ai-service/) + Angular (frontend/).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Hoje não existe nenhum conceito de plano ou limite mensal — qualquer usuário cadastrado tem acesso ilimitado (só rate limits técnicos genéricos se aplicam). Ver MULTITENANT-BILLING.md na raiz do repositório para o desenho técnico completo já mapeado.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\backend
   cd C:\Users\UITEC\Herd\educore\ai-service
   cd C:\Users\UITEC\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-27-planos-quota-uso
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- MULTITENANT-BILLING.md (LEIA PRIMEIRO — desenho completo já existe)
- CRIAR: backend/database/migrations/..._create_plans_table.php e ..._create_usage_counters_table.php
- backend/app/Http/Controllers/Api/AuthController.php (método verify, estender resposta com plan/limits/usage)
- ai-service/app/core/auth.py (propagar plan/limits/usage no current_user)
- ai-service/app/routers/documents.py (aplicar enforce_quota no upload e no generate)
- backend/routes/api.php (adicionar POST /api/usage/increment)
- frontend/src/app/shared/components/ (badge de uso no header, modal de upgrade em erro 402)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Migrations plans e usage_counters criadas, com seed inicial dos planos Free (3 PDFs/mês), Pro (30/mês) e Equipe (150/mês)
- [ ] GET /auth/verify retorna plan, limits e usage do usuário (já é cacheado e consumido pelo ai-service)
- [ ] ai-service bloqueia com HTTP 402 (mensagem clara de upgrade) quando o limite é atingido, no upload e na geração
- [ ] POST /api/usage/increment incrementa o contador do período atual de forma atômica (UPDATE ... WHERE pdfs_used < limit), sem race condition em uploads simultâneos
- [ ] Badge no header mostra uso do mês ("7/30 PDFs este mês") e modal amigável aparece no 402
- [ ] Contador reseta automaticamente a cada novo mês
- [ ] Teste cobrindo: bloqueio no limite, reset mensal, checagem atômica sob concorrência

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-27): sistema de planos e quota de uso"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-27]%' LIMIT 1;

-- Verificacao: confirme que todas as descricoes desta sprint foram atualizadas (buscar pelo novo cabecalho "CONTEXTO DO PROJETO")
SELECT id, LEFT(description, 60) AS inicio FROM tasks WHERE board_id = 7 AND sprint_id = (SELECT id FROM sprints WHERE board_id = 7 AND name LIKE 'Sprint 4 -%' LIMIT 1) ORDER BY id;