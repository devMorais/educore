-- ============================================================
-- EduCore — Sprint 5: descricoes enriquecidas em formato de prompt
-- Atualiza o campo description das tarefas ja existentes (nao recria nada)
-- ============================================================

UPDATE tasks SET description = '[D-18] Fortalecer política de senha e proteção contra força bruta

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
O cadastro hoje aceita qualquer senha com 8+ caracteres. A tabela audit_logs já registra LOGIN_FAILED mas nada consome esse dado para travar a conta.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\backend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-18-senha-forte-bloqueio-bruteforce
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- backend/app/Http/Requests/Auth/RegisterRequest.php
- backend/app/Http/Controllers/Api/AuthController.php (método login)
- backend/app/Models/AuditLog.php

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] RegisterRequest usa Illuminate\Validation\Rules\Password exigindo maiúscula, minúscula, número e símbolo
- [ ] Cadastro com senha fraca (ex: 12345678, senha123) é rejeitado com mensagem explicando o requisito
- [ ] 5 tentativas de login falhas para o mesmo e-mail em menos de 10 minutos (consultando audit_logs) bloqueiam novas tentativas por 15 minutos, mesmo trocando de IP
- [ ] Teste Feature Laravel cobrindo: cadastro com senha fraca e o bloqueio por tentativas

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "fix(D-18): politica de senha forte e bloqueio por forca bruta"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-18]%' LIMIT 1;

UPDATE tasks SET description = '[D-19] Publicar Termos de Uso e Política de Privacidade com aceite no cadastro

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/) + Angular (frontend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Não existem páginas de Termos de Uso ou Política de Privacidade — os links do rodapé apontam para href="#". IMPORTANTE: o CONTEÚDO jurídico dos textos precisa ser escrito/revisado por advogado — esta demanda é só a implementação técnica (páginas, checkbox, persistência). Use um texto placeholder claro indicando "conteúdo a revisar juridicamente" no lugar do texto final.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\backend
   cd C:\Users\claudia\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-19-termos-privacidade
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- CRIAR: frontend/src/app/features/legal/termos-de-uso/ (rota pública /termos-de-uso)
- CRIAR: frontend/src/app/features/legal/politica-de-privacidade/ (rota pública /politica-de-privacidade)
- frontend/src/app/features/auth/register/register.html (adicionar checkbox de aceite obrigatório)
- backend/app/Http/Requests/Auth/RegisterRequest.php (adicionar validação do campo terms_accepted)
- backend/app/Http/Controllers/Api/AuthController.php (método register, salvar terms_accepted_at e terms_version)
- CRIAR migration adicionando terms_accepted_at (timestamp) e terms_version (string) na tabela users
- frontend/src/app/shared/components/molecules/layout/footer/ (corrigir os links do rodapé)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Páginas /termos-de-uso e /politica-de-privacidade acessíveis publicamente (sem login)
- [ ] Links do rodapé apontam para essas páginas em vez de href="#"
- [ ] Cadastro sem marcar o checkbox de aceite é rejeitado com 422 e mensagem clara
- [ ] Cadastro bem-sucedido grava terms_accepted_at e terms_version no usuário
- [ ] Migration adicionando os dois campos criada

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-19): termos de uso, politica de privacidade e aceite no cadastro"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-19]%' LIMIT 1;

UPDATE tasks SET description = '[D-20] Banner de consentimento de cookies

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Angular (frontend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Não existe nenhum aviso de cookies no site. Implementar de forma simples, sem biblioteca de terceiros pesada.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-20-banner-cookies
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- CRIAR: frontend/src/app/shared/components/molecules/feedback/cookie-banner/ (componente novo)
- frontend/src/app/app.ts (incluir o componente globalmente)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Banner aparece na primeira visita de um navegador novo (sem cookie/localStorage prévio)
- [ ] Botão "Aceitar" e link para a Política de Privacidade (rota criada na D-19)
- [ ] Após aceitar, escolha persiste em localStorage e o banner não reaparece em visitas seguintes
- [ ] Banner não bloqueia o uso do site (usuário pode navegar mesmo sem interagir com ele)

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-20): banner de consentimento de cookies"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-20]%' LIMIT 1;

UPDATE tasks SET description = '[D-28] Implementar cobrança recorrente via Asaas

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/) + Angular (frontend/).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Portar a integração já validada no projeto Votar (PagamentoAsaasControlador) para o EduCore. Ver MULTITENANT-BILLING.md seção 4 para o fluxo completo já desenhado.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\backend
   cd C:\Users\UITEC\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-28-cobranca-asaas
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- MULTITENANT-BILLING.md (seção 4, LEIA PRIMEIRO)
- Projeto Votar (referência do PagamentoAsaasControlador já validado em produção — peça o caminho exato se não souber onde fica)
- CRIAR: backend/database/migrations/..._create_subscriptions_table.php e ..._create_payments_table.php
- CRIAR: backend/app/Http/Controllers/Api/BillingController.php
- backend/routes/api.php (POST /billing/subscribe, GET /billing/subscription, POST /billing/cancel, GET /plans, POST /webhooks/asaas)
- CRIAR: frontend/src/app/features/pricing/ (página /precos) e frontend/src/app/features/account/subscription/ (/conta/assinatura)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Usuário assina um plano pago, é redirecionado ao checkout do Asaas, e a assinatura é ativada automaticamente após confirmação via webhook
- [ ] Reenvio duplicado do mesmo webhook do Asaas NÃO gera cobrança nem ativação duplicada (idempotência via gateway_payment_id único)
- [ ] Cancelamento mantém acesso até o fim do período já pago, não corta na hora
- [ ] Página /precos no ar publicamente, refletindo os planos reais cadastrados no banco
- [ ] NUNCA armazenar dados de cartão — só IDs de referência do gateway
- [ ] Teste Feature Laravel simulando os principais eventos de webhook (confirmado, atrasado, cancelado)

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-28): cobranca recorrente via Asaas"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-28]%' LIMIT 1;

UPDATE tasks SET description = '[D-32] Compressão de PDFs grandes antes do processamento

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Python/FastAPI (ai-service/).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
PDFs grandes (>10MB) hoje vão inteiros para o LlamaParse (cobrado por página) sem nenhuma otimização.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\ai-service
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-32-compressao-pdfs
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- ai-service/app/services/pdf_service.py (PyMuPDF já é dependência do projeto)
- ai-service/app/core/config.py (adicionar PDF_COMPRESSION_THRESHOLD_MB, default 10)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] PDFs acima do limiar configurável são comprimidos (deflate_images=True, ~72dpi) antes de salvar e processar
- [ ] Se a compressão falhar por qualquer motivo, segue com o arquivo original (nunca trava o upload)
- [ ] PDF já pequeno (abaixo do limiar) não é tocado
- [ ] Log mostra tamanho antes/depois e a razão de compressão

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-32): compressao automatica de PDFs grandes"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-32]%' LIMIT 1;

-- Verificacao: confirme que todas as descricoes desta sprint foram atualizadas (buscar pelo novo cabecalho "CONTEXTO DO PROJETO")
SELECT id, LEFT(description, 60) AS inicio FROM tasks WHERE board_id = 7 AND sprint_id = (SELECT id FROM sprints WHERE board_id = 7 AND name LIKE 'Sprint 5 -%' LIMIT 1) ORDER BY id;