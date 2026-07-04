-- ============================================================
-- EduCore — Sprint 3: descricoes enriquecidas em formato de prompt
-- Atualiza o campo description das tarefas ja existentes (nao recria nada)
-- ============================================================

UPDATE tasks SET description = '[D-08] Remover código morto de SSE no upload

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Angular (frontend/, só limpeza).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
O componente de upload tenta usar EventSource para conectar em GET /documents/{id}/stream, endpoint que nunca foi implementado no ai-service. Na prática, todo upload sempre cai no fallback de polling de 2s já programado no mesmo componente, e funciona bem assim.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-08-remover-sse-morto
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- frontend/src/app/features/panel/panel.ts (localizar a lógica de EventSource e o fallback de polling, remover só a tentativa de EventSource, manter o polling)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Upload de PDF continua mostrando progresso em tempo real (via polling) sem regressão visual ou funcional
- [ ] Nenhuma tentativa de conexão a /documents/{id}/stream aparece mais no código nem no console do navegador
- [ ] Testado manualmente: fazer upload de um PDF e confirmar que a barra de progresso funciona normalmente do início ao fim

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "chore(D-08): remover codigo morto de EventSource/SSE, manter so polling"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-08]%' LIMIT 1;

UPDATE tasks SET description = '[D-10] Configurar CORS explícito no backend Laravel

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Não existe config/cors.php no projeto. O Laravel 13 usa o middleware HandleCors por padrão, mas sem esse arquivo cors.paths fica vazio e nenhuma resposta recebe Access-Control-Allow-Origin.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\backend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-10-cors-explicito
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- CRIAR: backend/config/cors.php
- backend/.env.example (documentar a nova variável)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] config/cors.php criado com paths => [''api/*''], allowed_origins vindo de env(''CORS_ALLOWED_ORIGINS'') (separado por vírgula), allowed_methods => [''*''], allowed_headers => [''*''], supports_credentials => true
- [ ] Requisição de origem NÃO listada em CORS_ALLOWED_ORIGINS recebe erro de CORS no navegador
- [ ] Frontend local (localhost:4200) volta a funcionar contra o backend sem configuração manual extra
- [ ] .env.example documenta CORS_ALLOWED_ORIGINS com exemplo de valor para dev e produção

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "fix(D-10): configurar CORS explicito no Laravel"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-10]%' LIMIT 1;

UPDATE tasks SET description = '[D-11] Eliminar credencial de admin hardcoded

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
backend/database/seeders/AdminSeeder.php cria/atualiza admin@educore.test com senha Admin@123! em texto plano no código-fonte, condicionado a "nenhum admin existir".

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\backend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-11-remover-seeder-hardcoded
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- backend/database/seeders/AdminSeeder.php

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Seeder gera senha aleatória forte em tempo de execução e imprime uma única vez no console (nunca grava em log persistente), OU exige env var INITIAL_ADMIN_PASSWORD sem valor default
- [ ] Seeder falha explicitamente (sem criar nada) se rodar sem a configuração necessária
- [ ] Seeder recusa rodar se APP_ENV=production e a variável ALLOW_ADMIN_SEED=true não estiver setada
- [ ] Senha antiga Admin@123! não existe mais em nenhum lugar do código-fonte

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "fix(D-11): remover credencial hardcoded do AdminSeeder"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-11]%' LIMIT 1;

UPDATE tasks SET description = '[D-22] Migrar armazenamento de PDFs para storage persistente

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Python/FastAPI (ai-service/).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
O ai-service salva PDFs em uploads/ no disco local — no Railway o filesystem é efêmero e todo arquivo processado some a cada redeploy. ai-service/app/core/config.py já tem os campos preparados (pdf_storage_provider, s3_*, supabase_url) mas nenhum provedor está implementado.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\ai-service
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-22-storage-persistente-pdfs
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- ai-service/app/core/config.py (campos já existentes, LEIA primeiro)
- ai-service/app/routers/documents.py (todas as leituras/escritas de uploads/)
- ai-service/app/services/rag_service.py (idem)
- CRIAR: ai-service/app/services/storage_service.py (interface save(file) -> url, get(path) -> bytes, delete(path))

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] storage_service.py implementado usando Supabase Storage (ou S3/R2, decisão livre desde que documentada)
- [ ] Todas as leituras/escritas de uploads/ em documents.py e rag_service.py passam a usar o storage_service
- [ ] Modo local (pdf_storage_provider=local) continua funcionando para desenvolvimento sem credenciais de nuvem
- [ ] PDF enviado antes de um redeploy do ai-service no Railway continua acessível depois do redeploy (testar manualmente)
- [ ] Renovação automática da URI do Gemini Files volta a funcionar mesmo após redeploy

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-22): storage persistente para PDFs (Supabase Storage/S3)"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-22]%' LIMIT 1;

UPDATE tasks SET description = '[D-23] Watchdog para documentos travados no processamento

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Python/FastAPI (ai-service/) + Angular (frontend/, botão de retry).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
O pipeline roda via BackgroundTasks do FastAPI, sem fila persistente. Se o processo cair no meio (crash, OOM, redeploy), o documento fica com status=''processing'' para sempre, sem detecção.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\ai-service
   cd C:\Users\UITEC\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-23-watchdog-documentos-travados
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- ai-service/app/services/rag_service.py (função process_document)
- ai-service/main.py (lifespan da aplicação, onde adicionar a rotina periódica)
- frontend/src/app/features/panel/panel.ts (adicionar botão "Tentar novamente" quando status=failed)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Rotina periódica (ex: a cada 5 minutos, via apscheduler ou tarefa no lifespan do FastAPI) identifica documentos com status=processing e updated_at há mais de 15 minutos
- [ ] Documento identificado é marcado como status=failed com mensagem de erro explicando o timeout
- [ ] Frontend mostra botão "Tentar novamente" quando status=failed, reiniciando o pipeline do zero para aquele documento
- [ ] Teste automatizado simulando um documento travado e confirmando que a rotina o marca como failed

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-23): watchdog para documentos travados em processing"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-23]%' LIMIT 1;

UPDATE tasks SET description = '[D-24] Eliminar o gargalo de concorrência do ai-service

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Python/FastAPI (ai-service/).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
O ai-service roda com 1 único worker (uvicorn sem --workers), e chamadas caras (SDK do Gemini, python-pptx, TTS, httpx pro Pexels) são síncronas dentro de handlers async def, sem asyncio.to_thread — 2 usuários gerando ao mesmo tempo travam o serviço inteiro, inclusive o /health.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\ai-service
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-24-concorrencia-ai-service
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- ai-service/app/services/rag_service.py (funções _gerar_conteudo, _chat_openai)
- ai-service/app/services/pptx_service.py (geração de apresentação)
- ai-service/app/services/tts_service.py (síntese de voz)
- ai-service/app/services/reveal_service.py (chamadas ao Pexels)
- ai-service/Procfile e ai-service/Dockerfile (configuração de workers do uvicorn)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Todas as chamadas síncronas identificadas envolvidas com asyncio.to_thread(...)
- [ ] Procfile/Dockerfile configurados para rodar com múltiplos workers (uvicorn main:app --workers 2 ou mais, conforme recursos do plano Railway)
- [ ] Teste manual: dois documentos sendo processados/gerados ao mesmo tempo (duas abas/usuários) não travam a resposta um do outro nem o /health
- [ ] Teste de carga simples (ex: script disparando 5 gerações simultâneas) confirma que o tempo de resposta não cresce linearmente com requisições simultâneas
- [ ] Nenhuma regressão nas gerações existentes (quiz, resumo, slides, mapa mental, flashcards, PCD)

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "fix(D-24): eliminar gargalo de concorrencia do ai-service"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-24]%' LIMIT 1;

-- Verificacao: confirme que todas as descricoes desta sprint foram atualizadas (buscar pelo novo cabecalho "CONTEXTO DO PROJETO")
SELECT id, LEFT(description, 60) AS inicio FROM tasks WHERE board_id = 7 AND sprint_id = (SELECT id FROM sprints WHERE board_id = 7 AND name LIKE 'Sprint 3 -%' LIMIT 1) ORDER BY id;