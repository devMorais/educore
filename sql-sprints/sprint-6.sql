-- ============================================================
-- EduCore — Sprint 6: descricoes enriquecidas em formato de prompt
-- Atualiza o campo description das tarefas ja existentes (nao recria nada)
-- ============================================================

UPDATE tasks SET description = '[D-29] Painel de gestão de assinatura para o usuário

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/) + Angular (frontend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Complementa a demanda D-28 (billing já deve estar implementado quando esta rodar). Página /conta/assinatura precisa de histórico, troca de plano e e-mails automáticos.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\backend
   cd C:\Users\claudia\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-29-painel-assinatura-usuario
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- backend/app/Http/Controllers/Api/BillingController.php (já criado na D-28, adicionar GET /billing/payments e lógica de troca de plano)
- frontend/src/app/features/account/subscription/ (já criada na D-28, complementar com histórico e botão de troca)
- CRIAR: e-mails de boas-vindas, pagamento recusado, fim de trial (usar fila já existente)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Usuário vê seu histórico completo de pagamentos em /conta/assinatura
- [ ] Usuário troca de plano (upgrade/downgrade) pela própria interface, sem intervenção manual
- [ ] E-mails automáticos disparam corretamente nos 3 eventos (boas-vindas ao assinar, pagamento recusado, aviso 3 dias antes do fim do trial), via fila

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-29): painel de gestao de assinatura do usuario"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-29]%' LIMIT 1;

UPDATE tasks SET description = '[D-30] Dashboard de métricas de negócio para o admin

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/) + Angular (frontend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Estender o AdminController/dashboard já existente (hoje só mostra KPIs de uso técnico) com métricas de negócio, agora que billing (D-28) já existe.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\backend
   cd C:\Users\claudia\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-30-dashboard-mrr-churn
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- backend/app/Http/Controllers/Api/AdminController.php (adicionar método billingStats ou similar)
- backend/routes/api.php (GET /admin/billing-stats)
- frontend/src/app/features/admin/dashboard/ (adicionar o card de métricas de negócio)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] GET /admin/billing-stats retorna MRR (soma de price_cents das assinaturas ativas), churn mensal, taxa de conversão Free->Pago
- [ ] Lista de assinaturas com pagamento em atraso (status=past_due) visível e acionável (link para contatar o usuário)
- [ ] Admin visualiza tudo isso diretamente no dashboard, sem consultar o banco manualmente
- [ ] Dados batem com uma conferência manual simples (ex: contar assinaturas ativas x preço do plano)

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-30): dashboard de MRR, churn e conversao para admin"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-30]%' LIMIT 1;

UPDATE tasks SET description = '[D-31] Feedback de conteúdo gerado

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/) + Angular (frontend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Não existe forma do usuário avaliar a qualidade do quiz/resumo/slides gerados.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\backend
   cd C:\Users\claudia\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-31-feedback-conteudo-gerado
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- CRIAR: backend/database/migrations/..._create_content_feedbacks_table.php (user_id, document_id, generation_type, rating 1-5, comment, timestamps, único por usuário+documento+tipo)
- CRIAR: backend/app/Http/Controllers/Api/FeedbackController.php
- backend/routes/api.php (POST /feedback, GET /admin/feedback, GET /admin/feedback/stats)
- CRIAR: frontend/src/app/shared/components/molecules/feedback/rating-widget/ (usar p-rating do PrimeNG)
- frontend/src/app/features/result/types/ (adicionar o widget no rodapé de cada tipo de resultado)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] POST /feedback com upsert (reenviar avaliação para o mesmo documento+tipo atualiza, não duplica)
- [ ] Widget de estrelas não bloqueia o uso do conteúdo, com campo de comentário opcional
- [ ] GET /admin/feedback/stats retorna a média de avaliação por tipo de geração
- [ ] Teste Feature Laravel cobrindo criação, upsert e a agregação de stats

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-31): feedback de conteudo gerado (rating + comentario)"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-31]%' LIMIT 1;

UPDATE tasks SET description = '[D-33] Suporte a múltiplos idiomas na geração de conteúdo

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Python/FastAPI (ai-service/) + Angular (frontend/).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Toda geração hoje sai em português, mesmo que o usuário processe um PDF em outro idioma.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\ai-service
   cd C:\Users\UITEC\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-33-multi-idioma-geracao
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- ai-service/app/models/schemas.py (GenerationRequest, adicionar campo language)
- ai-service/app/services/rag_service.py (injetar instrução de idioma em todos os prompts: quiz, resumo, slides, mapa mental, flashcards, PCD)
- CRIAR: frontend/src/app/shared/components/ (seletor de idioma, bandeiras 🇧🇷/🇺🇸/🇪🇸)
- frontend/src/app/features/result/ (adicionar o seletor antes de cada geração)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Campo language opcional (pt-BR default, en-US, es-ES) no schema de geração
- [ ] Instrução de idioma injetada em TODOS os prompts de geração
- [ ] Idioma usado salvo em generations.metadata
- [ ] Seletor de idioma no frontend, preferência persistida em localStorage entre sessões
- [ ] Badge do idioma exibido junto ao conteúdo gerado
- [ ] Testado manualmente: gerar o mesmo documento em português e depois em inglês produz conteúdo de fato traduzido

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-33): suporte a multiplos idiomas na geracao de conteudo"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-33]%' LIMIT 1;

UPDATE tasks SET description = '[D-34] Cache de embeddings entre gerações do mesmo documento

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Python/FastAPI (ai-service/).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Embeddings são recalculados via API do Gemini toda vez que uma nova geração é solicitada para um documento já processado, mesmo sem mudança de conteúdo.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\ai-service
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-34-cache-embeddings
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- ai-service/app/services/rag_service.py
- ai-service/app/services/embed_service.py
- ai-service/app/routers/admin.py (adicionar POST /documents/{id}/reindex, admin only)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Antes de gerar embeddings, checar se já existem chunks com embedding calculado para aquele document_id
- [ ] Se existirem, reutilizar diretamente na busca semântica (pgvector), sem chamar a API de embedding de novo
- [ ] Coluna embeddings_generated_at adicionada em documents
- [ ] POST /documents/{id}/reindex força regeneração quando chamado
- [ ] Segunda geração para o mesmo documento é mensuravelmente mais rápida e não dispara nova chamada à API de embeddings (confirmável no log)

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-34): cache de embeddings reutilizavel entre geracoes"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-34]%' LIMIT 1;

UPDATE tasks SET description = '[D-35] Operações em lote em Meus Documentos

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Python/FastAPI (ai-service/) + Angular (frontend/, depende da tela Meus Documentos da D-36).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Não existe forma de selecionar múltiplos documentos e agir sobre eles de uma vez. Esta demanda pressupõe que a tela /meus-docs (D-36) já existe ou é feita em conjunto.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\ai-service
   cd C:\Users\UITEC\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-35-bulk-operations-documentos
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- ai-service/app/routers/documents.py (adicionar DELETE /documents/bulk e GET /documents/bulk-export)
- frontend/src/app/features/meus-documentos/ (adicionar checkbox de seleção e barra de ações)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] DELETE /documents/bulk (body {ids: []}) valida ownership de cada item, limite de 20 por operação, retorna {deleted, errors}
- [ ] GET /documents/bulk-export retorna um ZIP (zipfile da stdlib) com os PDFs originais selecionados
- [ ] Tentar excluir documento de outro usuário via manipulação do payload retorna erro, sem afetar os documentos do solicitante
- [ ] Frontend: checkbox por documento, barra de ações flutuante quando há seleção, confirmação antes de excluir em massa

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-35): operacoes em lote (bulk delete/export) de documentos"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-35]%' LIMIT 1;

-- Verificacao: confirme que todas as descricoes desta sprint foram atualizadas (buscar pelo novo cabecalho "CONTEXTO DO PROJETO")
SELECT id, LEFT(description, 60) AS inicio FROM tasks WHERE board_id = 7 AND sprint_id = (SELECT id FROM sprints WHERE board_id = 7 AND name LIKE 'Sprint 6 -%' LIMIT 1) ORDER BY id;