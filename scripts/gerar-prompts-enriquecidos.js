const fs = require('fs');
const path = require('path');

const BOARD_ID = 7;
const FERNANDO_ID = 1;
const CLAUDIA_ID = 2;
const PATH_FERNANDO = 'C:\\Users\\UITEC\\Herd';
const PATH_CLAUDIA = 'C:\\Users\\claudia\\Herd';

const STACK_HEADER = `Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001`;

const NUNCA_ASSUMA = `⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".`;

const CADERNO_ANTES = `📓 CADERNO DO PROJETO (contexto vivo, fonte única de verdade):
Antes de começar, abra a tarefa "[META-01] Contexto do Projeto para IA (CLAUDE.md)" neste mesmo quadro do Avante, aba "Caderno", e cole o conteúdo dela junto com esta descrição no prompt da sua IA. Isso garante que ela já entende a arquitetura, as convenções e o estado atual do projeto sem você precisar reexplicar do zero — economiza tempo e tokens.`;

function cadernoDepois(semCodigo) {
  if (semCodigo) {
    return `📓 Ao terminar, atualize o Caderno da tarefa "[META-01]" no Avante com o que foi feito/decidido nesta demanda (mantém o time sincronizado mesmo sem abrir o repositório).`;
  }
  return `📓 Atualize DOIS lugares com o que mudou nesta demanda:
      a. O arquivo CLAUDE.md na raiz do repositório (commitar junto com o código desta demanda)
      b. O Caderno da tarefa "[META-01]" aqui no Avante (mantém o time sincronizado mesmo sem abrir o repositório)`;
}

function gitSteps(basePath, pastas, branch, extraDidatico) {
  const cds = pastas.map(p => `cd ${basePath}\\educore\\${p}`).join('\n   ');
  let txt = `🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. ${cds}
3. git checkout main
4. git pull origin main
5. git checkout -b ${branch}
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.`;
  if (extraDidatico) {
    txt += `

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.`;
  }
  return txt;
}

function checklist(criterios) {
  return criterios.map(c => `- [ ] ${c}`).join('\n');
}

function montarDescricao(d, userId) {
  const isClaudia = userId === CLAUDIA_ID;
  const basePath = isClaudia ? PATH_CLAUDIA : PATH_FERNANDO;
  const partes = [];

  partes.push(`[${d.codigo}] ${d.titulo}`);
  partes.push('');
  partes.push('📖 CONTEXTO DO PROJETO:');
  partes.push(STACK_HEADER);
  partes.push('');
  partes.push(`Esta demanda envolve: ${d.servicos}.`);
  partes.push(`Seu ambiente de trabalho local: ${basePath}\\educore`);
  partes.push('');
  partes.push('📂 ONDE ISSO SE ENCAIXA:');
  partes.push(d.ondeSeEncaixa);
  partes.push('');

  const semCodigo = d.pastas.length === 0;

  if (semCodigo) {
    partes.push('ℹ️ Esta demanda é de marketing/negócio, não gera código — não há passo de Git/branch/PR. Execução e evidência (prints, vídeos, links) devem ser registradas diretamente no card desta tarefa no Avante.');
  } else {
    partes.push(gitSteps(basePath, d.pastas, d.branch, isClaudia));
  }
  partes.push('');
  partes.push(NUNCA_ASSUMA);
  partes.push('');
  partes.push(CADERNO_ANTES);
  partes.push('');
  partes.push('📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:');
  d.arquivos.forEach(a => partes.push(`- ${a}`));
  partes.push('');
  partes.push('📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):');
  partes.push(checklist(d.criterios));

  if (!semCodigo) {
    partes.push('');
    partes.push('🚀 QUANDO TERMINAR:');
    partes.push('1. git add .');
    partes.push(`2. git commit -m "${d.commitMsg}"`);
    partes.push('3. git push -u origin HEAD');
    partes.push('4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.');
    partes.push('5. ' + cadernoDepois(false).replace(/\n   /g, '\n      '));
  } else {
    partes.push('');
    partes.push(cadernoDepois(true));
  }

  return partes.join('\n');
}

// ============================================================
// DADOS: sprint, responsável e conteúdo tecnico de cada demanda
// ============================================================
const D = {};

D['D-01'] = {
  titulo: 'Finalizar sistema de Turmas de ponta a ponta',
  sprint: 1, user: CLAUDIA_ID,
  servicos: 'Laravel (backend/) + Angular (frontend/, tela já existe)',
  pastas: ['backend'],
  branch: 'feature/d-01-turmas-completo',
  ondeSeEncaixa: 'O frontend Angular já tem a tela /turmas completa (cards de turma, dialog de criação, sidebar de matrícula de alunos) em frontend/src/app/features/classes/, e o service frontend/src/app/core/services/classes.service.ts já chama rotas /classes que NÃO existem no Laravel. Você vai criar o backend compatível com o que o frontend já espera — NÃO altere o frontend.',
  arquivos: [
    'frontend/src/app/core/services/classes.service.ts (LEIA PRIMEIRO — mostra exatamente as rotas e payloads esperados: GET/POST /classes, GET /classes/{id}/students, POST /classes/{id}/enroll, DELETE /classes/{id}/enroll/{userId})',
    'backend/routes/api.php (adicionar as novas rotas, protegidas por auth:sanctum)',
    'backend/app/Models/User.php (referência de como os relacionamentos são definidos no projeto)',
    'CRIAR: backend/database/migrations/..._create_classes_table.php',
    'CRIAR: backend/database/migrations/..._create_class_user_table.php (pivot)',
    'CRIAR: backend/app/Models/EduClass.php (NUNCA nomeie "Class" — é palavra reservada no PHP)',
    'CRIAR: backend/app/Http/Controllers/Api/ClassController.php',
  ],
  criterios: [
    'Migration classes criada (id, name, description, professor_id, timestamps, soft deletes)',
    'Migration class_user criada (pivot class_id/user_id, unique)',
    'Model EduClass com belongsTo(Professor) e belongsToMany(Students)',
    'ClassController com: index (turmas do professor autenticado), store, show (com alunos matriculados), update, destroy (soft delete), enroll, unenroll',
    'Rota GET /admin/classes retorna todas as turmas de todos os professores (admin only)',
    'Professor A não vê/edita/matricula em turma do Professor B (testar com 2 contas)',
    'Teste Feature Laravel cobrindo: criar turma, matricular aluno, isolamento entre professores, tentativa sem autenticação (401)',
    'Testado manualmente na tela /turmas sem nenhum erro 404 no console do navegador',
  ],
  commitMsg: 'feat(D-01): finalizar backend de turmas (classes)',
};

D['D-02'] = {
  titulo: 'Finalizar fluxo de recuperação de senha',
  sprint: 1, user: CLAUDIA_ID,
  servicos: 'Laravel (backend/) + Angular (frontend/, tela parcial já existe)',
  pastas: ['backend'],
  branch: 'feature/d-02-recuperar-senha',
  ondeSeEncaixa: 'A tela /esqueci-senha já existe no frontend e envia POST /auth/forgot-password, rota que NÃO existe no Laravel. A tabela password_reset_tokens já existe (migration padrão do Laravel) mas está órfã, nenhum código a usa.',
  arquivos: [
    'backend/routes/api.php (adicionar POST /auth/forgot-password e POST /auth/reset-password, dentro do prefix auth, SEM auth:sanctum pois o usuário não está logado)',
    'backend/app/Http/Controllers/Api/AuthController.php (seguir o mesmo padrão dos métodos existentes: register, login)',
    'backend/database/migrations/0001_01_01_000000_create_users_table.php (LEIA — mostra a tabela password_reset_tokens já existente: email, token, created_at)',
    'frontend/src/app/features/auth/forgot-password/ (tela já existe, chama POST /auth/forgot-password — não precisa mexer nela)',
    'CRIAR no frontend: tela /redefinir-senha (formulário de nova senha + confirmação) — ainda não existe, só existe a tela que pede o e-mail',
    'Usar o sistema de fila já existente (QUEUE_CONNECTION=database) para o envio do e-mail — não bloquear a resposta HTTP esperando o SMTP',
  ],
  criterios: [
    'POST /auth/forgot-password gera token, envia e-mail com link assinado para /redefinir-senha?token=...',
    'POST /auth/reset-password recebe token + nova senha, valida e atualiza a senha do usuário',
    'Token expira em 60 minutos e é de uso único (invalidado após o uso)',
    'E-mail de reset enviado via fila (não bloqueia a resposta da API)',
    'Resposta de POST /auth/forgot-password NUNCA revela se o e-mail existe ou não na base (sempre sucesso genérico, evita enumeração de usuários)',
    'Tela /redefinir-senha criada no frontend com formulário de nova senha + confirmação',
    'Teste Feature Laravel: solicitar reset, validar token, redefinir senha, confirmar login com a nova senha, confirmar que o token usado não funciona duas vezes',
  ],
  commitMsg: 'feat(D-02): fluxo completo de recuperação de senha',
};

D['D-03'] = {
  titulo: 'Finalizar edição de perfil (nome e avatar)',
  sprint: 1, user: CLAUDIA_ID,
  servicos: 'Laravel (backend/)',
  pastas: ['backend'],
  branch: 'feature/d-03-editar-perfil',
  ondeSeEncaixa: 'A tela de perfil do frontend (frontend/src/app/features/profile/profile.ts) já envia POST /profile (FormData com name e avatar), rota que NÃO existe no Laravel.',
  arquivos: [
    'frontend/src/app/features/profile/profile.ts (LEIA — linha ~103, mostra exatamente o formato esperado da resposta: { user: { id, name, email, avatar, role } })',
    'backend/routes/api.php (adicionar POST /profile, protegida por auth:sanctum)',
    'backend/app/Http/Controllers/Api/AuthController.php (seguir o padrão de validação já usado nos outros métodos)',
    'backend/app/Models/User.php (campo avatar já existe no model, conferir)',
  ],
  criterios: [
    'POST /profile atualiza name e faz upload de avatar (storage/app/public/avatars, link simbólico público padrão do Laravel)',
    'Upload de avatar rejeita arquivos que não sejam imagem (jpg/png/webp) e maiores que 2MB, com mensagem de erro clara',
    'Avatar antigo é removido do storage ao enviar um novo (evita acúmulo de arquivos órfãos)',
    'Mudança persiste após logout/login',
    'Teste Feature Laravel cobrindo: atualização de nome, upload de avatar válido, rejeição de arquivo inválido',
  ],
  commitMsg: 'feat(D-03): endpoint de edição de perfil (nome e avatar)',
};

D['D-04'] = {
  titulo: 'Finalizar notificações in-app (sino do header)',
  sprint: 1, user: FERNANDO_ID,
  servicos: 'Laravel (backend/) + Angular (frontend/, sino já existe) + ai-service (pequena chamada webhook)',
  pastas: ['backend', 'ai-service'],
  branch: 'feature/d-04-notificacoes-in-app',
  ondeSeEncaixa: 'O componente do sino de notificações já existe no header do frontend, com badge e dropdown, chamando GET /api/notifications, GET /api/notifications/unread-count, PATCH /api/notifications/{id}/read e PATCH /api/notifications/read-all — nenhuma rota existe hoje.',
  arquivos: [
    'backend/routes/api.php (adicionar as 4 rotas, protegidas por auth:sanctum)',
    'CRIAR: backend/database/migrations/..._create_notifications_table.php (id, user_id, type, title, body, data JSON, read_at, timestamps)',
    'CRIAR: backend/app/Models/Notification.php',
    'CRIAR: backend/app/Http/Controllers/Api/NotificationController.php',
    'CRIAR: backend/app/Services/NotificationService.php (método send($userId, $type, $title, $body, $data), injetável em outros controllers)',
    'ai-service/app/services/rag_service.py (adicionar chamada HTTP simples para o Laravel avisando quando o processamento de um documento terminar — usar uma chave interna simples de autenticação, não precisa de HMAC sofisticado)',
  ],
  criterios: [
    'Migration notifications criada e NotificationController com os 4 endpoints funcionando',
    'NotificationService::send() é chamado de verdade quando o processamento de PDF termina (integração real com o ai-service, não apenas mock)',
    'Badge do sino mostra a contagem real de não lidas (polling a cada 30s no frontend, já implementado)',
    'Marcar como lida (individual e "marcar todas") funciona e persiste',
    'Teste Feature Laravel cobrindo: criação, listagem paginada, marcação de leitura, isolamento (usuário não vê notificação de outro)',
  ],
  commitMsg: 'feat(D-04): backend de notificacoes in-app + integracao com ai-service',
};

D['D-05'] = {
  titulo: 'Finalizar fórum de discussão',
  sprint: 2, user: CLAUDIA_ID,
  servicos: 'Laravel (backend/)',
  pastas: ['backend'],
  branch: 'feature/d-05-forum-discussao',
  ondeSeEncaixa: 'A tela /admin/forum já existe com lista de tópicos, criação, thread de respostas e paginação — visualmente parece pronta, mas NÃO existe ForumController nem as tabelas forum_topics/forum_replies no banco. Toda chamada hoje retorna 404.',
  arquivos: [
    'frontend/src/app/features/admin/forum/forum.ts e forum.service.ts (LEIA — mostra exatamente as rotas e payloads esperados)',
    'backend/routes/api.php (adicionar as rotas de fórum)',
    'CRIAR: backend/database/migrations/..._create_forum_topics_table.php (id, user_id, title, body, replies_count, last_reply_at, timestamps, soft delete)',
    'CRIAR: backend/database/migrations/..._create_forum_replies_table.php (id, topic_id, user_id, body, timestamps, soft delete)',
    'CRIAR: backend/app/Models/ForumTopic.php e backend/app/Models/ForumReply.php',
    'CRIAR: backend/app/Http/Controllers/Api/ForumController.php',
  ],
  criterios: [
    'GET/POST /forum/topics e GET/POST /forum/topics/{id}/replies funcionando com paginação',
    'Qualquer usuário autenticado cria tópico, responde, e vê a lista paginada com contagem de respostas e última atividade',
    'Autor exclui seu próprio tópico/resposta (soft delete); outro usuário comum não consegue (403); admin exclui qualquer um',
    'Teste Feature Laravel cobrindo: criação de tópico, resposta, paginação, regra de exclusão',
    'Testado manualmente em /admin/forum sem nenhum erro 404',
  ],
  commitMsg: 'feat(D-05): backend completo do forum de discussao',
};

D['D-06'] = {
  titulo: 'Descontinuar o Chat interno da área administrativa',
  sprint: 2, user: CLAUDIA_ID,
  servicos: 'Angular (frontend/, só remoção)',
  pastas: ['frontend'],
  branch: 'feature/d-06-remover-chat-interno',
  ondeSeEncaixa: 'O chat em /admin/chat tem frontend com polling a cada 3s, mas o próprio código já tem um comentário admitindo que o backend nunca foi feito. É comunicação interna da equipe, não uma feature do cliente final — decisão é descontinuar por ora, não terminar o backend.',
  arquivos: [
    'frontend/src/app/app.routes.ts (remover a rota /admin/chat)',
    'frontend/src/app/features/admin/chat/ (NÃO DELETAR os arquivos, só remover do menu e da navegação — pode ser retomado no futuro)',
    'Procure o link/item de menu "Chat" no componente de navegação admin e remova',
  ],
  criterios: [
    'Menu admin não exibe mais link para "Chat"',
    'Rota /admin/chat não existe mais em app.routes.ts (acesso direto pela URL não deve renderizar a tela de chat)',
    'Nenhum erro de console relacionado a polling de chat aparece mais em nenhuma tela',
    'Componente chat.ts continua no repositório (não foi deletado), só desconectado da navegação',
  ],
  commitMsg: 'chore(D-06): remover chat interno do menu admin (backend nunca foi feito)',
};

D['D-07'] = {
  titulo: 'Exibir botão de exportação para Google Slides',
  sprint: 2, user: CLAUDIA_ID,
  servicos: 'Angular (frontend/, o backend no ai-service já existe e funciona)',
  pastas: ['frontend'],
  branch: 'feature/d-07-botao-google-slides',
  ondeSeEncaixa: 'O ai-service JÁ TEM a integração funcional com o Google Slides (função _try_google_slides() em ai-service/app/routers/documents.py, que já roda automaticamente ao gerar slides e salva google_slides_url na resposta da geração) — mas não existe nenhum botão no frontend pra usar isso.',
  arquivos: [
    'frontend/src/app/features/result/types/slides/ (tela de resultado de slides, adicionar o botão aqui)',
    'frontend/src/app/core/services/ai.service.ts (conferir se o tipo de retorno da geração já inclui google_slides_url; se não, adicionar ao tipo em core/types/)',
  ],
  criterios: [
    'Botão "Abrir no Google Slides" aparece na tela de resultado de slides quando google_slides_url vier preenchido na resposta',
    'Clicar no botão abre o link em nova aba',
    'Se google_slides_url vier vazio (usuário não logou via Google, ou a chamada falhou no backend), o botão NÃO aparece e nenhum erro é mostrado ao usuário — é um recurso opcional',
    'Testado manualmente: gerar slides logado via Google (botão aparece e funciona) e gerar slides logado por email/senha (botão não aparece, sem erro)',
  ],
  commitMsg: 'feat(D-07): botao de exportacao para Google Slides na tela de resultado',
};

D['D-08'] = {
  titulo: 'Remover código morto de SSE no upload',
  sprint: 3, user: CLAUDIA_ID,
  servicos: 'Angular (frontend/, só limpeza)',
  pastas: ['frontend'],
  branch: 'feature/d-08-remover-sse-morto',
  ondeSeEncaixa: 'O componente de upload tenta usar EventSource para conectar em GET /documents/{id}/stream, endpoint que nunca foi implementado no ai-service. Na prática, todo upload sempre cai no fallback de polling de 2s já programado no mesmo componente, e funciona bem assim.',
  arquivos: [
    'frontend/src/app/features/panel/panel.ts (localizar a lógica de EventSource e o fallback de polling, remover só a tentativa de EventSource, manter o polling)',
  ],
  criterios: [
    'Upload de PDF continua mostrando progresso em tempo real (via polling) sem regressão visual ou funcional',
    'Nenhuma tentativa de conexão a /documents/{id}/stream aparece mais no código nem no console do navegador',
    'Testado manualmente: fazer upload de um PDF e confirmar que a barra de progresso funciona normalmente do início ao fim',
  ],
  commitMsg: 'chore(D-08): remover codigo morto de EventSource/SSE, manter so polling',
};

D['D-09'] = {
  titulo: 'Corrigir bloqueio administrativo de usuários',
  sprint: 1, user: FERNANDO_ID,
  servicos: 'Laravel (backend/)',
  pastas: ['backend'],
  branch: 'feature/d-09-corrigir-bloqueio-usuario',
  ondeSeEncaixa: 'Hoje, quando um admin "bloqueia" um usuário em /admin/usuarios (PATCH /admin/users/{id}/status), o backend só zera email_verified_at — o token Sanctum do usuário continua válido, ele segue usando a plataforma normalmente. Pior: ao clicar no link de verificação de e-mail que já possui, verifyEmail() reativa a conta automaticamente, sem checar se foi bloqueada por um admin.',
  arquivos: [
    'backend/app/Http/Controllers/Api/AdminController.php (método updateStatus)',
    'backend/app/Http/Controllers/Api/AuthController.php (métodos login, me, verify, verifyEmail)',
    'backend/app/Models/User.php',
    'CRIAR migration adicionando coluna status (enum: active/blocked) na tabela users, separada de email_verified_at',
  ],
  criterios: [
    'Coluna status (active/blocked) criada em users, separada de email_verified_at (que volta a significar só "e-mail confirmado")',
    'Ao bloquear (status=blocked), TODOS os personal_access_tokens do usuário são revogados imediatamente ($user->tokens()->delete())',
    'Login, /me e /verify rejeitam usuários com status=blocked com 403 e mensagem clara',
    'verifyEmail() NUNCA reativa um usuário com status=blocked',
    'Admin desbloqueia (status=active) e o usuário volta a autenticar normalmente',
    'Teste Feature Laravel cobrindo: bloquear usuário logado e confirmar que o token dele para de funcionar na chamada seguinte; tentar login bloqueado; tentar reativar via link de verificação estando bloqueado',
  ],
  commitMsg: 'fix(D-09): bloqueio administrativo revoga token e impede reativacao',
};

D['D-10'] = {
  titulo: 'Configurar CORS explícito no backend Laravel',
  sprint: 3, user: CLAUDIA_ID,
  servicos: 'Laravel (backend/)',
  pastas: ['backend'],
  branch: 'feature/d-10-cors-explicito',
  ondeSeEncaixa: 'Não existe config/cors.php no projeto. O Laravel 13 usa o middleware HandleCors por padrão, mas sem esse arquivo cors.paths fica vazio e nenhuma resposta recebe Access-Control-Allow-Origin.',
  arquivos: [
    'CRIAR: backend/config/cors.php',
    'backend/.env.example (documentar a nova variável)',
  ],
  criterios: [
    'config/cors.php criado com paths => [\'api/*\'], allowed_origins vindo de env(\'CORS_ALLOWED_ORIGINS\') (separado por vírgula), allowed_methods => [\'*\'], allowed_headers => [\'*\'], supports_credentials => true',
    'Requisição de origem NÃO listada em CORS_ALLOWED_ORIGINS recebe erro de CORS no navegador',
    'Frontend local (localhost:4200) volta a funcionar contra o backend sem configuração manual extra',
    '.env.example documenta CORS_ALLOWED_ORIGINS com exemplo de valor para dev e produção',
  ],
  commitMsg: 'fix(D-10): configurar CORS explicito no Laravel',
};

D['D-11'] = {
  titulo: 'Eliminar credencial de admin hardcoded',
  sprint: 3, user: CLAUDIA_ID,
  servicos: 'Laravel (backend/)',
  pastas: ['backend'],
  branch: 'feature/d-11-remover-seeder-hardcoded',
  ondeSeEncaixa: 'backend/database/seeders/AdminSeeder.php cria/atualiza admin@educore.test com senha Admin@123! em texto plano no código-fonte, condicionado a "nenhum admin existir".',
  arquivos: [
    'backend/database/seeders/AdminSeeder.php',
  ],
  criterios: [
    'Seeder gera senha aleatória forte em tempo de execução e imprime uma única vez no console (nunca grava em log persistente), OU exige env var INITIAL_ADMIN_PASSWORD sem valor default',
    'Seeder falha explicitamente (sem criar nada) se rodar sem a configuração necessária',
    'Seeder recusa rodar se APP_ENV=production e a variável ALLOW_ADMIN_SEED=true não estiver setada',
    'Senha antiga Admin@123! não existe mais em nenhum lugar do código-fonte',
  ],
  commitMsg: 'fix(D-11): remover credencial hardcoded do AdminSeeder',
};

D['D-12'] = {
  titulo: 'Proteger a auto-promoção a admin do "primeiro usuário"',
  sprint: 4, user: CLAUDIA_ID,
  servicos: 'Laravel (backend/)',
  pastas: ['backend'],
  branch: 'feature/d-12-protecao-auto-promocao-admin',
  ondeSeEncaixa: 'AuthController::register e handleGoogleCallback promovem automaticamente a admin qualquer cadastro feito quando não existe admin na base — via endpoints PÚBLICOS (registro e login Google).',
  arquivos: [
    'backend/app/Http/Controllers/Api/AuthController.php (métodos register e handleGoogleCallback)',
  ],
  criterios: [
    'Lógica de auto-promoção removida dos endpoints públicos de registro e OAuth',
    'Existe um caminho seguro documentado para criar o primeiro admin (comando artisan make:admin {email} OU variável de ambiente INITIAL_ADMIN_EMAIL checada só uma vez no boot da aplicação)',
    'Teste Feature Laravel: registrar o primeiro usuário do zero e confirmar que ele NÃO recebe role admin automaticamente',
  ],
  commitMsg: 'fix(D-12): remover auto-promocao a admin do cadastro publico',
};

D['D-13'] = {
  titulo: 'Corrigir configuração da URL do AI Service',
  sprint: 4, user: CLAUDIA_ID,
  servicos: 'Laravel (backend/)',
  pastas: ['backend'],
  branch: 'feature/d-13-corrigir-config-ai-service-url',
  ondeSeEncaixa: 'AdminController.php e HealthController.php usam env(\'AI_SERVICE_URL\', ...) diretamente no código, fora de config/. Isso quebra silenciosamente depois de php artisan config:cache (rodado no deploy) — env() fora do bootstrap retorna null, caindo no valor hardcoded http://localhost:8001.',
  arquivos: [
    'backend/config/services.php (adicionar a chave ai_service.url)',
    'backend/app/Http/Controllers/Api/AdminController.php (trocar env() por config())',
    'backend/app/Http/Controllers/Api/HealthController.php (trocar env() por config())',
    'backend/.env.example (documentar AI_SERVICE_URL)',
  ],
  criterios: [
    'config/services.php tem a chave ai_service.url lendo de env(\'AI_SERVICE_URL\')',
    'As duas ocorrências em AdminController e HealthController usam config(\'services.ai_service.url\')',
    'Depois de rodar php artisan config:cache, /api/health e /api/admin/stats continuam enxergando a URL correta do ai-service',
    'AI_SERVICE_URL documentada no .env.example',
  ],
  commitMsg: 'fix(D-13): mover AI_SERVICE_URL para config/services.php',
};

D['D-14'] = {
  titulo: 'Corrigir vulnerabilidades de segurança do Angular',
  sprint: 4, user: CLAUDIA_ID,
  servicos: 'Angular (frontend/)',
  pastas: ['frontend'],
  branch: 'feature/d-14-corrigir-vulnerabilidades-angular',
  ondeSeEncaixa: 'npm audit reporta 7 vulnerabilidades "high" e 1 "moderate" nos pacotes @angular/* instalados (versão 20.3.21), incluindo duas falhas de bypass de sanitização (XSS).',
  arquivos: [
    'frontend/package.json',
    'frontend/cypress/e2e/ (suíte e2e completa que precisa ser revalidada depois)',
  ],
  criterios: [
    'npm audit fix executado (ou pacotes @angular/* atualizados manualmente para >=20.3.25)',
    'npm audit não reporta mais vulnerabilidades "high" ou "critical" relacionadas ao Angular',
    'Toda a suíte Cypress e2e (20 specs bs-*/us-*) roda e passa sem regressão após a atualização',
    'Build de produção (ng build --configuration=production) completa sem erro novo',
  ],
  commitMsg: 'fix(D-14): corrigir vulnerabilidades XSS do Angular (npm audit)',
};

D['D-15'] = {
  titulo: 'Validar arquivos por conteúdo real no upload de PDF',
  sprint: 1, user: FERNANDO_ID,
  servicos: 'Python/FastAPI (ai-service/)',
  pastas: ['ai-service'],
  branch: 'feature/d-15-validar-magic-bytes-pdf',
  ondeSeEncaixa: 'O ai-service valida upload de PDF apenas pela extensão do nome do arquivo (.pdf), sem checar o conteúdo real. Qualquer arquivo renomeado para .pdf passa direto para o PyMuPDF/LlamaParse.',
  arquivos: [
    'ai-service/app/routers/documents.py (endpoint de upload, por volta da linha 92)',
  ],
  criterios: [
    'Checagem dos primeiros bytes do arquivo recebido (file.read(5) == b\'%PDF-\') antes de salvar e processar',
    'Upload de arquivo .txt renomeado para .pdf é rejeitado com 400 e mensagem clara, sem chegar a acionar o pipeline (sem custo de LlamaParse/Gemini)',
    'Upload de PDF real continua funcionando normalmente',
    'Teste automatizado (pytest) cobrindo ambos os casos',
  ],
  commitMsg: 'fix(D-15): validar PDF por magic bytes, nao so extensao',
};

D['D-16'] = {
  titulo: 'Aplicar rate limit nos endpoints de áudio e visualização HTML',
  sprint: 2, user: FERNANDO_ID,
  servicos: 'Python/FastAPI (ai-service/)',
  pastas: ['ai-service'],
  branch: 'feature/d-16-rate-limit-audio-html',
  ondeSeEncaixa: 'GET /documents/{id}/audio e GET /documents/{id}/html-view disparam geração real de IA (TTS e slides via Gemini) quando não há cache, mas não têm @limiter.limit(...) como os demais endpoints caros.',
  arquivos: [
    'ai-service/app/routers/documents.py (endpoints /audio linha ~364 e /html-view linha ~474; olhar os outros endpoints já protegidos como referência do padrão de @limiter.limit)',
  ],
  criterios: [
    'Rate limit por usuário aplicado em /audio e /html-view, usando o mesmo padrão já usado nos outros endpoints (ex: rate_generations_per_hour)',
    'Repetir chamadas além do limite retorna 429 com mensagem clara, mesmo vindo de IPs diferentes (limite por usuário, não só por IP)',
    'Uso normal (dentro do limite) não é afetado',
  ],
  commitMsg: 'fix(D-16): rate limit por usuario em /audio e /html-view',
};

D['D-17'] = {
  titulo: 'Garantir modo de produção seguro no ai-service',
  sprint: 2, user: FERNANDO_ID,
  servicos: 'Python/FastAPI (ai-service/)',
  pastas: ['ai-service'],
  branch: 'feature/d-17-debug-false-producao',
  ondeSeEncaixa: 'ai-service/app/core/config.py tem debug: bool = True como valor padrão — se a variável DEBUG não foi setada manualmente no Railway, /docs, /redoc e /openapi.json ficam públicos em produção.',
  arquivos: [
    'ai-service/app/core/config.py',
  ],
  criterios: [
    'Valor padrão de debug trocado para False no código (fail-safe: precisa ser explicitamente ligado)',
    'Confirmado manualmente que a variável DEBUG=False está setada no painel do Railway de produção',
    'Ambiente de desenvolvimento local continua conseguindo ativar /docs setando DEBUG=True explicitamente no .env',
  ],
  commitMsg: 'fix(D-17): default seguro de DEBUG no ai-service',
};

D['D-18'] = {
  titulo: 'Fortalecer política de senha e proteção contra força bruta',
  sprint: 5, user: CLAUDIA_ID,
  servicos: 'Laravel (backend/)',
  pastas: ['backend'],
  branch: 'feature/d-18-senha-forte-bloqueio-bruteforce',
  ondeSeEncaixa: 'O cadastro hoje aceita qualquer senha com 8+ caracteres. A tabela audit_logs já registra LOGIN_FAILED mas nada consome esse dado para travar a conta.',
  arquivos: [
    'backend/app/Http/Requests/Auth/RegisterRequest.php',
    'backend/app/Http/Controllers/Api/AuthController.php (método login)',
    'backend/app/Models/AuditLog.php',
  ],
  criterios: [
    'RegisterRequest usa Illuminate\\Validation\\Rules\\Password exigindo maiúscula, minúscula, número e símbolo',
    'Cadastro com senha fraca (ex: 12345678, senha123) é rejeitado com mensagem explicando o requisito',
    '5 tentativas de login falhas para o mesmo e-mail em menos de 10 minutos (consultando audit_logs) bloqueiam novas tentativas por 15 minutos, mesmo trocando de IP',
    'Teste Feature Laravel cobrindo: cadastro com senha fraca e o bloqueio por tentativas',
  ],
  commitMsg: 'fix(D-18): politica de senha forte e bloqueio por forca bruta',
};

D['D-19'] = {
  titulo: 'Publicar Termos de Uso e Política de Privacidade com aceite no cadastro',
  sprint: 5, user: CLAUDIA_ID,
  servicos: 'Laravel (backend/) + Angular (frontend/)',
  pastas: ['backend', 'frontend'],
  branch: 'feature/d-19-termos-privacidade',
  ondeSeEncaixa: 'Não existem páginas de Termos de Uso ou Política de Privacidade — os links do rodapé apontam para href="#". IMPORTANTE: o CONTEÚDO jurídico dos textos precisa ser escrito/revisado por advogado — esta demanda é só a implementação técnica (páginas, checkbox, persistência). Use um texto placeholder claro indicando "conteúdo a revisar juridicamente" no lugar do texto final.',
  arquivos: [
    'CRIAR: frontend/src/app/features/legal/termos-de-uso/ (rota pública /termos-de-uso)',
    'CRIAR: frontend/src/app/features/legal/politica-de-privacidade/ (rota pública /politica-de-privacidade)',
    'frontend/src/app/features/auth/register/register.html (adicionar checkbox de aceite obrigatório)',
    'backend/app/Http/Requests/Auth/RegisterRequest.php (adicionar validação do campo terms_accepted)',
    'backend/app/Http/Controllers/Api/AuthController.php (método register, salvar terms_accepted_at e terms_version)',
    'CRIAR migration adicionando terms_accepted_at (timestamp) e terms_version (string) na tabela users',
    'frontend/src/app/shared/components/molecules/layout/footer/ (corrigir os links do rodapé)',
  ],
  criterios: [
    'Páginas /termos-de-uso e /politica-de-privacidade acessíveis publicamente (sem login)',
    'Links do rodapé apontam para essas páginas em vez de href="#"',
    'Cadastro sem marcar o checkbox de aceite é rejeitado com 422 e mensagem clara',
    'Cadastro bem-sucedido grava terms_accepted_at e terms_version no usuário',
    'Migration adicionando os dois campos criada',
  ],
  commitMsg: 'feat(D-19): termos de uso, politica de privacidade e aceite no cadastro',
};

D['D-20'] = {
  titulo: 'Banner de consentimento de cookies',
  sprint: 5, user: CLAUDIA_ID,
  servicos: 'Angular (frontend/)',
  pastas: ['frontend'],
  branch: 'feature/d-20-banner-cookies',
  ondeSeEncaixa: 'Não existe nenhum aviso de cookies no site. Implementar de forma simples, sem biblioteca de terceiros pesada.',
  arquivos: [
    'CRIAR: frontend/src/app/shared/components/molecules/feedback/cookie-banner/ (componente novo)',
    'frontend/src/app/app.ts (incluir o componente globalmente)',
  ],
  criterios: [
    'Banner aparece na primeira visita de um navegador novo (sem cookie/localStorage prévio)',
    'Botão "Aceitar" e link para a Política de Privacidade (rota criada na D-19)',
    'Após aceitar, escolha persiste em localStorage e o banner não reaparece em visitas seguintes',
    'Banner não bloqueia o uso do site (usuário pode navegar mesmo sem interagir com ele)',
  ],
  commitMsg: 'feat(D-20): banner de consentimento de cookies',
};

D['D-21'] = {
  titulo: 'Exclusão de conta e exportação de dados pessoais (LGPD)',
  sprint: 2, user: FERNANDO_ID,
  servicos: 'Laravel (backend/) + Python/FastAPI (ai-service/, para excluir documentos associados)',
  pastas: ['backend', 'ai-service'],
  branch: 'feature/d-21-exclusao-exportacao-lgpd',
  ondeSeEncaixa: 'Não existe nenhum mecanismo de "direito ao esquecimento" ou portabilidade de dados. O usuário precisa poder exportar e excluir seus próprios dados.',
  arquivos: [
    'backend/routes/api.php (adicionar GET /profile/export e DELETE /profile, protegidas por auth:sanctum)',
    'backend/app/Http/Controllers/Api/AuthController.php ou novo ProfileController',
    'ai-service/app/routers/documents.py (adicionar ou reaproveitar endpoint de exclusão de todos os documentos de um usuário, chamado pelo Laravel)',
    'frontend/src/app/features/profile/ (adicionar botões "Exportar meus dados" e "Excluir minha conta")',
  ],
  criterios: [
    'GET /profile/export retorna um arquivo (JSON ou ZIP) com os dados pessoais do usuário no MySQL + metadados dos documentos processados (sem o conteúdo binário dos PDFs)',
    'DELETE /profile exige confirmação de senha antes de executar',
    'Exclusão faz soft-delete do usuário, anonimiza nome/e-mail (ex: deleted-user-{id}@educore.invalid), revoga todos os tokens',
    'Exclusão dispara (evento assíncrono) a remoção dos documentos correspondentes no ai-service',
    'Usuário excluído não consegue mais fazer login',
    'Teste Feature Laravel cobrindo exportação e exclusão, incluindo a exigência de confirmação de senha',
  ],
  commitMsg: 'feat(D-21): exportacao e exclusao de dados pessoais (LGPD)',
};

D['D-22'] = {
  titulo: 'Migrar armazenamento de PDFs para storage persistente',
  sprint: 3, user: FERNANDO_ID,
  servicos: 'Python/FastAPI (ai-service/)',
  pastas: ['ai-service'],
  branch: 'feature/d-22-storage-persistente-pdfs',
  ondeSeEncaixa: 'O ai-service salva PDFs em uploads/ no disco local — no Railway o filesystem é efêmero e todo arquivo processado some a cada redeploy. ai-service/app/core/config.py já tem os campos preparados (pdf_storage_provider, s3_*, supabase_url) mas nenhum provedor está implementado.',
  arquivos: [
    'ai-service/app/core/config.py (campos já existentes, LEIA primeiro)',
    'ai-service/app/routers/documents.py (todas as leituras/escritas de uploads/)',
    'ai-service/app/services/rag_service.py (idem)',
    'CRIAR: ai-service/app/services/storage_service.py (interface save(file) -> url, get(path) -> bytes, delete(path))',
  ],
  criterios: [
    'storage_service.py implementado usando Supabase Storage (ou S3/R2, decisão livre desde que documentada)',
    'Todas as leituras/escritas de uploads/ em documents.py e rag_service.py passam a usar o storage_service',
    'Modo local (pdf_storage_provider=local) continua funcionando para desenvolvimento sem credenciais de nuvem',
    'PDF enviado antes de um redeploy do ai-service no Railway continua acessível depois do redeploy (testar manualmente)',
    'Renovação automática da URI do Gemini Files volta a funcionar mesmo após redeploy',
  ],
  commitMsg: 'feat(D-22): storage persistente para PDFs (Supabase Storage/S3)',
};

D['D-23'] = {
  titulo: 'Watchdog para documentos travados no processamento',
  sprint: 3, user: FERNANDO_ID,
  servicos: 'Python/FastAPI (ai-service/) + Angular (frontend/, botão de retry)',
  pastas: ['ai-service', 'frontend'],
  branch: 'feature/d-23-watchdog-documentos-travados',
  ondeSeEncaixa: 'O pipeline roda via BackgroundTasks do FastAPI, sem fila persistente. Se o processo cair no meio (crash, OOM, redeploy), o documento fica com status=\'processing\' para sempre, sem detecção.',
  arquivos: [
    'ai-service/app/services/rag_service.py (função process_document)',
    'ai-service/main.py (lifespan da aplicação, onde adicionar a rotina periódica)',
    'frontend/src/app/features/panel/panel.ts (adicionar botão "Tentar novamente" quando status=failed)',
  ],
  criterios: [
    'Rotina periódica (ex: a cada 5 minutos, via apscheduler ou tarefa no lifespan do FastAPI) identifica documentos com status=processing e updated_at há mais de 15 minutos',
    'Documento identificado é marcado como status=failed com mensagem de erro explicando o timeout',
    'Frontend mostra botão "Tentar novamente" quando status=failed, reiniciando o pipeline do zero para aquele documento',
    'Teste automatizado simulando um documento travado e confirmando que a rotina o marca como failed',
  ],
  commitMsg: 'feat(D-23): watchdog para documentos travados em processing',
};

D['D-24'] = {
  titulo: 'Eliminar o gargalo de concorrência do ai-service',
  sprint: 3, user: FERNANDO_ID,
  servicos: 'Python/FastAPI (ai-service/)',
  pastas: ['ai-service'],
  branch: 'feature/d-24-concorrencia-ai-service',
  ondeSeEncaixa: 'O ai-service roda com 1 único worker (uvicorn sem --workers), e chamadas caras (SDK do Gemini, python-pptx, TTS, httpx pro Pexels) são síncronas dentro de handlers async def, sem asyncio.to_thread — 2 usuários gerando ao mesmo tempo travam o serviço inteiro, inclusive o /health.',
  arquivos: [
    'ai-service/app/services/rag_service.py (funções _gerar_conteudo, _chat_openai)',
    'ai-service/app/services/pptx_service.py (geração de apresentação)',
    'ai-service/app/services/tts_service.py (síntese de voz)',
    'ai-service/app/services/reveal_service.py (chamadas ao Pexels)',
    'ai-service/Procfile e ai-service/Dockerfile (configuração de workers do uvicorn)',
  ],
  criterios: [
    'Todas as chamadas síncronas identificadas envolvidas com asyncio.to_thread(...)',
    'Procfile/Dockerfile configurados para rodar com múltiplos workers (uvicorn main:app --workers 2 ou mais, conforme recursos do plano Railway)',
    'Teste manual: dois documentos sendo processados/gerados ao mesmo tempo (duas abas/usuários) não travam a resposta um do outro nem o /health',
    'Teste de carga simples (ex: script disparando 5 gerações simultâneas) confirma que o tempo de resposta não cresce linearmente com requisições simultâneas',
    'Nenhuma regressão nas gerações existentes (quiz, resumo, slides, mapa mental, flashcards, PCD)',
  ],
  commitMsg: 'fix(D-24): eliminar gargalo de concorrencia do ai-service',
};

D['D-25'] = {
  titulo: 'Definir e implementar backup dos bancos de dados',
  sprint: 4, user: FERNANDO_ID,
  servicos: 'Infraestrutura (Supabase + Hostinger, fora do código do monorepo)',
  pastas: ['backend'],
  branch: 'feature/d-25-backup-bancos-dados',
  ondeSeEncaixa: 'Não existe nenhuma rotina de backup para o MySQL (Hostinger) ou PostgreSQL (Supabase). Esta é uma demanda de configuração de infraestrutura, não só código.',
  arquivos: [
    'Painel do Supabase (ativar backups automáticos, verificar plano/retenção)',
    'hPanel da Hostinger -> Cron Jobs (configurar rotina de mysqldump)',
    'DEPLOY.private.md (documentar o procedimento de restauração passo a passo — este arquivo é local, não vai pro GitHub)',
  ],
  criterios: [
    'Backup automático diário do Supabase ativado, com pelo menos 7 dias de retenção',
    'Cron job configurado na Hostinger rodando mysqldump diariamente e enviando o arquivo para um storage externo, com rotação de 7-14 dias',
    'Procedimento de restauração testado manualmente pelo menos uma vez (restaurar um backup em ambiente de teste e confirmar integridade)',
    'Passo a passo de restauração documentado em DEPLOY.private.md',
  ],
  commitMsg: 'docs(D-25): configurar e documentar backup dos bancos de dados',
};

D['D-26'] = {
  titulo: 'Migrar schema do ai-service para migrations versionadas com connection pooling',
  sprint: 4, user: FERNANDO_ID,
  servicos: 'Python/FastAPI (ai-service/)',
  pastas: ['ai-service'],
  branch: 'feature/d-26-alembic-connection-pooling',
  ondeSeEncaixa: 'O schema do PostgreSQL é criado por init_db(), que roda CREATE TABLE IF NOT EXISTS a cada boot — sem versionamento. Cada chamada abre uma nova conexão psycopg2 (2-3 por requisição), pressionando o limite do Supabase.',
  arquivos: [
    'ai-service/app/core/database.py (LEIA — init_db() e get_connection() atuais)',
    'CRIAR: estrutura do Alembic (alembic init, migration inicial gerada a partir do schema atual)',
  ],
  criterios: [
    'Alembic configurado, com migration inicial recriando o schema atual do zero',
    'alembic upgrade head cria o schema corretamente em um banco vazio',
    'get_connection() substituído por um pool de conexões (psycopg2.pool.SimpleConnectionPool ou engine SQLAlchemy com pool)',
    'Múltiplas instâncias do ai-service subindo ao mesmo tempo não geram erro de DDL concorrente',
    'Número de conexões simultâneas ao Postgres não cresce linearmente com requisições (verificável nas métricas do Supabase)',
  ],
  commitMsg: 'refactor(D-26): migrations Alembic + connection pooling no ai-service',
};

D['D-27'] = {
  titulo: 'Implementar planos e quota de uso (sem cobrança ainda)',
  sprint: 4, user: FERNANDO_ID,
  servicos: 'Laravel (backend/) + Python/FastAPI (ai-service/) + Angular (frontend/)',
  pastas: ['backend', 'ai-service', 'frontend'],
  branch: 'feature/d-27-planos-quota-uso',
  ondeSeEncaixa: 'Hoje não existe nenhum conceito de plano ou limite mensal — qualquer usuário cadastrado tem acesso ilimitado (só rate limits técnicos genéricos se aplicam). Ver MULTITENANT-BILLING.md na raiz do repositório para o desenho técnico completo já mapeado.',
  arquivos: [
    'MULTITENANT-BILLING.md (LEIA PRIMEIRO — desenho completo já existe)',
    'CRIAR: backend/database/migrations/..._create_plans_table.php e ..._create_usage_counters_table.php',
    'backend/app/Http/Controllers/Api/AuthController.php (método verify, estender resposta com plan/limits/usage)',
    'ai-service/app/core/auth.py (propagar plan/limits/usage no current_user)',
    'ai-service/app/routers/documents.py (aplicar enforce_quota no upload e no generate)',
    'backend/routes/api.php (adicionar POST /api/usage/increment)',
    'frontend/src/app/shared/components/ (badge de uso no header, modal de upgrade em erro 402)',
  ],
  criterios: [
    'Migrations plans e usage_counters criadas, com seed inicial dos planos Free (3 PDFs/mês), Pro (30/mês) e Equipe (150/mês)',
    'GET /auth/verify retorna plan, limits e usage do usuário (já é cacheado e consumido pelo ai-service)',
    'ai-service bloqueia com HTTP 402 (mensagem clara de upgrade) quando o limite é atingido, no upload e na geração',
    'POST /api/usage/increment incrementa o contador do período atual de forma atômica (UPDATE ... WHERE pdfs_used < limit), sem race condition em uploads simultâneos',
    'Badge no header mostra uso do mês ("7/30 PDFs este mês") e modal amigável aparece no 402',
    'Contador reseta automaticamente a cada novo mês',
    'Teste cobrindo: bloqueio no limite, reset mensal, checagem atômica sob concorrência',
  ],
  commitMsg: 'feat(D-27): sistema de planos e quota de uso',
};

D['D-28'] = {
  titulo: 'Implementar cobrança recorrente via Asaas',
  sprint: 5, user: FERNANDO_ID,
  servicos: 'Laravel (backend/) + Angular (frontend/)',
  pastas: ['backend', 'frontend'],
  branch: 'feature/d-28-cobranca-asaas',
  ondeSeEncaixa: 'Portar a integração já validada no projeto Votar (PagamentoAsaasControlador) para o EduCore. Ver MULTITENANT-BILLING.md seção 4 para o fluxo completo já desenhado.',
  arquivos: [
    'MULTITENANT-BILLING.md (seção 4, LEIA PRIMEIRO)',
    'Projeto Votar (referência do PagamentoAsaasControlador já validado em produção — peça o caminho exato se não souber onde fica)',
    'CRIAR: backend/database/migrations/..._create_subscriptions_table.php e ..._create_payments_table.php',
    'CRIAR: backend/app/Http/Controllers/Api/BillingController.php',
    'backend/routes/api.php (POST /billing/subscribe, GET /billing/subscription, POST /billing/cancel, GET /plans, POST /webhooks/asaas)',
    'CRIAR: frontend/src/app/features/pricing/ (página /precos) e frontend/src/app/features/account/subscription/ (/conta/assinatura)',
  ],
  criterios: [
    'Usuário assina um plano pago, é redirecionado ao checkout do Asaas, e a assinatura é ativada automaticamente após confirmação via webhook',
    'Reenvio duplicado do mesmo webhook do Asaas NÃO gera cobrança nem ativação duplicada (idempotência via gateway_payment_id único)',
    'Cancelamento mantém acesso até o fim do período já pago, não corta na hora',
    'Página /precos no ar publicamente, refletindo os planos reais cadastrados no banco',
    'NUNCA armazenar dados de cartão — só IDs de referência do gateway',
    'Teste Feature Laravel simulando os principais eventos de webhook (confirmado, atrasado, cancelado)',
  ],
  commitMsg: 'feat(D-28): cobranca recorrente via Asaas',
};

D['D-29'] = {
  titulo: 'Painel de gestão de assinatura para o usuário',
  sprint: 6, user: CLAUDIA_ID,
  servicos: 'Laravel (backend/) + Angular (frontend/)',
  pastas: ['backend', 'frontend'],
  branch: 'feature/d-29-painel-assinatura-usuario',
  ondeSeEncaixa: 'Complementa a demanda D-28 (billing já deve estar implementado quando esta rodar). Página /conta/assinatura precisa de histórico, troca de plano e e-mails automáticos.',
  arquivos: [
    'backend/app/Http/Controllers/Api/BillingController.php (já criado na D-28, adicionar GET /billing/payments e lógica de troca de plano)',
    'frontend/src/app/features/account/subscription/ (já criada na D-28, complementar com histórico e botão de troca)',
    'CRIAR: e-mails de boas-vindas, pagamento recusado, fim de trial (usar fila já existente)',
  ],
  criterios: [
    'Usuário vê seu histórico completo de pagamentos em /conta/assinatura',
    'Usuário troca de plano (upgrade/downgrade) pela própria interface, sem intervenção manual',
    'E-mails automáticos disparam corretamente nos 3 eventos (boas-vindas ao assinar, pagamento recusado, aviso 3 dias antes do fim do trial), via fila',
  ],
  commitMsg: 'feat(D-29): painel de gestao de assinatura do usuario',
};

D['D-30'] = {
  titulo: 'Dashboard de métricas de negócio para o admin',
  sprint: 6, user: CLAUDIA_ID,
  servicos: 'Laravel (backend/) + Angular (frontend/)',
  pastas: ['backend', 'frontend'],
  branch: 'feature/d-30-dashboard-mrr-churn',
  ondeSeEncaixa: 'Estender o AdminController/dashboard já existente (hoje só mostra KPIs de uso técnico) com métricas de negócio, agora que billing (D-28) já existe.',
  arquivos: [
    'backend/app/Http/Controllers/Api/AdminController.php (adicionar método billingStats ou similar)',
    'backend/routes/api.php (GET /admin/billing-stats)',
    'frontend/src/app/features/admin/dashboard/ (adicionar o card de métricas de negócio)',
  ],
  criterios: [
    'GET /admin/billing-stats retorna MRR (soma de price_cents das assinaturas ativas), churn mensal, taxa de conversão Free->Pago',
    'Lista de assinaturas com pagamento em atraso (status=past_due) visível e acionável (link para contatar o usuário)',
    'Admin visualiza tudo isso diretamente no dashboard, sem consultar o banco manualmente',
    'Dados batem com uma conferência manual simples (ex: contar assinaturas ativas x preço do plano)',
  ],
  commitMsg: 'feat(D-30): dashboard de MRR, churn e conversao para admin',
};

D['D-31'] = {
  titulo: 'Feedback de conteúdo gerado',
  sprint: 6, user: CLAUDIA_ID,
  servicos: 'Laravel (backend/) + Angular (frontend/)',
  pastas: ['backend', 'frontend'],
  branch: 'feature/d-31-feedback-conteudo-gerado',
  ondeSeEncaixa: 'Não existe forma do usuário avaliar a qualidade do quiz/resumo/slides gerados.',
  arquivos: [
    'CRIAR: backend/database/migrations/..._create_content_feedbacks_table.php (user_id, document_id, generation_type, rating 1-5, comment, timestamps, único por usuário+documento+tipo)',
    'CRIAR: backend/app/Http/Controllers/Api/FeedbackController.php',
    'backend/routes/api.php (POST /feedback, GET /admin/feedback, GET /admin/feedback/stats)',
    'CRIAR: frontend/src/app/shared/components/molecules/feedback/rating-widget/ (usar p-rating do PrimeNG)',
    'frontend/src/app/features/result/types/ (adicionar o widget no rodapé de cada tipo de resultado)',
  ],
  criterios: [
    'POST /feedback com upsert (reenviar avaliação para o mesmo documento+tipo atualiza, não duplica)',
    'Widget de estrelas não bloqueia o uso do conteúdo, com campo de comentário opcional',
    'GET /admin/feedback/stats retorna a média de avaliação por tipo de geração',
    'Teste Feature Laravel cobrindo criação, upsert e a agregação de stats',
  ],
  commitMsg: 'feat(D-31): feedback de conteudo gerado (rating + comentario)',
};

D['D-32'] = {
  titulo: 'Compressão de PDFs grandes antes do processamento',
  sprint: 5, user: FERNANDO_ID,
  servicos: 'Python/FastAPI (ai-service/)',
  pastas: ['ai-service'],
  branch: 'feature/d-32-compressao-pdfs',
  ondeSeEncaixa: 'PDFs grandes (>10MB) hoje vão inteiros para o LlamaParse (cobrado por página) sem nenhuma otimização.',
  arquivos: [
    'ai-service/app/services/pdf_service.py (PyMuPDF já é dependência do projeto)',
    'ai-service/app/core/config.py (adicionar PDF_COMPRESSION_THRESHOLD_MB, default 10)',
  ],
  criterios: [
    'PDFs acima do limiar configurável são comprimidos (deflate_images=True, ~72dpi) antes de salvar e processar',
    'Se a compressão falhar por qualquer motivo, segue com o arquivo original (nunca trava o upload)',
    'PDF já pequeno (abaixo do limiar) não é tocado',
    'Log mostra tamanho antes/depois e a razão de compressão',
  ],
  commitMsg: 'feat(D-32): compressao automatica de PDFs grandes',
};

D['D-33'] = {
  titulo: 'Suporte a múltiplos idiomas na geração de conteúdo',
  sprint: 6, user: FERNANDO_ID,
  servicos: 'Python/FastAPI (ai-service/) + Angular (frontend/)',
  pastas: ['ai-service', 'frontend'],
  branch: 'feature/d-33-multi-idioma-geracao',
  ondeSeEncaixa: 'Toda geração hoje sai em português, mesmo que o usuário processe um PDF em outro idioma.',
  arquivos: [
    'ai-service/app/models/schemas.py (GenerationRequest, adicionar campo language)',
    'ai-service/app/services/rag_service.py (injetar instrução de idioma em todos os prompts: quiz, resumo, slides, mapa mental, flashcards, PCD)',
    'CRIAR: frontend/src/app/shared/components/ (seletor de idioma, bandeiras 🇧🇷/🇺🇸/🇪🇸)',
    'frontend/src/app/features/result/ (adicionar o seletor antes de cada geração)',
  ],
  criterios: [
    'Campo language opcional (pt-BR default, en-US, es-ES) no schema de geração',
    'Instrução de idioma injetada em TODOS os prompts de geração',
    'Idioma usado salvo em generations.metadata',
    'Seletor de idioma no frontend, preferência persistida em localStorage entre sessões',
    'Badge do idioma exibido junto ao conteúdo gerado',
    'Testado manualmente: gerar o mesmo documento em português e depois em inglês produz conteúdo de fato traduzido',
  ],
  commitMsg: 'feat(D-33): suporte a multiplos idiomas na geracao de conteudo',
};

D['D-34'] = {
  titulo: 'Cache de embeddings entre gerações do mesmo documento',
  sprint: 6, user: FERNANDO_ID,
  servicos: 'Python/FastAPI (ai-service/)',
  pastas: ['ai-service'],
  branch: 'feature/d-34-cache-embeddings',
  ondeSeEncaixa: 'Embeddings são recalculados via API do Gemini toda vez que uma nova geração é solicitada para um documento já processado, mesmo sem mudança de conteúdo.',
  arquivos: [
    'ai-service/app/services/rag_service.py',
    'ai-service/app/services/embed_service.py',
    'ai-service/app/routers/admin.py (adicionar POST /documents/{id}/reindex, admin only)',
  ],
  criterios: [
    'Antes de gerar embeddings, checar se já existem chunks com embedding calculado para aquele document_id',
    'Se existirem, reutilizar diretamente na busca semântica (pgvector), sem chamar a API de embedding de novo',
    'Coluna embeddings_generated_at adicionada em documents',
    'POST /documents/{id}/reindex força regeneração quando chamado',
    'Segunda geração para o mesmo documento é mensuravelmente mais rápida e não dispara nova chamada à API de embeddings (confirmável no log)',
  ],
  commitMsg: 'feat(D-34): cache de embeddings reutilizavel entre geracoes',
};

D['D-35'] = {
  titulo: 'Operações em lote em Meus Documentos',
  sprint: 6, user: FERNANDO_ID,
  servicos: 'Python/FastAPI (ai-service/) + Angular (frontend/, depende da tela Meus Documentos da D-36)',
  pastas: ['ai-service', 'frontend'],
  branch: 'feature/d-35-bulk-operations-documentos',
  ondeSeEncaixa: 'Não existe forma de selecionar múltiplos documentos e agir sobre eles de uma vez. Esta demanda pressupõe que a tela /meus-docs (D-36) já existe ou é feita em conjunto.',
  arquivos: [
    'ai-service/app/routers/documents.py (adicionar DELETE /documents/bulk e GET /documents/bulk-export)',
    'frontend/src/app/features/meus-documentos/ (adicionar checkbox de seleção e barra de ações)',
  ],
  criterios: [
    'DELETE /documents/bulk (body {ids: []}) valida ownership de cada item, limite de 20 por operação, retorna {deleted, errors}',
    'GET /documents/bulk-export retorna um ZIP (zipfile da stdlib) com os PDFs originais selecionados',
    'Tentar excluir documento de outro usuário via manipulação do payload retorna erro, sem afetar os documentos do solicitante',
    'Frontend: checkbox por documento, barra de ações flutuante quando há seleção, confirmação antes de excluir em massa',
  ],
  commitMsg: 'feat(D-35): operacoes em lote (bulk delete/export) de documentos',
};

D['D-36'] = {
  titulo: 'Tela "Meus Documentos" (histórico completo)',
  sprint: 7, user: CLAUDIA_ID,
  servicos: 'Angular (frontend/, usando endpoints que já existem no ai-service)',
  pastas: ['frontend'],
  branch: 'feature/d-36-tela-meus-documentos',
  ondeSeEncaixa: 'Não existe hoje uma tela central de histórico de PDFs processados. Os endpoints GET /documents e DELETE /documents/{id} JÁ EXISTEM no ai-service — esta demanda é só frontend.',
  arquivos: [
    'CRIAR: frontend/src/app/features/meus-documentos/ (rota /meus-docs, protegida por authGuard)',
    'frontend/src/app/core/services/ai.service.ts (já deve ter os métodos de listar/excluir documentos, conferir)',
  ],
  criterios: [
    'Grid de cards mostrando nome, data de upload, tamanho, status e número de gerações de cada documento',
    'Filtro por status e busca por nome, paginação (25 por página)',
    'Clicar em um documento processado leva diretamente ao resultado já gerado, sem reprocessar',
    'Exclusão individual com confirmação prévia',
  ],
  commitMsg: 'feat(D-36): tela Meus Documentos com historico completo',
};

D['D-37'] = {
  titulo: 'Compartilhamento de resultado via link público',
  sprint: 7, user: CLAUDIA_ID,
  servicos: 'Laravel (backend/) + Angular (frontend/)',
  pastas: ['backend', 'frontend'],
  branch: 'feature/d-37-compartilhar-link-publico',
  ondeSeEncaixa: 'Não existe forma de compartilhar um quiz/resumo/slides gerado com alguém sem conta no EduCore.',
  arquivos: [
    'CRIAR: backend/database/migrations/..._create_shared_links_table.php (token único, user_id, document_id, generation_type, generation_data JSON, expires_at)',
    'CRIAR: backend/app/Http/Controllers/Api/ShareController.php',
    'backend/routes/api.php (POST /share autenticado, GET /share/{token} público)',
    'CRIAR: frontend/src/app/features/public-share/ (rota pública /p/{token}, SEM authGuard)',
    'frontend/src/app/features/result/ (botão "Compartilhar" em cada tipo de resultado)',
  ],
  criterios: [
    'POST /share gera/reutiliza token único (upsert por usuário+documento+tipo), expiração de 30 dias',
    'GET /share/{token} funciona sem login, em aba anônima/outro navegador',
    'Link expira automaticamente após 30 dias, retornando página de "link expirado" amigável',
    'Gerar novamente o link para o mesmo documento+tipo reaproveita o token existente',
  ],
  commitMsg: 'feat(D-37): compartilhamento de resultado via link publico',
};

D['D-38'] = {
  titulo: 'Analytics de uso (admin e professor)',
  sprint: 7, user: CLAUDIA_ID,
  servicos: 'Laravel (backend/) + Angular (frontend/)',
  pastas: ['backend', 'frontend'],
  branch: 'feature/d-38-analytics-uso',
  ondeSeEncaixa: 'Não existe visão agregada de uso da plataforma além dos KPIs básicos do dashboard admin atual.',
  arquivos: [
    'backend/app/Http/Controllers/Api/AdminController.php (adicionar analytics, usando Cache::remember com 10min)',
    'backend/routes/api.php (GET /admin/analytics, GET /admin/analytics/types, GET /admin/analytics/retention)',
    'CRIAR: frontend/src/app/features/analytics/ (rota /analytics para o professor, usando Chart.js já disponível no projeto)',
  ],
  criterios: [
    'Admin: docs/gerações/usuários ativos por dia (últimos 30 dias, com filtro de período), distribuição por tipo de geração, retenção 7/14/30 dias',
    'Professor: rota /analytics com KPIs pessoais (total de PDFs, gerações, tipo mais usado), gráfico de linha (gerações por dia) e tabela dos últimos 10 documentos',
    'Professor só vê seus próprios dados, nunca de outros usuários',
    'Cache de 10 minutos funcionando (segunda chamada dentro do período não recalcula do zero)',
    'Números batem com uma conferência manual simples no banco para um período curto',
  ],
  commitMsg: 'feat(D-38): analytics de uso para admin e professor',
};

D['D-39'] = {
  titulo: 'Pesquisa de satisfação (NPS) pós-exportação',
  sprint: 8, user: CLAUDIA_ID,
  servicos: 'Angular (frontend/, reaproveita a tabela content_feedbacks da D-31)',
  pastas: ['frontend'],
  branch: 'feature/d-39-nps-pos-exportacao',
  ondeSeEncaixa: 'Depende da demanda D-31 já existir (reaproveita content_feedbacks, com um campo adicional export_type).',
  arquivos: [
    'CRIAR: frontend/src/app/shared/components/molecules/feedback/export-feedback-dialog/',
    'frontend/src/app/features/result/ (adicionar o hook pós-download em cada tipo de exportação: PPTX, Kahoot, SCORM, Socrative)',
  ],
  criterios: [
    'Dialog de avaliação (5 estrelas + comentário opcional) aparece após o download iniciar (nunca antes, nunca bloqueando o download)',
    'Aparece só uma vez por combinação documento+tipo de exportação por sessão (sessionStorage)',
    'Fecha sozinho em 15 segundos se o usuário não interagir',
  ],
  commitMsg: 'feat(D-39): NPS pos-exportacao',
};

D['D-40'] = {
  titulo: 'Monitoramento de erros em produção (Sentry) nos três serviços',
  sprint: 7, user: FERNANDO_ID,
  servicos: 'Laravel (backend/) + Angular (frontend/) + Python/FastAPI (ai-service/)',
  pastas: ['backend', 'frontend', 'ai-service'],
  branch: 'feature/d-40-sentry-monitoramento',
  ondeSeEncaixa: 'Não existe nenhuma ferramenta de monitoramento de erros nos 3 serviços — descobrir um problema em produção hoje depende de SSH manual.',
  arquivos: [
    'backend/composer.json (adicionar sentry/sentry-laravel)',
    'ai-service/requirements.txt (adicionar sentry-sdk[fastapi])',
    'frontend/package.json (adicionar @sentry/angular)',
    'Arquivos de configuração/bootstrap de cada serviço (bootstrap/app.php, main.py, app.config.ts)',
  ],
  criterios: [
    'Sentry integrado nos 3 serviços, com ambiente (production/homolog/local) e release configurados corretamente',
    'Uma exceção forçada (endpoint de teste temporário, removido depois) aparece no painel do Sentry em cada serviço, com stack trace legível',
    'Dados sensíveis (senhas, tokens) não vazam nos eventos capturados (configurar before_send para redação)',
    'Alertas por e-mail configurados para erros novos ou com pico de frequência',
  ],
  commitMsg: 'feat(D-40): monitoramento de erros (Sentry) nos 3 servicos',
};

D['D-41'] = {
  titulo: 'Cobertura de testes automatizados para fluxos críticos',
  sprint: 7, user: FERNANDO_ID,
  servicos: 'Laravel (backend/) + Angular (frontend/) + Python/FastAPI (ai-service/)',
  pastas: ['backend', 'frontend', 'ai-service'],
  branch: 'feature/d-41-cobertura-testes-automatizados',
  ondeSeEncaixa: 'backend/tests/Feature/AuthTest.php é o único teste com conteúdo real; os 28 specs Angular são boilerplate; o ai-service não tem nenhum teste automatizado.',
  arquivos: [
    'backend/tests/Feature/ (criar testes para AdminController completo, CheckRole, HealthController, verificação de email, OAuth)',
    'frontend/src/app/core/services/auth.service.spec.ts, result-store.service.spec.ts (hoje boilerplate, escrever testes reais)',
    'CRIAR: ai-service/tests/ com pytest (ownership_check, fallback de provedores de IA, parsing de resposta do LLM)',
  ],
  criterios: [
    'Cobertura mensurável (php artisan test --coverage, ng test --code-coverage, pytest --cov) sobre os módulos listados, não apenas contagem de arquivos',
    'Suíte inteira (Laravel + Angular unit + pytest + Cypress) roda em menos de 10 minutos',
    'Nenhum teste "should create" vazio permanece nos arquivos listados — cada um testa comportamento real',
  ],
  commitMsg: 'test(D-41): cobertura de testes automatizados nos 3 servicos',
};

D['D-42'] = {
  titulo: 'Otimizar performance e SEO do frontend',
  sprint: 8, user: CLAUDIA_ID,
  servicos: 'Angular (frontend/)',
  pastas: ['frontend'],
  branch: 'feature/d-42-performance-frontend',
  ondeSeEncaixa: 'O bundle inicial carrega o painel admin inteiro mesmo para um visitante anônimo na home (1.38MB de main.js), porque nenhuma rota usa lazy loading.',
  arquivos: [
    'frontend/src/app/app.routes.ts (converter para loadComponent nas rotas de /admin/* e nos tipos de resultado)',
    'frontend/public/images/ (remover imagens mortas, sem referência no código)',
    'frontend/package.json (remover @angular/material e @angular/cdk, não usados)',
  ],
  criterios: [
    'Rotas convertidas para lazy loading (loadComponent), especialmente /admin/* e os tipos de resultado',
    'public/images/ não contém mais arquivos sem referência no código',
    'package.json não lista mais @angular/material nem @angular/cdk',
    'Bundle inicial (main.js da rota /) reduz significativamente de tamanho (medir antes/depois com ng build --stats-json)',
    'Nenhuma regressão visual ou funcional em nenhuma rota',
  ],
  commitMsg: 'perf(D-42): lazy loading e limpeza de assets/dependencias mortas',
};

D['D-43'] = {
  titulo: 'Decidir e implementar o destino do SSR',
  sprint: 7, user: FERNANDO_ID,
  servicos: 'Angular (frontend/) — decisão de produto antes de qualquer código',
  pastas: ['frontend'],
  branch: 'feature/d-43-decisao-ssr',
  ondeSeEncaixa: 'O scaffold de Angular SSR está todo configurado mas app.routes.server.ts força RenderMode.Client em todas as rotas, anulando o ganho, e o deploy real serve a build como SPA estática via PHP/LiteSpeed.',
  arquivos: [
    'frontend/src/app/app.routes.server.ts',
    'frontend/src/server.ts',
    'frontend/src/app/app.config.server.ts',
    'PLANO-MARKETING-EDUCORE.md (referência pra avaliar o quanto SEO orgânico importa pra estratégia de aquisição)',
  ],
  criterios: [
    'Decisão tomada e documentada: (a) ativar SSR de verdade nas rotas públicas que importam pra SEO (home, /precos, termos/privacidade), ajustando o pipeline de deploy; OU (b) remover todo o scaffold de SSR não utilizado',
    'Se ativado: rotas públicas escolhidas retornam HTML já renderizado no view-source, sem quebrar a hidratação no cliente',
    'Se removido: nenhum arquivo/dependência de SSR morto permanece no repositório',
  ],
  commitMsg: 'chore(D-43): decisao e implementacao do destino do SSR',
};

D['D-44'] = {
  titulo: 'Padronizar tratamento de erros e limpar código morto no frontend',
  sprint: 8, user: CLAUDIA_ID,
  servicos: 'Angular (frontend/)',
  pastas: ['frontend'],
  branch: 'feature/d-44-padronizar-erros-frontend',
  ondeSeEncaixa: 'Hoje existem 3 padrões de erro coexistindo (interceptor global, componentes com toast próprio duplicando a mensagem, formulários de auth com signals locais), e features/classes usa MessageService próprio do PrimeNG em vez do ToastService compartilhado.',
  arquivos: [
    'frontend/src/app/core/interceptors/auth.interceptor.ts (já trata 401/422/429/500 via ToastService)',
    'frontend/src/app/features/panel/panel.ts, frontend/src/app/features/admin/forum/forum.ts (remover toasts duplicados)',
    'frontend/src/app/features/classes/classes.ts (migrar de MessageService proprio para o ToastService compartilhado)',
    'CRIAR: um ErrorHandler global customizado (implementar a interface ErrorHandler do Angular)',
    'frontend/src/app/app.config.ts (registrar o novo ErrorHandler)',
  ],
  criterios: [
    'Nenhum erro de API dispara mais de um toast simultâneo pro usuário',
    'features/classes usa o ToastService compartilhado, sem MessageService próprio',
    'ErrorHandler global captura exceções de renderização não tratadas',
    'Uma exceção de renderização forçada (pra teste) mostra uma tela de erro amigável em vez de tela em branco',
  ],
  commitMsg: 'fix(D-44): padronizar tratamento de erros e remover toasts duplicados',
};

D['D-45'] = {
  titulo: 'Validar diferencial competitivo e produzir vídeos demo',
  sprint: 8, user: FERNANDO_ID,
  servicos: 'Marketing/Produto (não é uma demanda de código)',
  pastas: [],
  branch: 'nao-aplicavel-tarefa-de-marketing',
  ondeSeEncaixa: 'Ver PLANO-MARKETING-EDUCORE.md seção 1.5 — pesquisa de mercado já mapeada, o diferencial mais defensável hoje é a qualidade visual do slide.',
  arquivos: [
    'PLANO-MARKETING-EDUCORE.md (referência completa)',
  ],
  criterios: [
    'Teste lado a lado real entre EduCore, Smallpdf e SlideSpeak com o mesmo PDF de entrada, documentado (prints ou vídeo)',
    'Conclusão clara sobre qual diferencial comunicar (ex: qualidade visual do slide)',
    '6 vídeos curtos finalizados: 3 demos "PDF vira X em segundos" (quiz, resumo, slides) + 3 comparativos antes/depois',
    'Nenhum jargão técnico nos vídeos (nunca mencionar RAG, embeddings, pgvector)',
    'Vídeos aprovados pelo Fernando antes da publicação',
  ],
  commitMsg: 'N/A - esta demanda nao gera commit de codigo',
};

D['D-46'] = {
  titulo: 'Lançar presença em redes sociais e programa de indicação',
  sprint: 8, user: FERNANDO_ID,
  servicos: 'Marketing (não é uma demanda de código)',
  pastas: [],
  branch: 'nao-aplicavel-tarefa-de-marketing',
  ondeSeEncaixa: 'Ver PLANO-MARKETING-EDUCORE.md seções 4 e 4.5.',
  arquivos: ['PLANO-MARKETING-EDUCORE.md'],
  criterios: [
    'Perfis Instagram e TikTok do EduCore criados e ativos, com link de bio funcional para /precos',
    'Cadência de pelo menos 3 posts/semana com os vídeos da D-45',
    'Pelo menos 10 grupos de WhatsApp/Telegram/Facebook de professores mapeados e com presença ativa',
    'Programa de indicação desenhado com regra clara (comissão recorrente ou mês grátis) e mecanismo de rastreio',
  ],
  commitMsg: 'N/A - esta demanda nao gera commit de codigo',
};

D['D-47'] = {
  titulo: 'Recrutar beta testers e coletar depoimentos',
  sprint: 8, user: FERNANDO_ID,
  servicos: 'Marketing (não é uma demanda de código)',
  pastas: [],
  branch: 'nao-aplicavel-tarefa-de-marketing',
  ondeSeEncaixa: 'Fase de validação antes de tráfego pago, conforme PLANO-MARKETING-EDUCORE.md.',
  arquivos: ['PLANO-MARKETING-EDUCORE.md'],
  criterios: [
    '10 a 15 professores beta recrutados, usando trial estendido sem cobrança',
    'Taxa de ativação desse grupo (cadastro -> 1º PDF processado com sucesso) medida e documentada',
    'Pelo menos 5 depoimentos em vídeo coletados, com autorização de uso',
  ],
  commitMsg: 'N/A - esta demanda nao gera commit de codigo',
};

D['D-48'] = {
  titulo: 'Publicar página de preços otimizada para conversão',
  sprint: 8, user: FERNANDO_ID,
  servicos: 'Marketing + Angular (frontend/, a página técnica já existe da D-28, aqui é o copy)',
  pastas: ['frontend'],
  branch: 'feature/d-48-pagina-precos-conversao',
  ondeSeEncaixa: 'A página /precos já foi criada tecnicamente na D-28 — esta demanda complementa com copywriting de conversão real e SEO básico.',
  arquivos: [
    'frontend/src/app/features/pricing/ (já existe da D-28)',
    'PLANO-MARKETING-EDUCORE.md seção 3 (proposta de valor por segmento)',
  ],
  criterios: [
    'Copy revisado no ar, focado no segmento professor autônomo primeiro, sem jargão técnico',
    'Metatags de Open Graph corretas (title, description, imagem) ao compartilhar o link em redes sociais/WhatsApp',
    'Pelo menos 1 depoimento real exibido assim que disponível (da D-47)',
  ],
  commitMsg: 'feat(D-48): copy de conversao e SEO na pagina de precos',
};

D['D-49'] = {
  titulo: 'Primeira campanha de tráfego pago controlada',
  sprint: 8, user: FERNANDO_ID,
  servicos: 'Marketing (não é uma demanda de código, exceto instalação de pixel)',
  pastas: ['frontend'],
  branch: 'feature/d-49-campanha-trafego-pago',
  ondeSeEncaixa: 'Só deve começar depois de confirmar conversão orgânica saudável (10-20 assinantes vindos organicamente), conforme regra explícita do PLANO-MARKETING-EDUCORE.md.',
  arquivos: [
    'frontend/src/index.html (instalar o pixel de conversão do Meta Ads)',
    'PLANO-MARKETING-EDUCORE.md seção 4.4',
  ],
  criterios: [
    'Pixel de conversão instalado e disparando corretamente nos eventos de cadastro e assinatura paga',
    'Campanha rodando no Meta Ads dentro do orçamento de teste (R$500-1000), usando os vídeos da D-45',
    'Custo por assinante calculado ao final do teste',
    'Decisão documentada (escalar, ajustar ou pausar) com base no resultado real',
  ],
  commitMsg: 'feat(D-49): instalar pixel de conversao para campanha de trafego pago',
};

// ============================================================
// GERAÇÃO: um arquivo .sql por sprint
// ============================================================
const outDir = path.join(__dirname, '..', 'sql-sprints');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

function esc(str) {
  return "'" + String(str).replace(/'/g, "''") + "'";
}

for (let sprintNum = 1; sprintNum <= 8; sprintNum++) {
  const linhas = [];
  linhas.push(`-- ============================================================`);
  linhas.push(`-- EduCore — Sprint ${sprintNum}: descricoes enriquecidas em formato de prompt`);
  linhas.push(`-- Atualiza o campo description das tarefas ja existentes (nao recria nada)`);
  linhas.push(`-- ============================================================`);
  linhas.push('');

  Object.keys(D).forEach((codigo) => {
    const d = D[codigo];
    if (d.sprint !== sprintNum) return;
    d.codigo = codigo;
    const descricaoCompleta = montarDescricao(d, d.user);
    linhas.push(`UPDATE tasks SET description = ${esc(descricaoCompleta)} WHERE board_id = 7 AND description LIKE ${esc('[' + codigo + ']%')} LIMIT 1;`);
    linhas.push('');
  });

  linhas.push(`-- Verificacao: confirme que todas as descricoes desta sprint foram atualizadas (buscar pelo novo cabecalho "CONTEXTO DO PROJETO")`);
  linhas.push(`SELECT id, LEFT(description, 60) AS inicio FROM tasks WHERE board_id = 7 AND sprint_id = (SELECT id FROM sprints WHERE board_id = 7 AND name LIKE ${esc('Sprint ' + sprintNum + ' -%')} LIMIT 1) ORDER BY id;`);

  const outPath = path.join(outDir, `sprint-${sprintNum}.sql`);
  fs.writeFileSync(outPath, linhas.join('\n'), 'utf8');
}

console.log('Gerados 8 arquivos em', outDir);
console.log('Total de demandas mapeadas:', Object.keys(D).length);

// ============================================================
// SPRINT 0: tarefa META com o CLAUDE.md no Caderno (fonte unica)
// ============================================================
const claudeMdPath = path.join(__dirname, '..', 'CLAUDE.md');
const claudeMdContent = fs.readFileSync(claudeMdPath, 'utf8');

const metaDescricao = `[META-01] Contexto do Projeto para IA (CLAUDE.md)

📌 Esta NÃO é uma demanda de execução — é uma referência viva. O Caderno desta tarefa (aba "Caderno" aqui no Avante) contém uma cópia do CLAUDE.md do repositório.

Como usar:
- Antes de começar qualquer uma das 49 demandas (D-01 a D-49), abra o Caderno desta tarefa e cole o conteúdo junto com a descrição da demanda no prompt da sua IA.
- Ao terminar qualquer demanda que mude arquitetura, convenção, endpoint ou infraestrutura, atualize DOIS lugares: o arquivo CLAUDE.md no repositório (commitado) e o Caderno desta tarefa (copie o conteúdo atualizado do arquivo pra cá).

Se algum dia os dois ficarem diferentes, o arquivo do repositório manda — o Caderno aqui é só um espelho pra quem está sem o repo aberto.`;

const metaLinhas = [];
metaLinhas.push(`-- ============================================================`);
metaLinhas.push(`-- EduCore — Tarefa META (Caderno = espelho do CLAUDE.md)`);
metaLinhas.push(`-- Rodar uma unica vez. Se a tarefa META-01 ja existir, isso so atualiza o Caderno (notes).`);
metaLinhas.push(`-- ============================================================`);
metaLinhas.push('');
metaLinhas.push(`-- 1) Cria a tarefa META se ainda nao existir`);
metaLinhas.push(`INSERT INTO tasks (board_id, sprint_id, status_id, assigned_to, description, notes, priority, epic, sort_order, created_at, updated_at)`);
metaLinhas.push(`SELECT ${BOARD_ID}, (SELECT id FROM sprints WHERE board_id = ${BOARD_ID} AND name LIKE ${esc('Sprint 1 -%')} LIMIT 1), 25, ${FERNANDO_ID}, ${esc(metaDescricao)}, ${esc(claudeMdContent)}, 'Alta', 'Meta: Documentacao Viva', -1, NOW(), NOW()`);
metaLinhas.push(`WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE board_id = ${BOARD_ID} AND description LIKE ${esc('[META-01]%')});`);
metaLinhas.push('');
metaLinhas.push(`-- 2) Se ja existir, garante que o Caderno (notes) fica sincronizado com o CLAUDE.md atual do repo`);
metaLinhas.push(`UPDATE tasks SET notes = ${esc(claudeMdContent)}, updated_at = NOW() WHERE board_id = ${BOARD_ID} AND description LIKE ${esc('[META-01]%')};`);
metaLinhas.push('');
metaLinhas.push(`-- 3) Cria a tag "Meta" se ainda nao existir, e vincula`);
metaLinhas.push(`INSERT INTO tags (board_id, name, color, created_at, updated_at)`);
metaLinhas.push(`SELECT ${BOARD_ID}, 'Meta', '#64748B', NOW(), NOW()`);
metaLinhas.push(`WHERE NOT EXISTS (SELECT 1 FROM tags WHERE board_id = ${BOARD_ID} AND name = 'Meta');`);
metaLinhas.push('');
metaLinhas.push(`INSERT INTO task_tag (task_id, tag_id)`);
metaLinhas.push(`SELECT t.id, tg.id FROM tasks t JOIN tags tg ON tg.board_id = ${BOARD_ID} AND tg.name = 'Meta'`);
metaLinhas.push(`WHERE t.board_id = ${BOARD_ID} AND t.description LIKE ${esc('[META-01]%')}`);
metaLinhas.push(`AND NOT EXISTS (SELECT 1 FROM task_tag WHERE task_id = t.id AND tag_id = tg.id);`);
metaLinhas.push('');
metaLinhas.push(`-- 4) Verificacao`);
metaLinhas.push(`SELECT id, LEFT(description,50) AS titulo, LENGTH(notes) AS tamanho_caderno FROM tasks WHERE board_id = ${BOARD_ID} AND description LIKE ${esc('[META-01]%')};`);

fs.writeFileSync(path.join(outDir, 'sprint-0-meta-caderno.sql'), metaLinhas.join('\n'), 'utf8');
console.log('Gerado: sql-sprints/sprint-0-meta-caderno.sql');
