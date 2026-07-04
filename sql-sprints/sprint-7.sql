-- ============================================================
-- EduCore — Sprint 7: descricoes enriquecidas em formato de prompt
-- Atualiza o campo description das tarefas ja existentes (nao recria nada)
-- ============================================================

UPDATE tasks SET description = '[D-36] Tela "Meus Documentos" (histórico completo)

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Angular (frontend/, usando endpoints que já existem no ai-service).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Não existe hoje uma tela central de histórico de PDFs processados. Os endpoints GET /documents e DELETE /documents/{id} JÁ EXISTEM no ai-service — esta demanda é só frontend.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-36-tela-meus-documentos
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- CRIAR: frontend/src/app/features/meus-documentos/ (rota /meus-docs, protegida por authGuard)
- frontend/src/app/core/services/ai.service.ts (já deve ter os métodos de listar/excluir documentos, conferir)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Grid de cards mostrando nome, data de upload, tamanho, status e número de gerações de cada documento
- [ ] Filtro por status e busca por nome, paginação (25 por página)
- [ ] Clicar em um documento processado leva diretamente ao resultado já gerado, sem reprocessar
- [ ] Exclusão individual com confirmação prévia

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-36): tela Meus Documentos com historico completo"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-36]%' LIMIT 1;

UPDATE tasks SET description = '[D-37] Compartilhamento de resultado via link público

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/) + Angular (frontend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Não existe forma de compartilhar um quiz/resumo/slides gerado com alguém sem conta no EduCore.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\backend
   cd C:\Users\claudia\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-37-compartilhar-link-publico
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- CRIAR: backend/database/migrations/..._create_shared_links_table.php (token único, user_id, document_id, generation_type, generation_data JSON, expires_at)
- CRIAR: backend/app/Http/Controllers/Api/ShareController.php
- backend/routes/api.php (POST /share autenticado, GET /share/{token} público)
- CRIAR: frontend/src/app/features/public-share/ (rota pública /p/{token}, SEM authGuard)
- frontend/src/app/features/result/ (botão "Compartilhar" em cada tipo de resultado)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] POST /share gera/reutiliza token único (upsert por usuário+documento+tipo), expiração de 30 dias
- [ ] GET /share/{token} funciona sem login, em aba anônima/outro navegador
- [ ] Link expira automaticamente após 30 dias, retornando página de "link expirado" amigável
- [ ] Gerar novamente o link para o mesmo documento+tipo reaproveita o token existente

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-37): compartilhamento de resultado via link publico"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-37]%' LIMIT 1;

UPDATE tasks SET description = '[D-38] Analytics de uso (admin e professor)

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/) + Angular (frontend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Não existe visão agregada de uso da plataforma além dos KPIs básicos do dashboard admin atual.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\backend
   cd C:\Users\claudia\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-38-analytics-uso
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- backend/app/Http/Controllers/Api/AdminController.php (adicionar analytics, usando Cache::remember com 10min)
- backend/routes/api.php (GET /admin/analytics, GET /admin/analytics/types, GET /admin/analytics/retention)
- CRIAR: frontend/src/app/features/analytics/ (rota /analytics para o professor, usando Chart.js já disponível no projeto)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Admin: docs/gerações/usuários ativos por dia (últimos 30 dias, com filtro de período), distribuição por tipo de geração, retenção 7/14/30 dias
- [ ] Professor: rota /analytics com KPIs pessoais (total de PDFs, gerações, tipo mais usado), gráfico de linha (gerações por dia) e tabela dos últimos 10 documentos
- [ ] Professor só vê seus próprios dados, nunca de outros usuários
- [ ] Cache de 10 minutos funcionando (segunda chamada dentro do período não recalcula do zero)
- [ ] Números batem com uma conferência manual simples no banco para um período curto

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-38): analytics de uso para admin e professor"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-38]%' LIMIT 1;

UPDATE tasks SET description = '[D-40] Monitoramento de erros em produção (Sentry) nos três serviços

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/) + Angular (frontend/) + Python/FastAPI (ai-service/).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Não existe nenhuma ferramenta de monitoramento de erros nos 3 serviços — descobrir um problema em produção hoje depende de SSH manual.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\backend
   cd C:\Users\UITEC\Herd\educore\frontend
   cd C:\Users\UITEC\Herd\educore\ai-service
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-40-sentry-monitoramento
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- backend/composer.json (adicionar sentry/sentry-laravel)
- ai-service/requirements.txt (adicionar sentry-sdk[fastapi])
- frontend/package.json (adicionar @sentry/angular)
- Arquivos de configuração/bootstrap de cada serviço (bootstrap/app.php, main.py, app.config.ts)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Sentry integrado nos 3 serviços, com ambiente (production/homolog/local) e release configurados corretamente
- [ ] Uma exceção forçada (endpoint de teste temporário, removido depois) aparece no painel do Sentry em cada serviço, com stack trace legível
- [ ] Dados sensíveis (senhas, tokens) não vazam nos eventos capturados (configurar before_send para redação)
- [ ] Alertas por e-mail configurados para erros novos ou com pico de frequência

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-40): monitoramento de erros (Sentry) nos 3 servicos"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-40]%' LIMIT 1;

UPDATE tasks SET description = '[D-41] Cobertura de testes automatizados para fluxos críticos

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/) + Angular (frontend/) + Python/FastAPI (ai-service/).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
backend/tests/Feature/AuthTest.php é o único teste com conteúdo real; os 28 specs Angular são boilerplate; o ai-service não tem nenhum teste automatizado.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\backend
   cd C:\Users\UITEC\Herd\educore\frontend
   cd C:\Users\UITEC\Herd\educore\ai-service
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-41-cobertura-testes-automatizados
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- backend/tests/Feature/ (criar testes para AdminController completo, CheckRole, HealthController, verificação de email, OAuth)
- frontend/src/app/core/services/auth.service.spec.ts, result-store.service.spec.ts (hoje boilerplate, escrever testes reais)
- CRIAR: ai-service/tests/ com pytest (ownership_check, fallback de provedores de IA, parsing de resposta do LLM)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Cobertura mensurável (php artisan test --coverage, ng test --code-coverage, pytest --cov) sobre os módulos listados, não apenas contagem de arquivos
- [ ] Suíte inteira (Laravel + Angular unit + pytest + Cypress) roda em menos de 10 minutos
- [ ] Nenhum teste "should create" vazio permanece nos arquivos listados — cada um testa comportamento real

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "test(D-41): cobertura de testes automatizados nos 3 servicos"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-41]%' LIMIT 1;

UPDATE tasks SET description = '[D-43] Decidir e implementar o destino do SSR

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Angular (frontend/) — decisão de produto antes de qualquer código.
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
O scaffold de Angular SSR está todo configurado mas app.routes.server.ts força RenderMode.Client em todas as rotas, anulando o ganho, e o deploy real serve a build como SPA estática via PHP/LiteSpeed.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-43-decisao-ssr
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- frontend/src/app/app.routes.server.ts
- frontend/src/server.ts
- frontend/src/app/app.config.server.ts
- PLANO-MARKETING-EDUCORE.md (referência pra avaliar o quanto SEO orgânico importa pra estratégia de aquisição)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Decisão tomada e documentada: (a) ativar SSR de verdade nas rotas públicas que importam pra SEO (home, /precos, termos/privacidade), ajustando o pipeline de deploy; OU (b) remover todo o scaffold de SSR não utilizado
- [ ] Se ativado: rotas públicas escolhidas retornam HTML já renderizado no view-source, sem quebrar a hidratação no cliente
- [ ] Se removido: nenhum arquivo/dependência de SSR morto permanece no repositório

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "chore(D-43): decisao e implementacao do destino do SSR"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-43]%' LIMIT 1;

-- Verificacao: confirme que todas as descricoes desta sprint foram atualizadas (buscar pelo novo cabecalho "CONTEXTO DO PROJETO")
SELECT id, LEFT(description, 60) AS inicio FROM tasks WHERE board_id = 7 AND sprint_id = (SELECT id FROM sprints WHERE board_id = 7 AND name LIKE 'Sprint 7 -%' LIMIT 1) ORDER BY id;