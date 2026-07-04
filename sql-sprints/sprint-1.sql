-- ============================================================
-- EduCore — Sprint 1: descricoes enriquecidas em formato de prompt
-- Atualiza o campo description das tarefas ja existentes (nao recria nada)
-- ============================================================

UPDATE tasks SET description = '[D-01] Finalizar sistema de Turmas de ponta a ponta

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/) + Angular (frontend/, tela já existe).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
O frontend Angular já tem a tela /turmas completa (cards de turma, dialog de criação, sidebar de matrícula de alunos) em frontend/src/app/features/classes/, e o service frontend/src/app/core/services/classes.service.ts já chama rotas /classes que NÃO existem no Laravel. Você vai criar o backend compatível com o que o frontend já espera — NÃO altere o frontend.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\backend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-01-turmas-completo
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- frontend/src/app/core/services/classes.service.ts (LEIA PRIMEIRO — mostra exatamente as rotas e payloads esperados: GET/POST /classes, GET /classes/{id}/students, POST /classes/{id}/enroll, DELETE /classes/{id}/enroll/{userId})
- backend/routes/api.php (adicionar as novas rotas, protegidas por auth:sanctum)
- backend/app/Models/User.php (referência de como os relacionamentos são definidos no projeto)
- CRIAR: backend/database/migrations/..._create_classes_table.php
- CRIAR: backend/database/migrations/..._create_class_user_table.php (pivot)
- CRIAR: backend/app/Models/EduClass.php (NUNCA nomeie "Class" — é palavra reservada no PHP)
- CRIAR: backend/app/Http/Controllers/Api/ClassController.php

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Migration classes criada (id, name, description, professor_id, timestamps, soft deletes)
- [ ] Migration class_user criada (pivot class_id/user_id, unique)
- [ ] Model EduClass com belongsTo(Professor) e belongsToMany(Students)
- [ ] ClassController com: index (turmas do professor autenticado), store, show (com alunos matriculados), update, destroy (soft delete), enroll, unenroll
- [ ] Rota GET /admin/classes retorna todas as turmas de todos os professores (admin only)
- [ ] Professor A não vê/edita/matricula em turma do Professor B (testar com 2 contas)
- [ ] Teste Feature Laravel cobrindo: criar turma, matricular aluno, isolamento entre professores, tentativa sem autenticação (401)
- [ ] Testado manualmente na tela /turmas sem nenhum erro 404 no console do navegador

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-01): finalizar backend de turmas (classes)"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-01]%' LIMIT 1;

UPDATE tasks SET description = '[D-02] Finalizar fluxo de recuperação de senha

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/) + Angular (frontend/, tela parcial já existe).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
A tela /esqueci-senha já existe no frontend e envia POST /auth/forgot-password, rota que NÃO existe no Laravel. A tabela password_reset_tokens já existe (migration padrão do Laravel) mas está órfã, nenhum código a usa.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\backend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-02-recuperar-senha
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- backend/routes/api.php (adicionar POST /auth/forgot-password e POST /auth/reset-password, dentro do prefix auth, SEM auth:sanctum pois o usuário não está logado)
- backend/app/Http/Controllers/Api/AuthController.php (seguir o mesmo padrão dos métodos existentes: register, login)
- backend/database/migrations/0001_01_01_000000_create_users_table.php (LEIA — mostra a tabela password_reset_tokens já existente: email, token, created_at)
- frontend/src/app/features/auth/forgot-password/ (tela já existe, chama POST /auth/forgot-password — não precisa mexer nela)
- CRIAR no frontend: tela /redefinir-senha (formulário de nova senha + confirmação) — ainda não existe, só existe a tela que pede o e-mail
- Usar o sistema de fila já existente (QUEUE_CONNECTION=database) para o envio do e-mail — não bloquear a resposta HTTP esperando o SMTP

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] POST /auth/forgot-password gera token, envia e-mail com link assinado para /redefinir-senha?token=...
- [ ] POST /auth/reset-password recebe token + nova senha, valida e atualiza a senha do usuário
- [ ] Token expira em 60 minutos e é de uso único (invalidado após o uso)
- [ ] E-mail de reset enviado via fila (não bloqueia a resposta da API)
- [ ] Resposta de POST /auth/forgot-password NUNCA revela se o e-mail existe ou não na base (sempre sucesso genérico, evita enumeração de usuários)
- [ ] Tela /redefinir-senha criada no frontend com formulário de nova senha + confirmação
- [ ] Teste Feature Laravel: solicitar reset, validar token, redefinir senha, confirmar login com a nova senha, confirmar que o token usado não funciona duas vezes

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-02): fluxo completo de recuperação de senha"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-02]%' LIMIT 1;

UPDATE tasks SET description = '[D-03] Finalizar edição de perfil (nome e avatar)

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
A tela de perfil do frontend (frontend/src/app/features/profile/profile.ts) já envia POST /profile (FormData com name e avatar), rota que NÃO existe no Laravel.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\backend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-03-editar-perfil
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- frontend/src/app/features/profile/profile.ts (LEIA — linha ~103, mostra exatamente o formato esperado da resposta: { user: { id, name, email, avatar, role } })
- backend/routes/api.php (adicionar POST /profile, protegida por auth:sanctum)
- backend/app/Http/Controllers/Api/AuthController.php (seguir o padrão de validação já usado nos outros métodos)
- backend/app/Models/User.php (campo avatar já existe no model, conferir)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] POST /profile atualiza name e faz upload de avatar (storage/app/public/avatars, link simbólico público padrão do Laravel)
- [ ] Upload de avatar rejeita arquivos que não sejam imagem (jpg/png/webp) e maiores que 2MB, com mensagem de erro clara
- [ ] Avatar antigo é removido do storage ao enviar um novo (evita acúmulo de arquivos órfãos)
- [ ] Mudança persiste após logout/login
- [ ] Teste Feature Laravel cobrindo: atualização de nome, upload de avatar válido, rejeição de arquivo inválido

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-03): endpoint de edição de perfil (nome e avatar)"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-03]%' LIMIT 1;

UPDATE tasks SET description = '[D-04] Finalizar notificações in-app (sino do header)

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/) + Angular (frontend/, sino já existe) + ai-service (pequena chamada webhook).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
O componente do sino de notificações já existe no header do frontend, com badge e dropdown, chamando GET /api/notifications, GET /api/notifications/unread-count, PATCH /api/notifications/{id}/read e PATCH /api/notifications/read-all — nenhuma rota existe hoje.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\backend
   cd C:\Users\UITEC\Herd\educore\ai-service
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-04-notificacoes-in-app
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- backend/routes/api.php (adicionar as 4 rotas, protegidas por auth:sanctum)
- CRIAR: backend/database/migrations/..._create_notifications_table.php (id, user_id, type, title, body, data JSON, read_at, timestamps)
- CRIAR: backend/app/Models/Notification.php
- CRIAR: backend/app/Http/Controllers/Api/NotificationController.php
- CRIAR: backend/app/Services/NotificationService.php (método send($userId, $type, $title, $body, $data), injetável em outros controllers)
- ai-service/app/services/rag_service.py (adicionar chamada HTTP simples para o Laravel avisando quando o processamento de um documento terminar — usar uma chave interna simples de autenticação, não precisa de HMAC sofisticado)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Migration notifications criada e NotificationController com os 4 endpoints funcionando
- [ ] NotificationService::send() é chamado de verdade quando o processamento de PDF termina (integração real com o ai-service, não apenas mock)
- [ ] Badge do sino mostra a contagem real de não lidas (polling a cada 30s no frontend, já implementado)
- [ ] Marcar como lida (individual e "marcar todas") funciona e persiste
- [ ] Teste Feature Laravel cobrindo: criação, listagem paginada, marcação de leitura, isolamento (usuário não vê notificação de outro)

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-04): backend de notificacoes in-app + integracao com ai-service"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-04]%' LIMIT 1;

UPDATE tasks SET description = '[D-09] Corrigir bloqueio administrativo de usuários

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Laravel (backend/).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Hoje, quando um admin "bloqueia" um usuário em /admin/usuarios (PATCH /admin/users/{id}/status), o backend só zera email_verified_at — o token Sanctum do usuário continua válido, ele segue usando a plataforma normalmente. Pior: ao clicar no link de verificação de e-mail que já possui, verifyEmail() reativa a conta automaticamente, sem checar se foi bloqueada por um admin.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\backend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-09-corrigir-bloqueio-usuario
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- backend/app/Http/Controllers/Api/AdminController.php (método updateStatus)
- backend/app/Http/Controllers/Api/AuthController.php (métodos login, me, verify, verifyEmail)
- backend/app/Models/User.php
- CRIAR migration adicionando coluna status (enum: active/blocked) na tabela users, separada de email_verified_at

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Coluna status (active/blocked) criada em users, separada de email_verified_at (que volta a significar só "e-mail confirmado")
- [ ] Ao bloquear (status=blocked), TODOS os personal_access_tokens do usuário são revogados imediatamente ($user->tokens()->delete())
- [ ] Login, /me e /verify rejeitam usuários com status=blocked com 403 e mensagem clara
- [ ] verifyEmail() NUNCA reativa um usuário com status=blocked
- [ ] Admin desbloqueia (status=active) e o usuário volta a autenticar normalmente
- [ ] Teste Feature Laravel cobrindo: bloquear usuário logado e confirmar que o token dele para de funcionar na chamada seguinte; tentar login bloqueado; tentar reativar via link de verificação estando bloqueado

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "fix(D-09): bloqueio administrativo revoga token e impede reativacao"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-09]%' LIMIT 1;

UPDATE tasks SET description = '[D-15] Validar arquivos por conteúdo real no upload de PDF

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Python/FastAPI (ai-service/).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
O ai-service valida upload de PDF apenas pela extensão do nome do arquivo (.pdf), sem checar o conteúdo real. Qualquer arquivo renomeado para .pdf passa direto para o PyMuPDF/LlamaParse.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\ai-service
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-15-validar-magic-bytes-pdf
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- ai-service/app/routers/documents.py (endpoint de upload, por volta da linha 92)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Checagem dos primeiros bytes do arquivo recebido (file.read(5) == b''%PDF-'') antes de salvar e processar
- [ ] Upload de arquivo .txt renomeado para .pdf é rejeitado com 400 e mensagem clara, sem chegar a acionar o pipeline (sem custo de LlamaParse/Gemini)
- [ ] Upload de PDF real continua funcionando normalmente
- [ ] Teste automatizado (pytest) cobrindo ambos os casos

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "fix(D-15): validar PDF por magic bytes, nao so extensao"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.
5. 📓 Atualize DOIS lugares com o que mudou nesta demanda:
         a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
         b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)' WHERE board_id = 7 AND description LIKE '[D-15]%' LIMIT 1;

-- Verificacao: confirme que todas as descricoes desta sprint foram atualizadas (buscar pelo novo cabecalho "CONTEXTO DO PROJETO")
SELECT id, LEFT(description, 60) AS inicio FROM tasks WHERE board_id = 7 AND sprint_id = (SELECT id FROM sprints WHERE board_id = 7 AND name LIKE 'Sprint 1 -%' LIMIT 1) ORDER BY id;