-- ============================================================
-- EduCore — Sprint 2: descricoes enriquecidas em formato de prompt
-- Atualiza o campo description das tarefas ja existentes (nao recria nada)
-- ============================================================

UPDATE tasks SET description = '[D-05] Finalizar fórum de discussão

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
A tela /admin/forum já existe com lista de tópicos, criação, thread de respostas e paginação — visualmente parece pronta, mas NÃO existe ForumController nem as tabelas forum_topics/forum_replies no banco. Toda chamada hoje retorna 404.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\backend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-05-forum-discussao
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- frontend/src/app/features/admin/forum/forum.ts e forum.service.ts (LEIA — mostra exatamente as rotas e payloads esperados)
- backend/routes/api.php (adicionar as rotas de fórum)
- CRIAR: backend/database/migrations/..._create_forum_topics_table.php (id, user_id, title, body, replies_count, last_reply_at, timestamps, soft delete)
- CRIAR: backend/database/migrations/..._create_forum_replies_table.php (id, topic_id, user_id, body, timestamps, soft delete)
- CRIAR: backend/app/Models/ForumTopic.php e backend/app/Models/ForumReply.php
- CRIAR: backend/app/Http/Controllers/Api/ForumController.php

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] GET/POST /forum/topics e GET/POST /forum/topics/{id}/replies funcionando com paginação
- [ ] Qualquer usuário autenticado cria tópico, responde, e vê a lista paginada com contagem de respostas e última atividade
- [ ] Autor exclui seu próprio tópico/resposta (soft delete); outro usuário comum não consegue (403); admin exclui qualquer um
- [ ] Teste Feature Laravel cobrindo: criação de tópico, resposta, paginação, regra de exclusão
- [ ] Testado manualmente em /admin/forum sem nenhum erro 404

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-05): backend completo do forum de discussao"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-05]%' LIMIT 1;

UPDATE tasks SET description = '[D-06] Descontinuar o Chat interno da área administrativa

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Angular (frontend/, só remoção).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
O chat em /admin/chat tem frontend com polling a cada 3s, mas o próprio código já tem um comentário admitindo que o backend nunca foi feito. É comunicação interna da equipe, não uma feature do cliente final — decisão é descontinuar por ora, não terminar o backend.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-06-remover-chat-interno
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- frontend/src/app/app.routes.ts (remover a rota /admin/chat)
- frontend/src/app/features/admin/chat/ (NÃO DELETAR os arquivos, só remover do menu e da navegação — pode ser retomado no futuro)
- Procure o link/item de menu "Chat" no componente de navegação admin e remova

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Menu admin não exibe mais link para "Chat"
- [ ] Rota /admin/chat não existe mais em app.routes.ts (acesso direto pela URL não deve renderizar a tela de chat)
- [ ] Nenhum erro de console relacionado a polling de chat aparece mais em nenhuma tela
- [ ] Componente chat.ts continua no repositório (não foi deletado), só desconectado da navegação

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "chore(D-06): remover chat interno do menu admin (backend nunca foi feito)"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-06]%' LIMIT 1;

UPDATE tasks SET description = '[D-07] Exibir botão de exportação para Google Slides

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Angular (frontend/, o backend no ai-service já existe e funciona).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
O ai-service JÁ TEM a integração funcional com o Google Slides (função _try_google_slides() em ai-service/app/routers/documents.py, que já roda automaticamente ao gerar slides e salva google_slides_url na resposta da geração) — mas não existe nenhum botão no frontend pra usar isso.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-07-botao-google-slides
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- frontend/src/app/features/result/types/slides/ (tela de resultado de slides, adicionar o botão aqui)
- frontend/src/app/core/services/ai.service.ts (conferir se o tipo de retorno da geração já inclui google_slides_url; se não, adicionar ao tipo em core/types/)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Botão "Abrir no Google Slides" aparece na tela de resultado de slides quando google_slides_url vier preenchido na resposta
- [ ] Clicar no botão abre o link em nova aba
- [ ] Se google_slides_url vier vazio (usuário não logou via Google, ou a chamada falhou no backend), o botão NÃO aparece e nenhum erro é mostrado ao usuário — é um recurso opcional
- [ ] Testado manualmente: gerar slides logado via Google (botão aparece e funciona) e gerar slides logado por email/senha (botão não aparece, sem erro)

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-07): botao de exportacao para Google Slides na tela de resultado"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-07]%' LIMIT 1;

UPDATE tasks SET description = '[D-16] Aplicar rate limit nos endpoints de áudio e visualização HTML

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Python/FastAPI (ai-service/).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
GET /documents/{id}/audio e GET /documents/{id}/html-view disparam geração real de IA (TTS e slides via Gemini) quando não há cache, mas não têm @limiter.limit(...) como os demais endpoints caros.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\ai-service
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-16-rate-limit-audio-html
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- ai-service/app/routers/documents.py (endpoints /audio linha ~364 e /html-view linha ~474; olhar os outros endpoints já protegidos como referência do padrão de @limiter.limit)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Rate limit por usuário aplicado em /audio e /html-view, usando o mesmo padrão já usado nos outros endpoints (ex: rate_generations_per_hour)
- [ ] Repetir chamadas além do limite retorna 429 com mensagem clara, mesmo vindo de IPs diferentes (limite por usuário, não só por IP)
- [ ] Uso normal (dentro do limite) não é afetado

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "fix(D-16): rate limit por usuario em /audio e /html-view"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-16]%' LIMIT 1;

UPDATE tasks SET description = '[D-17] Garantir modo de produção seguro no ai-service

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Python/FastAPI (ai-service/).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
ai-service/app/core/config.py tem debug: bool = True como valor padrão — se a variável DEBUG não foi setada manualmente no Railway, /docs, /redoc e /openapi.json ficam públicos em produção.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\ai-service
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-17-debug-false-producao
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- ai-service/app/core/config.py

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Valor padrão de debug trocado para False no código (fail-safe: precisa ser explicitamente ligado)
- [ ] Confirmado manualmente que a variável DEBUG=False está setada no painel do Railway de produção
- [ ] Ambiente de desenvolvimento local continua conseguindo ativar /docs setando DEBUG=True explicitamente no .env

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "fix(D-17): default seguro de DEBUG no ai-service"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-17]%' LIMIT 1;

UPDATE tasks SET description = '[D-21] Exclusão de conta e exportação de dados pessoais (LGPD)

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/) + Python/FastAPI (ai-service/, para excluir documentos associados).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Não existe nenhum mecanismo de "direito ao esquecimento" ou portabilidade de dados. O usuário precisa poder exportar e excluir seus próprios dados.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\backend
   cd C:\Users\UITEC\Herd\educore\ai-service
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-21-exclusao-exportacao-lgpd
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- backend/routes/api.php (adicionar GET /profile/export e DELETE /profile, protegidas por auth:sanctum)
- backend/app/Http/Controllers/Api/AuthController.php ou novo ProfileController
- ai-service/app/routers/documents.py (adicionar ou reaproveitar endpoint de exclusão de todos os documentos de um usuário, chamado pelo Laravel)
- frontend/src/app/features/profile/ (adicionar botões "Exportar meus dados" e "Excluir minha conta")

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] GET /profile/export retorna um arquivo (JSON ou ZIP) com os dados pessoais do usuário no MySQL + metadados dos documentos processados (sem o conteúdo binário dos PDFs)
- [ ] DELETE /profile exige confirmação de senha antes de executar
- [ ] Exclusão faz soft-delete do usuário, anonimiza nome/e-mail (ex: deleted-user-{id}@educore.invalid), revoga todos os tokens
- [ ] Exclusão dispara (evento assíncrono) a remoção dos documentos correspondentes no ai-service
- [ ] Usuário excluído não consegue mais fazer login
- [ ] Teste Feature Laravel cobrindo exportação e exclusão, incluindo a exigência de confirmação de senha

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-21): exportacao e exclusao de dados pessoais (LGPD)"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-21]%' LIMIT 1;

-- Verificacao: confirme que todas as descricoes desta sprint foram atualizadas (buscar pelo novo cabecalho "CONTEXTO DO PROJETO")
SELECT id, LEFT(description, 60) AS inicio FROM tasks WHERE board_id = 7 AND sprint_id = (SELECT id FROM sprints WHERE board_id = 7 AND name LIKE 'Sprint 2 -%' LIMIT 1) ORDER BY id;