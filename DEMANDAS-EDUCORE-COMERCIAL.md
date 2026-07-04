# 📋 EduCore — Catálogo de Demandas para Comercialização

> Substitui integralmente as 33 tarefas antigas do board Avante (ver script de limpeza em anexo à conversa). Cada demanda abaixo é **autossuficiente**: contém tudo que é necessário para executá-la de ponta a ponta (backend, frontend, integrações e testes, quando aplicável), sem depender de outra demanda para fazer sentido.
> Base: auditoria técnica completa do código (`ANALISE-TECNICA-PRODUCAO.md`), verificação linha a linha do board Avante contra o código real, `MULTITENANT-BILLING.md` e `PLANO-MARKETING-EDUCORE.md`.
> Última atualização: 04/07/2026.

---

## Fase 1 — Corrigir o que já existe pela metade

Seis funcionalidades têm frontend pronto (telas, formulários, navegação) mas **nenhum backend real** — qualquer clique nelas retorna 404 em produção hoje. Prioridade máxima: terminam ou saem do ar antes de qualquer cliente pagante ver a plataforma.

### D-01 — Finalizar sistema de Turmas de ponta a ponta
**Prioridade:** Alta

**Descrição:** A tela `/turmas` já existe no frontend (Angular) com cards de turma, dialog de criação e sidebar de matrícula de alunos, chamando `GET/POST /classes`, `GET /classes/{id}/students`, `POST /classes/{id}/enroll` e `DELETE /classes/{id}/enroll/{userId}` — nenhuma dessas rotas existe no Laravel (`backend/routes/api.php` não tem nenhuma rota `/classes`). Criar: migration `classes` (id, name, description, professor_id, timestamps, soft deletes) e `class_user` (pivot class_id/user_id, unique), Model `EduClass` (não usar `Class`, é palavra reservada no PHP) com `belongsTo` professor e `belongsToMany` alunos, `ClassController` com os 7 endpoints que o frontend já espera (listar do professor autenticado, criar, detalhar com alunos, editar, soft-delete, matricular, remover matrícula), e `GET /admin/classes` para o admin ver todas. Registrar as rotas em `routes/api.php` protegidas por `auth:sanctum`, com verificação de que o professor só acessa suas próprias turmas.

**Critérios de aceite:**
- Professor autenticado consegue criar turma, ver lista das próprias turmas, matricular e remover aluno, editar e excluir (soft delete) — tudo refletindo de verdade no banco.
- Professor A não consegue ver, editar ou matricular aluno em turma do Professor B (retorna 403/404).
- Admin consegue listar todas as turmas de todos os professores via `/admin/classes`.
- Teste automatizado (Feature test Laravel) cobrindo: criar turma, matricular aluno, isolamento entre professores, tentativa sem autenticação (401).
- Teste manual: fluxo completo na UI (`/turmas`) sem nenhum erro 404 no console do navegador.

---

### D-02 — Finalizar fluxo de recuperação de senha ("esqueci minha senha")
**Prioridade:** Alta

**Descrição:** A tela `/esqueci-senha` já existe no frontend e envia `POST /auth/forgot-password` — rota inexistente no Laravel. A tabela `password_reset_tokens` já existe no banco (migration padrão do Laravel) mas está órfã, nenhum código a usa. Implementar: `POST /auth/forgot-password` (recebe email, gera token, envia e-mail com link assinado para `/redefinir-senha?token=...`) e `POST /auth/reset-password` (recebe token + nova senha, valida e atualiza). Usar o sistema de fila já existente (BS-022, `QUEUE_CONNECTION=database`) para o envio do e-mail, não bloquear a resposta HTTP esperando o SMTP. Criar também a tela `/redefinir-senha` no frontend (formulário de nova senha + confirmação), já que hoje só existe a tela que *pede* o e-mail, não a que define a nova senha.

**Critérios de aceite:**
- Usuário sem conta Google (cadastro por email/senha) consegue recuperar acesso sem intervenção manual de um admin.
- Token de reset expira em 60 minutos e é de uso único (invalidado após o uso).
- E-mail de reset é enviado via fila (não trava a resposta da API).
- Rota `/auth/forgot-password` não revela se o e-mail existe ou não na base (sempre responde sucesso genérico — evita enumeração de usuários).
- Teste Feature Laravel: solicitar reset, validar token, redefinir senha, confirmar login com a nova senha, confirmar que o token usado não funciona duas vezes.

---

### D-03 — Finalizar edição de perfil (nome e avatar)
**Prioridade:** Alta

**Descrição:** A tela de perfil já existe no frontend e envia `POST /profile` (FormData com `name` e `avatar`) — rota que não existe no Laravel. Criar `POST /profile` (autenticado via `auth:sanctum`) que atualiza `name` e faz upload de `avatar` (validar tipo de imagem e tamanho máximo, salvar em `storage/app/public/avatars` com link simbólico público já padrão do Laravel), retornando o usuário atualizado no mesmo formato que o frontend já espera (`{ user: { id, name, email, avatar, role } }`).

**Critérios de aceite:**
- Usuário consegue alterar nome e enviar nova foto de perfil, e a mudança persiste após logout/login.
- Upload de avatar rejeita arquivos que não sejam imagem (jpg/png/webp) e maiores que 2MB, com mensagem de erro clara no frontend.
- Avatar antigo é removido do storage ao enviar um novo (evita acúmulo de arquivos órfãos).
- Teste Feature Laravel cobrindo atualização de nome, upload de avatar válido e rejeição de arquivo inválido.

---

### D-04 — Finalizar notificações in-app (sino do header)
**Prioridade:** Alta

**Descrição:** O componente do sino de notificações já existe no header do frontend, com badge de não lidas e dropdown, chamando `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/{id}/read` e `PATCH /api/notifications/read-all` — nenhuma dessas rotas existe. Criar migration `notifications` (id, user_id, type, title, body, data JSON, read_at, timestamps), Model `Notification`, `NotificationController` com os 4 endpoints acima, e um `NotificationService::send($userId, $type, $title, $body, $data)` injetável nos demais controllers para disparar notificações reais nos eventos que já acontecem hoje (ex: quando o processamento de um PDF terminar no ai-service — adicionar uma chamada HTTP simples do ai-service para o Laravel avisando conclusão, autenticada com uma chave interna simples, não precisa de HMAC sofisticado nesta fase).

**Critérios de aceite:**
- Badge do sino mostra a contagem real de não lidas, atualizando a cada 30s de polling.
- Marcar como lida (individual e "marcar todas") funciona e persiste.
- Ao concluir o processamento de um documento, o usuário recebe uma notificação real (não apenas mock).
- Teste Feature Laravel cobrindo criação, listagem paginada, marcação de leitura e isolamento (usuário não vê notificação de outro).

---

### D-05 — Finalizar fórum de discussão
**Prioridade:** Média

**Descrição:** A tela de fórum (`/admin/forum`) já existe com lista de tópicos, criação, thread de respostas e paginação — visualmente parece 100% pronta, mas não existe `ForumController` nem as tabelas `forum_topics`/`forum_replies` no banco; toda chamada é 404. Criar as duas migrations (`forum_topics`: id, user_id, title, body, replies_count, last_reply_at, timestamps, soft delete; `forum_replies`: id, topic_id, user_id, body, timestamps, soft delete), Model `ForumTopic` e `ForumReply`, `ForumController` com `GET/POST /forum/topics`, `GET/POST /forum/topics/{id}/replies`, e exclusão (soft delete) restrita ao autor ou admin.

**Critérios de aceite:**
- Qualquer usuário autenticado consegue criar tópico, responder, e ver a lista paginada de tópicos com contagem de respostas e última atividade.
- Autor consegue excluir seu próprio tópico/resposta; outro usuário comum não consegue (403); admin consegue excluir qualquer um.
- Teste Feature Laravel cobrindo criação de tópico, resposta, paginação e regra de exclusão.

---

### D-06 — Descontinuar o Chat interno da área administrativa
**Prioridade:** Média

**Descrição:** O chat em `/admin/chat` tem frontend com polling a cada 3s, mas o próprio código já documenta em comentário que "o endpoint do backend ainda não existe". É comunicação interna da equipe (admin↔professor), não uma feature voltada ao cliente final, e tem ROI baixo comparado a tudo mais que falta. Em vez de terminar o backend agora, remover a entrada "Chat" do menu administrativo e a rota `/admin/chat` do `app.routes.ts`, deixando o componente no repositório (não deletar o código) para retomar no futuro se fizer sentido.

**Critérios de aceite:**
- Menu admin não exibe mais link para "Chat".
- Rota `/admin/chat` deixa de existir na navegação (acesso direto pela URL redireciona para 404 ou dashboard).
- Nenhum erro de console relacionado a polling de chat aparece mais em nenhuma tela.

---

### D-07 — Exibir o botão de exportação para Google Slides
**Prioridade:** Alta

**Descrição:** O ai-service já tem a integração funcional com a API do Google Slides (`_try_google_slides()` em `documents.py`, que já roda automaticamente ao gerar slides e salva `google_slides_url` na tabela `generations`) — mas não existe nenhum botão ou link no frontend para o usuário acessar essa apresentação. Adicionar, na tela de resultado de slides, um botão "Abrir no Google Slides" que aparece quando `google_slides_url` vier preenchido na resposta da geração, abrindo o link em nova aba. Se `google_slides_url` vier vazio (usuário não logou via Google, ou a chamada falhou), não mostrar o botão e não exibir nenhum erro — é um recurso opcional, não deve travar o fluxo principal de geração de PPTX.

**Critérios de aceite:**
- Usuário logado via Google que gera slides vê o botão e consegue abrir a apresentação real no Google Slides.
- Usuário logado por email/senha (sem Google) não vê o botão, sem erro nenhum na tela.
- Teste manual: gerar slides duas vezes (uma com login Google, uma sem) e confirmar o comportamento acima.

---

### D-08 — Remover código morto de SSE no upload
**Prioridade:** Baixa

**Descrição:** O componente de upload usa `EventSource` para conectar em `GET /documents/{id}/stream`, endpoint que nunca foi implementado no ai-service — na prática, todo upload sempre cai no fallback de polling de 2s já programado no próprio componente, e funciona bem assim. Manter esse código morto (tentativa de SSE + fallback) é complexidade sem benefício real hoje. Remover a tentativa de `EventSource` e deixar o componente usando só o polling direto, simplificando a lógica de `upload.ts`.

**Critérios de aceite:**
- Upload de PDF continua mostrando progresso em tempo real (via polling) sem regressão visual ou funcional.
- Nenhuma tentativa de conexão a `/documents/{id}/stream` aparece mais no código nem no console do navegador (sem mais erros 404 de EventSource).
- (Se no futuro houver tempo/ROI para implementar SSE de verdade no ai-service, tratar como demanda nova e independente — não reaproveitar este código morto.)

---

## Fase 2 — Segurança crítica

### D-09 — Corrigir bloqueio administrativo de usuários
**Prioridade:** Alta

**Descrição:** Hoje, quando um admin "bloqueia" um usuário em `/admin/usuarios` (`PATCH /admin/users/{id}/status`), o backend (`AdminController::updateStatus`) apenas zera `email_verified_at` — o token de acesso (Sanctum) do usuário continua 100% válido, ele segue usando a plataforma normalmente. Pior: ao clicar no link de verificação de e-mail que já possui, `verifyEmail()` reativa a conta automaticamente, sem checar se foi bloqueada por um admin. Corrigir: adicionar coluna `status` (enum: `active`/`blocked`) na tabela `users` (separada de `email_verified_at`, que deve voltar a significar só "e-mail confirmado"); ao bloquear, revogar todos os `personal_access_tokens` do usuário (`$user->tokens()->delete()`); adicionar um middleware ou checagem no `AuthController` (login, `/me`, `/verify`, `verifyEmail`) que rejeita usuários com `status = blocked` com 403 e mensagem clara; garantir que `verifyEmail()` nunca reative um usuário bloqueado.

**Critérios de aceite:**
- Admin bloqueia um usuário → o token que ele já tinha para de funcionar imediatamente na próxima requisição (403).
- Usuário bloqueado não consegue fazer login novamente, nem se autodesbloquear clicando em link de verificação de e-mail antigo.
- Admin desbloqueia → usuário volta a autenticar normalmente.
- Teste Feature Laravel cobrindo: bloquear usuário logado e confirmar que o token dele para de funcionar na chamada seguinte; tentar login bloqueado; tentar reativar via link de verificação estando bloqueado.

---

### D-10 — Configurar CORS explícito no backend Laravel
**Prioridade:** Alta

**Descrição:** Não existe `config/cors.php` no projeto — o Laravel 13 usa o middleware `HandleCors` por padrão, mas sem esse arquivo `cors.paths` fica vazio e nenhuma resposta recebe `Access-Control-Allow-Origin`. Hoje isso não quebra em produção porque o Angular buildado é servido pelo mesmo domínio do Laravel (same-origin), mas quebra em desenvolvimento local (Angular em `localhost:4200` vs Laravel em `educore.test`) e vai quebrar assim que houver qualquer app mobile, CDN de frontend separado ou integração de terceiros. Criar `config/cors.php` com `paths => ['api/*']`, `allowed_origins` explícitos vindos de uma env var `CORS_ALLOWED_ORIGINS` (separado por vírgula), `allowed_methods => ['*']`, `allowed_headers => ['*']`, `supports_credentials => true` (necessário para o fluxo de cookies do OAuth). Documentar a variável no `.env.example`.

**Critérios de aceite:**
- Requisição de origem não listada em `CORS_ALLOWED_ORIGINS` recebe erro de CORS no navegador (comportamento esperado de bloqueio).
- Frontend local (`localhost:4200`) volta a funcionar contra o backend sem precisar de configuração manual extra.
- `.env.example` documenta `CORS_ALLOWED_ORIGINS` com exemplo de valor para dev e produção.

---

### D-11 — Eliminar credencial de admin hardcoded
**Prioridade:** Alta

**Descrição:** `database/seeders/AdminSeeder.php` cria/atualiza `admin@educore.test` com senha `Admin@123!` em texto plano no código-fonte, condicionado a "nenhum admin existir" — se alguém rodar esse seeder contra produção (por engano, ou num pipeline futuro), cria-se um admin com senha pública e previsível. Alterar o seeder para gerar uma senha aleatória forte em tempo de execução e imprimi-la uma única vez no console (nunca gravar em log persistente), ou exigir uma variável de ambiente `INITIAL_ADMIN_PASSWORD` sem valor default — falhando explicitamente se não for informada. Adicionar também uma trava: o seeder deve recusar rodar se `APP_ENV=production` e a variável de confirmação `ALLOW_ADMIN_SEED=true` não estiver setada.

**Critérios de aceite:**
- Rodar o seeder sem configurar a senha/variável de confirmação falha com mensagem clara, não cria usuário nenhum.
- Rodar o seeder corretamente configurado cria o admin com senha forte, nunca hardcoded no repositório.
- Senha antiga `Admin@123!` não existe mais em nenhum lugar do código-fonte.

---

### D-12 — Proteger a auto-promoção a admin do "primeiro usuário"
**Prioridade:** Alta

**Descrição:** `AuthController::register` e `handleGoogleCallback` promovem automaticamente a admin qualquer cadastro feito quando não existe admin na base — isso é feito via endpoints **públicos** (registro e login Google). Se a tabela de usuários ficar vazia de admins por qualquer motivo (bug de migration, ambiente novo, `migrate:fresh` em homologação), o próximo visitante que se cadastrar vira admin da plataforma sem nenhuma verificação. Substituir essa lógica por um comando artisan explícito (`php artisan make:admin {email}`) para promoção manual, ou por uma variável de ambiente `INITIAL_ADMIN_EMAIL` checada apenas uma vez no boot da aplicação (não em toda requisição de registro público).

**Critérios de aceite:**
- Cadastro público nunca mais promove ninguém a admin automaticamente, em nenhuma circunstância.
- Existe um caminho documentado e seguro (comando artisan ou variável de ambiente de boot) para criar o primeiro admin de um ambiente novo.
- Teste Feature Laravel: registrar o primeiro usuário do zero e confirmar que ele NÃO recebe role admin.

---

### D-13 — Corrigir configuração da URL do AI Service
**Prioridade:** Média

**Descrição:** `AdminController.php` e `HealthController.php` usam `env('AI_SERVICE_URL', ...)` diretamente no código, fora de `config/`. Isso quebra silenciosamente em produção: depois de `php artisan config:cache` (comando que o próprio processo de deploy documentado roda), chamadas a `env()` fora do bootstrap retornam `null`, fazendo cair no valor hardcoded `http://localhost:8001` — inexistente no servidor — e o `/api/health` reporta o ai-service como "degraded" mesmo quando ele está saudável. Adicionar a chave `ai_service.url` em `config/services.php` lendo de `env('AI_SERVICE_URL')`, e trocar as duas ocorrências para usar `config('services.ai_service.url')`.

**Critérios de aceite:**
- Depois de rodar `php artisan config:cache` em qualquer ambiente, `/api/health` e `/api/admin/stats` continuam enxergando a URL correta do ai-service.
- `AI_SERVICE_URL` está documentada no `.env.example`.
- Nenhuma chamada a `env()` fora de arquivos `config/*.php` restante para essa variável.

---

### D-14 — Corrigir vulnerabilidades de segurança do Angular
**Prioridade:** Alta

**Descrição:** `npm audit` reporta 7 vulnerabilidades classificadas como "high" e 1 "moderate" nos pacotes `@angular/*` instalados (versão 20.3.21, faixa vulnerável confirmada: 20.0.0-next.0 até 20.3.24), incluindo duas falhas de bypass de sanitização (XSS) em binding de propriedade e em atributos de namespace. Rodar `npm audit fix` (ou atualizar manualmente os pacotes `@angular/*` para ≥20.3.25), rodar a suíte de testes e a suíte Cypress e2e existente por completo depois da atualização para garantir que não houve regressão de breaking changes de patch.

**Critérios de aceite:**
- `npm audit` não reporta mais vulnerabilidades "high" ou "critical" relacionadas ao Angular.
- Toda a suíte Cypress e2e (20 specs `bs-*`/`us-*`) passa sem regressão após a atualização.
- Build de produção (`ng build --configuration=production`) completa sem erro novo.

---

### D-15 — Validar arquivos por conteúdo real no upload de PDF
**Prioridade:** Alta

**Descrição:** O ai-service valida upload de PDF apenas pela extensão do nome do arquivo (`.pdf`), sem checar o conteúdo real (`content_type` do multipart ou os bytes mágicos `%PDF-` no início do arquivo). Qualquer arquivo renomeado para `.pdf` passa direto para o PyMuPDF/LlamaParse. Adicionar, em `documents.py`, uma checagem dos primeiros bytes do arquivo recebido (`file.read(5) == b'%PDF-'`) antes de salvar e processar, rejeitando com 400 e mensagem clara caso não seja um PDF real.

**Critérios de aceite:**
- Upload de um arquivo `.txt` renomeado para `.pdf` é rejeitado com erro 400 claro, sem chegar a acionar o pipeline de processamento (sem custo de LlamaParse/Gemini).
- Upload de PDF real continua funcionando normalmente.
- Teste automatizado (pytest) cobrindo ambos os casos.

---

### D-16 — Aplicar rate limit nos endpoints de áudio e visualização HTML
**Prioridade:** Média

**Descrição:** Os endpoints `GET /documents/{id}/audio` e `GET /documents/{id}/html-view` disparam geração real de IA (síntese de voz e geração de slides via Gemini, respectivamente) quando o conteúdo ainda não está em cache, mas não têm `@limiter.limit(...)` como os demais endpoints caros (upload, generate, exports) — ficam protegidos só pelo limite genérico de 100 req/min por IP, muito mais frouxo. Aplicar o mesmo padrão de rate limit por usuário já usado nos outros endpoints (`ai-service/app/routers/documents.py`), usando um limite razoável (ex: mesma política de `rate_generations_per_hour`).

**Critérios de aceite:**
- Repetir chamadas a `/audio` ou `/html-view` além do limite configurado retorna 429 com mensagem clara, mesmo vindo de IPs diferentes (limite por usuário, não só por IP).
- Uso normal (dentro do limite) não é afetado.

---

### D-17 — Garantir modo de produção seguro no ai-service
**Prioridade:** Média

**Descrição:** `config.py` do ai-service tem `debug: bool = True` como valor padrão — se a variável `DEBUG` não foi setada manualmente no Railway, os endpoints `/docs`, `/redoc` e `/openapi.json` ficam públicos em produção, expondo toda a documentação interna da API. Trocar o valor padrão de `debug` para `False` no código (fail-safe: precisa ser explicitamente ligado, nunca o contrário), e confirmar/setar `DEBUG=False` na variável de ambiente do Railway em produção.

**Critérios de aceite:**
- Ambiente sem a variável `DEBUG` setada roda com `/docs` e `/redoc` desativados por padrão.
- Confirmado manualmente que a variável `DEBUG=False` está setada no Railway de produção.
- Ambiente de desenvolvimento local continua conseguindo ativar `/docs` setando `DEBUG=True` explicitamente no `.env`.

---

### D-18 — Fortalecer política de senha e proteção contra força bruta
**Prioridade:** Média

**Descrição:** O cadastro hoje aceita qualquer senha com 8+ caracteres (`12345678` é válido). Usar a classe `Illuminate\Validation\Rules\Password` do próprio Laravel em `RegisterRequest`, exigindo letras maiúsculas, minúsculas, número e símbolo. Adicionar também proteção contra força bruta por conta (não só por IP, que já existe): usando a tabela `audit_logs` já existente (que já registra `LOGIN_FAILED`), bloquear temporariamente (ex: 15 minutos) uma conta específica após 5 tentativas de login falhas em menos de 10 minutos, retornando 429 com mensagem clara.

**Critérios de aceite:**
- Cadastro com senha fraca (ex: `12345678`, `senha123`) é rejeitado com mensagem explicando o requisito.
- 5 tentativas de login com senha errada para o mesmo e-mail em menos de 10 minutos bloqueiam novas tentativas por 15 minutos, mesmo trocando de IP.
- Teste Feature Laravel cobrindo cadastro com senha fraca e o bloqueio por tentativas.

---

## Fase 3 — LGPD e Compliance legal

### D-19 — Publicar Termos de Uso e Política de Privacidade com aceite no cadastro
**Prioridade:** Alta

**Descrição:** Não existem páginas de Termos de Uso ou Política de Privacidade — os links do rodapé apontam para `href="#"`. Criar as duas páginas no frontend (`/termos-de-uso` e `/politica-de-privacidade`, rotas públicas, conteúdo em Markdown ou HTML estático versionado no repositório), com uma versão/data visível. Adicionar checkbox obrigatório "Li e aceito os Termos de Uso e a Política de Privacidade" na tela de cadastro, e no backend salvar `terms_accepted_at` (timestamp) e `terms_version` (string) na tabela `users` no momento do registro — sem isso, o cadastro deve ser rejeitado com 422. **Atenção jurídica:** o conteúdo dos textos deve ser revisado por advogado antes da publicação; esta demanda cobre a implementação técnica (páginas, checkbox, persistência), não a redação jurídica final.

**Critérios de aceite:**
- Cadastro sem marcar o checkbox de aceite é rejeitado com mensagem clara.
- Cadastro bem-sucedido grava `terms_accepted_at` e `terms_version` no usuário.
- Páginas `/termos-de-uso` e `/politica-de-privacidade` estão acessíveis publicamente (sem login) e os links do rodapé apontam para elas.
- Migration adicionando `terms_accepted_at` e `terms_version` à tabela `users`.

---

### D-20 — Banner de consentimento de cookies
**Prioridade:** Média

**Descrição:** Não existe nenhum aviso de cookies no site. Implementar um banner simples (sem biblioteca de terceiros pesada) que aparece na primeira visita, com opções "Aceitar" e link para a Política de Privacidade (da demanda D-19), persistindo a escolha em `localStorage` para não reaparecer a cada visita.

**Critérios de aceite:**
- Banner aparece na primeira visita de um navegador novo (sem cookie/localStorage prévio).
- Após aceitar, não reaparece em visitas subsequentes no mesmo navegador.
- Banner não bloqueia o uso do site (usuário pode navegar mesmo sem interagir com ele).

---

### D-21 — Exclusão de conta e exportação de dados pessoais (LGPD)
**Prioridade:** Alta

**Descrição:** Não existe nenhum mecanismo de "direito ao esquecimento" ou portabilidade de dados. Adicionar na tela de perfil: botão "Exportar meus dados" (`GET /profile/export`, retorna um JSON/ZIP com os dados do usuário no MySQL — nome, email, data de cadastro — mais uma chamada ao ai-service para incluir metadados dos documentos processados, sem o conteúdo binário dos PDFs) e botão "Excluir minha conta" (`DELETE /profile`, com confirmação explícita de senha antes de executar) que faz soft-delete do usuário, anonimiza o nome/e-mail (ex: `deleted-user-{id}@educore.invalid`), revoga todos os tokens, e dispara (via evento assíncrono) a exclusão dos documentos correspondentes no ai-service.

**Critérios de aceite:**
- Usuário consegue baixar um arquivo com seus próprios dados pessoais.
- Usuário consegue excluir a própria conta mediante confirmação de senha; após excluída, não consegue mais fazer login.
- Dados do usuário excluído ficam anonimizados no banco (não é hard-delete, para preservar integridade referencial de auditoria), mas deixam de ser pessoalmente identificáveis.
- Teste Feature Laravel cobrindo exportação e exclusão, incluindo a exigência de confirmação de senha.

---

## Fase 4 — Confiabilidade e Infraestrutura

### D-22 — Migrar armazenamento de PDFs para storage persistente
**Prioridade:** Alta

**Descrição:** O ai-service salva os PDFs enviados em `uploads/` no disco local do container — no Railway (onde o serviço roda), o filesystem é efêmero e todo arquivo processado **some a cada redeploy**. O próprio `config.py` já tem os campos preparados (`pdf_storage_provider`, `s3_*`, `supabase_url`) mas nenhum provedor está implementado de fato. Implementar upload para Supabase Storage (já usado no projeto para o Postgres, reduz número de provedores) ou Cloudflare R2/S3, criando um serviço `storage_service.py` com uma interface simples (`save(file) -> url`, `get(path) -> bytes`, `delete(path)`), trocando todas as leituras/escritas de `uploads/` em `documents.py` e `rag_service.py` para usar esse serviço, mantendo compatibilidade com o modo local (`pdf_storage_provider=local`) para desenvolvimento.

**Critérios de aceite:**
- PDF enviado antes de um redeploy do ai-service no Railway continua acessível depois do redeploy.
- Renovação automática da URI do Gemini Files (já existente) volta a funcionar mesmo após redeploy.
- Ambiente de desenvolvimento local continua funcionando com `pdf_storage_provider=local` sem precisar de credenciais de nuvem.
- Teste manual: processar um documento, forçar redeploy (ou reiniciar o container local simulando perda de disco), confirmar que o reprocessamento/renovação de URI ainda encontra o arquivo.

---

### D-23 — Watchdog para documentos travados no processamento
**Prioridade:** Alta

**Descrição:** O pipeline de processamento roda via `BackgroundTasks` do FastAPI, sem fila persistente. Se o processo cair no meio (crash, OOM, redeploy), o documento fica com `status='processing'` para sempre, sem nenhuma detecção. Criar uma rotina periódica (job agendado, ex: a cada 5 minutos, usando `apscheduler` ou uma tarefa simples no `lifespan` do FastAPI) que identifica documentos com `status='processing'` e `updated_at` há mais de 15 minutos, marca como `status='failed'` com uma mensagem de erro explicando o timeout, e permite que o usuário tente reprocessar pelo frontend (adicionar botão "Tentar novamente" na tela de status do documento quando `status='failed'`).

**Critérios de aceite:**
- Documento artificialmente travado em "processing" há mais de 15 minutos é automaticamente marcado como `failed` pela rotina.
- Usuário vê o status de erro e consegue clicar em "Tentar novamente", reiniciando o pipeline do zero para aquele documento.
- Teste automatizado simulando um documento travado e confirmando que a rotina o marca como failed.

---

### D-24 — Eliminar o gargalo de concorrência do ai-service
**Prioridade:** Alta

**Descrição:** O ai-service roda com um único worker (`uvicorn` sem `--workers`), e as chamadas mais caras (SDK do Gemini, geração de PPTX com `python-pptx`, síntese de TTS, chamadas `httpx` bloqueantes ao Pexels) são funções síncronas executadas direto dentro de handlers `async def`, sem `asyncio.to_thread`/`run_in_executor` — isso significa que **dois usuários gerando conteúdo ao mesmo tempo travam o serviço inteiro** para todo mundo, inclusive o `/health`. Envolver todas as chamadas síncronas identificadas (`rag_service.py`: `_gerar_conteudo`, `_chat_openai`; `pptx_service.py`: geração de apresentação; `tts_service.py`: síntese; `reveal_service.py`: chamadas ao Pexels) com `asyncio.to_thread(...)`, e configurar o Procfile/Dockerfile para rodar com múltiplos workers (`uvicorn main:app --workers 2` ou mais, conforme os recursos do plano Railway).

**Critérios de aceite:**
- Dois documentos sendo processados/gerados ao mesmo tempo (teste manual com duas abas/usuários) não travam a resposta um do outro nem o `/health`.
- Teste de carga simples (ex: `locust` ou script com `asyncio`/`httpx` disparando 5 gerações simultâneas) confirma que o tempo de resposta não cresce linearmente com o número de requisições simultâneas da forma que cresce hoje.
- Nenhuma regressão nas gerações existentes (quiz, resumo, slides, mapa mental, flashcards, PCD).

---

### D-25 — Definir e implementar backup dos bancos de dados
**Prioridade:** Alta

**Descrição:** Não existe nenhuma rotina de backup documentada nem configurada para o MySQL (Hostinger) ou o PostgreSQL (Supabase). Configurar: no Supabase, ativar backups automáticos diários (recurso nativo do plano, verificar se o plano atual inclui ou se precisa upgrade) com retenção mínima de 7 dias; na Hostinger, configurar um cron job (`hPanel → Cron Jobs`) que roda `mysqldump` diariamente e envia o arquivo para um storage externo (ex: o mesmo bucket S3/Supabase Storage da demanda D-22), com rotação/retenção de 7-14 dias. Documentar o procedimento de restauração passo a passo em `DEPLOY.private.md`.

**Critérios de aceite:**
- Existe um backup automático diário verificável de ambos os bancos, com pelo menos 7 dias de retenção.
- Procedimento de restauração testado manualmente pelo menos uma vez (restaurar um backup em um ambiente de teste e confirmar integridade).
- Passo a passo de restauração documentado.

---

### D-26 — Migrar schema do ai-service para migrations versionadas com connection pooling
**Prioridade:** Média

**Descrição:** O schema do PostgreSQL do ai-service é criado por `init_db()`, que roda `CREATE TABLE IF NOT EXISTS` a cada boot da aplicação — sem versionamento, sem histórico de mudanças, com risco de corrida de DDL se múltiplas instâncias subirem ao mesmo tempo (relevante após a demanda D-24 adicionar múltiplos workers). Além disso, cada chamada abre uma nova conexão `psycopg2` (2-3 por requisição), pressionando o limite do connection pooler do Supabase. Migrar para Alembic (gerar a migration inicial a partir do schema atual, depois todo novo campo/tabela vira uma migration versionada) e trocar `get_connection()` por um pool de conexões (`psycopg2.pool.SimpleConnectionPool` ou um engine SQLAlchemy com pool).

**Critérios de aceite:**
- `alembic upgrade head` cria o schema do zero corretamente em um banco vazio.
- Múltiplas instâncias do ai-service subindo ao mesmo tempo não geram erro de DDL concorrente.
- Número de conexões simultâneas ao Postgres não cresce linearmente com o número de requisições (confirmável via métricas do Supabase).

---

## Fase 5 — Billing e Monetização

### D-27 — Implementar planos e quota de uso (sem cobrança ainda)
**Prioridade:** Alta

**Descrição:** Hoje não existe nenhum conceito de plano, limite mensal ou diferenciação Free/Pro no sistema — qualquer usuário cadastrado tem acesso ilimitado (só os rate limits técnicos genéricos do BS-021 se aplicam). Criar no Laravel: migrations `plans` (slug, name, price_cents, interval, limits_json com `pdfs_per_month`/`generations_per_month`, is_active) e `usage_counters` (user_id, period `YYYY-MM`, pdfs_used, generations_used — único por usuário+período); seed inicial com planos Free (3 PDFs/mês), Pro (30 PDFs/mês) e Equipe (150 PDFs/mês); estender `GET /auth/verify` (já consumido e cacheado pelo ai-service) para retornar `plan`, `limits` e `usage` do usuário. No ai-service: usar esses dados para bloquear com `HTTP 402 Payment Required` (mensagem clara de upgrade) quando o limite for atingido, tanto no upload quanto na geração de conteúdo, e criar `POST /api/usage/increment` no Laravel (chamado pelo ai-service após cada sucesso) para incrementar o contador do período atual de forma atômica (`UPDATE ... WHERE pdfs_used < limit`, evitando race condition em uploads simultâneos). No frontend: badge no header mostrando uso do mês ("7/30 PDFs este mês"), e um modal amigável (não só um erro técnico) quando a API retornar 402, convidando para upgrade.

**Critérios de aceite:**
- Usuário no plano Free é bloqueado ao tentar processar o 4º PDF do mês, com mensagem clara de upgrade (não um erro genérico).
- Contador de uso reseta automaticamente a cada novo mês.
- Dois uploads simultâneos no limite exato não conseguem ambos passar (sem race condition).
- Admin consegue mudar o plano de um usuário manualmente via banco ou uma rotina simples (não precisa de UI de admin para isso ainda, só a estrutura de dados).
- Teste Feature Laravel/pytest cobrindo bloqueio no limite, reset mensal e a checagem atômica.

---

### D-28 — Implementar cobrança recorrente via Asaas
**Prioridade:** Alta

**Descrição:** Não existe nenhuma integração de pagamento no EduCore. Portar a integração já existente e validada no projeto Votar (`PagamentoAsaasControlador`) para o Laravel do EduCore: migrations `subscriptions` (user_id, plan_id, status enum active/past_due/canceled/trialing, gateway_subscription_id, current_period_start/end, canceled_at, trial_ends_at) e `payments` (subscription_id, amount_cents, status, gateway_payment_id único para idempotência, paid_at, raw_payload_json); rotas `POST /billing/subscribe` (cria cliente+assinatura no Asaas, retorna URL de pagamento), `GET /billing/subscription` (status atual), `POST /billing/cancel` (cancela ao fim do período pago, não imediatamente), `GET /plans` (público, catálogo), `POST /webhooks/asaas` (público, valida payload, trata `payment.confirmed`/`payment.overdue`/`subscription.canceled`, idempotente via `gateway_payment_id`). Criar página `/precos` no frontend (catálogo público de planos) e `/conta/assinatura` (status, uso do mês, botão de upgrade/cancelamento). **Atenção LGPD:** nunca armazenar dados de cartão — guardar apenas os IDs de referência do gateway.

**Critérios de aceite:**
- Usuário consegue assinar um plano pago, ser redirecionado ao checkout do Asaas, e ter a assinatura ativada automaticamente após confirmação via webhook.
- Reenvio duplicado do mesmo webhook do Asaas não gera cobrança nem ativação duplicada (idempotência confirmada).
- Cancelamento mantém acesso até o fim do período já pago, não corta na hora.
- Página `/precos` está no ar publicamente e reflete os planos reais cadastrados no banco.
- Teste Feature Laravel simulando os principais eventos de webhook (confirmado, atrasado, cancelado).

---

### D-29 — Painel de gestão de assinatura para o usuário
**Prioridade:** Média

**Descrição:** Complementar a demanda D-28 com uma experiência completa de autogestão: na página `/conta/assinatura`, mostrar histórico dos últimos pagamentos (`GET /billing/payments`), permitir trocar de plano (upgrade/downgrade, recalculando proporcionalmente ou aplicando na próxima renovação — decisão de negócio a confirmar com o Fernando antes de implementar o cálculo), e enviar e-mails automáticos (via fila) nos eventos: boas-vindas ao assinar, aviso de pagamento recusado, aviso 3 dias antes do fim do trial.

**Critérios de aceite:**
- Usuário consegue ver seu histórico de pagamentos completo.
- Usuário consegue trocar de plano pela própria interface, sem intervenção manual.
- E-mails automáticos disparam corretamente nos 3 eventos listados, via fila (não bloqueando a requisição).

---

### D-30 — Dashboard de métricas de negócio para o admin
**Prioridade:** Média

**Descrição:** Estender o `AdminController`/dashboard já existente (que hoje mostra KPIs de uso técnico) com métricas de negócio: MRR (soma de `price_cents` das assinaturas ativas), churn mensal (cancelamentos ÷ assinantes ativos no início do mês), taxa de conversão Free→Pago, e lista de assinaturas com pagamento em atraso (`status=past_due`) para ação manual de cobrança. Adicionar `GET /admin/billing-stats` no Laravel e o card correspondente no dashboard do frontend.

**Critérios de aceite:**
- Admin visualiza MRR atual, churn do mês corrente e taxa de conversão diretamente no dashboard, sem precisar consultar o banco manualmente.
- Lista de assinaturas em atraso é visível e acionável (link para contatar o usuário).
- Dados batem com uma conferência manual simples no banco (ex: contar assinaturas ativas × preço do plano).

---

## Fase 6 — Backlog funcional (valor de produto)

### D-31 — Feedback de conteúdo gerado
**Prioridade:** Média

**Descrição:** Não existe forma do usuário avaliar a qualidade do quiz/resumo/slides gerados. Criar no Laravel: migration `content_feedbacks` (user_id, document_id, generation_type, rating 1-5, comment, timestamps, único por usuário+documento+tipo via upsert), `FeedbackController` com `POST /feedback` (autenticado) e `GET /admin/feedback` + `GET /admin/feedback/stats` (média por tipo de geração, admin only). No frontend: widget de estrelas (PrimeNG `p-rating`) no rodapé de cada tipo de resultado (quiz, resumo, slides, mapa mental, flashcards, PCD), não bloqueante, com campo opcional de comentário.

**Critérios de aceite:**
- Usuário consegue avaliar um resultado gerado com 1-5 estrelas e comentário opcional, sem que isso trave o uso do conteúdo.
- Reenviar avaliação para o mesmo documento+tipo atualiza (não duplica) o registro.
- Admin consegue ver a média de avaliação por tipo de geração.
- Teste Feature Laravel cobrindo criação, upsert e a agregação de stats.

---

### D-32 — Compressão de PDFs grandes antes do processamento
**Prioridade:** Baixa

**Descrição:** PDFs grandes (>10MB) hoje vão inteiros para o LlamaParse (cobrado por página) sem nenhuma otimização. No ai-service, usando PyMuPDF (já uma dependência do projeto), comprimir PDFs acima de um limiar configurável (`PDF_COMPRESSION_THRESHOLD_MB`, default 10) reduzindo a qualidade de imagens internas (`deflate_images=True`, ~72dpi) antes de salvar e processar. Se a compressão falhar por qualquer motivo, seguir com o arquivo original (nunca travar o upload por causa disso). Registrar `compressed: bool` e o tamanho antes/depois no log.

**Critérios de aceite:**
- PDF grande com muitas imagens é comprimido perceptivelmente (log mostra a razão de compressão) sem perda de legibilidade do texto extraído.
- PDF já pequeno (abaixo do limiar) não é tocado.
- Falha na compressão nunca impede o upload de prosseguir com o arquivo original.

---

### D-33 — Suporte a múltiplos idiomas na geração de conteúdo
**Prioridade:** Média

**Descrição:** Toda geração hoje sai em português, mesmo que o usuário processe um PDF em outro idioma ou queira o material de estudo traduzido. No ai-service, adicionar campo opcional `language` (`pt-BR` default, `en-US`, `es-ES`) no schema de geração (`GenerationRequest`), injetando a instrução de idioma correspondente em todos os prompts enviados ao Gemini (quiz, resumo, slides, mapa mental, flashcards, PCD), e salvando o idioma usado em `generations.metadata`. No frontend, adicionar um seletor de idioma (bandeiras 🇧🇷/🇺🇸/🇪🇸) na tela de resultado, antes de cada geração, persistindo a preferência em `localStorage`, e exibindo um badge do idioma junto ao conteúdo gerado.

**Critérios de aceite:**
- Gerar o mesmo documento em português e depois em inglês produz conteúdo de fato em cada idioma (enunciados, alternativas, explicações).
- Preferência de idioma é lembrada entre sessões no mesmo navegador.
- Idioma usado em cada geração fica registrado e visível.

---

### D-34 — Cache de embeddings entre gerações do mesmo documento
**Prioridade:** Média

**Descrição:** Hoje, embeddings são recalculados via API do Gemini toda vez que uma nova geração é solicitada para um documento já processado, mesmo que o conteúdo não tenha mudado — desperdiçando tempo e custo de API. No ai-service, antes de gerar embeddings, checar se já existem chunks com embedding calculado para aquele `document_id` na tabela `embeddings`; se existirem, reutilizar diretamente na busca semântica (pgvector), sem chamar a API de embedding de novo. Adicionar `embeddings_generated_at` em `documents` e um endpoint `POST /documents/{id}/reindex` (admin only) para forçar regeneração quando necessário.

**Critérios de aceite:**
- Segunda geração de conteúdo para o mesmo documento é mensuravelmente mais rápida e não dispara nova chamada à API de embeddings (confirmável no log).
- `POST /documents/{id}/reindex` força a regeneração quando chamado.
- Nenhuma regressão na qualidade da busca semântica (RAG) para documentos já processados.

---

### D-35 — Operações em lote em Meus Documentos
**Prioridade:** Baixa

**Descrição:** Depende funcionalmente da tela "Meus Documentos" existir (ver D-36 — pode ser implementada em conjunto ou logo em seguida). No ai-service, criar `DELETE /documents/bulk` (body `{ids: []}`, valida ownership de cada um, limite de 20 por chamada, retorna `{deleted, errors}`) e `GET /documents/bulk-export` (retorna um ZIP com os PDFs originais selecionados, usando `zipfile` da stdlib). No frontend, adicionar checkbox por documento na listagem, barra de ações flutuante quando houver seleção, com confirmação antes de excluir em massa.

**Critérios de aceite:**
- Usuário consegue selecionar múltiplos documentos e excluí-los ou baixá-los em um único ZIP de uma vez.
- Tentar excluir documento de outro usuário via manipulação do payload retorna erro, sem afetar os documentos do solicitante.
- Limite de 20 documentos por operação é respeitado, com mensagem clara se excedido.

---

### D-36 — Tela "Meus Documentos" (histórico completo)
**Prioridade:** Média

**Descrição:** Não existe hoje uma tela central de histórico de PDFs processados — o usuário só vê os documentos recentes na tela de upload. Criar rota `/meus-docs` (protegida por `authGuard`) com grid de cards mostrando nome, data de upload, tamanho, status e número de gerações de cada documento, filtro por status e busca por nome, paginação (25 por página), navegação para o resultado ao clicar num card, e exclusão individual com confirmação — usando os endpoints `GET /documents` e `DELETE /documents/{id}` que já existem no ai-service.

**Critérios de aceite:**
- Usuário consegue ver todo o seu histórico de documentos, filtrar, buscar e paginar.
- Clicar em um documento processado leva diretamente ao resultado já gerado, sem reprocessar.
- Excluir um documento remove-o da lista e do backend, com confirmação prévia.

---

### D-37 — Compartilhamento de resultado via link público
**Prioridade:** Baixa

**Descrição:** Não existe forma de compartilhar um quiz/resumo/slides gerado com alguém que não tem conta no EduCore. No Laravel, criar migration `shared_links` (id, token único, user_id, document_id, generation_type, generation_data JSON — snapshot do conteúdo, para servir sem depender do ai-service —, expires_at), `ShareController` com `POST /share` (gera/reutiliza token, upsert por usuário+documento+tipo, expiração de 30 dias) e `GET /share/{token}` (público). No frontend, botão "Compartilhar" em cada tela de resultado que copia o link público, e uma rota pública `/p/{token}` (sem `authGuard`) que exibe o conteúdo com branding mínimo do EduCore.

**Critérios de aceite:**
- Link gerado funciona sem login em uma aba anônima/outro navegador.
- Link expira automaticamente após 30 dias, retornando página de "link expirado" amigável.
- Gerar novamente o link para o mesmo documento+tipo reaproveita o token existente (não cria vários links diferentes para a mesma coisa).

---

### D-38 — Analytics de uso (visão admin e visão do professor)
**Prioridade:** Média

**Descrição:** Não existe visão agregada de uso da plataforma além dos KPIs básicos do dashboard admin atual. Para o admin: `GET /admin/analytics` (docs/dia, gerações/dia, usuários ativos/dia nos últimos 30 dias, com filtro de período), `GET /admin/analytics/types` (distribuição por tipo de geração), `GET /admin/analytics/retention` (usuários que voltaram em 7/14/30 dias) — combinando dados do MySQL (login/cadastro via `audit_logs`) com uma consulta ao ai-service para os dados de documentos/gerações, com cache de 10 minutos. Para o professor: rota `/analytics` no frontend com KPIs pessoais (total de PDFs, gerações, tipo mais usado), gráfico de linha (gerações por dia, usando Chart.js já disponível no projeto) e tabela dos últimos 10 documentos.

**Critérios de aceite:**
- Admin consegue ver tendência de uso da plataforma nos últimos 30 dias, com cache funcionando (segunda chamada dentro de 10 min não recalcula do zero).
- Professor consegue ver seus próprios números de uso sem acessar dados de outros usuários.
- Números batem com uma conferência manual simples (contagem direta no banco para um período curto).

---

### D-39 — Pesquisa de satisfação (NPS) pós-exportação
**Prioridade:** Baixa

**Descrição:** Depende da demanda D-31 (reaproveita a mesma tabela `content_feedbacks`, com um campo adicional `export_type`). Após o download de qualquer exportação (PPTX, Kahoot, SCORM, Socrative), exibir um dialog não bloqueante de avaliação (5 estrelas + comentário opcional), que aparece só uma vez por combinação documento+tipo de exportação por sessão (`sessionStorage`), com fechamento automático em 15 segundos se o usuário não interagir.

**Critérios de aceite:**
- Dialog aparece após o download iniciar (nunca antes, nunca bloqueando o download em si).
- Não aparece de novo para a mesma exportação na mesma sessão do navegador.
- Fecha sozinho depois de 15s sem interação, sem gerar erro.

---

## Fase 7 — Observabilidade, Testes e Performance

### D-40 — Monitoramento de erros em produção (Sentry) nos três serviços
**Prioridade:** Alta

**Descrição:** Não existe nenhuma ferramenta de monitoramento de erros — descobrir um problema em produção hoje depende de entrar via SSH e ler arquivos de log manualmente. Integrar Sentry (ou alternativa equivalente) no Laravel (`sentry/sentry-laravel`), no ai-service (`sentry-sdk` com integração FastAPI) e no Angular (`@sentry/angular`), capturando exceções não tratadas nos três serviços, com ambiente (`production`/`homolog`/`local`) e release configurados corretamente para diferenciar os relatórios.

**Critérios de aceite:**
- Uma exceção forçada (endpoint de teste temporário, removido depois) aparece no painel do Sentry em cada um dos três serviços, com stack trace legível.
- Dados sensíveis (senhas, tokens) não vazam nos eventos capturados (configurar `before_send` para redação).
- Alertas por e-mail configurados para erros novos ou com pico de frequência.

---

### D-41 — Cobertura de testes automatizados para fluxos críticos
**Prioridade:** Alta

**Descrição:** A suíte de testes unitários do Laravel (só `AuthTest.php` tem conteúdo real) e do Angular (28 specs, todos boilerplate "should create") não cobrem lógica de negócio de verdade — a única rede de segurança real hoje é a suíte Cypress e2e. E o ai-service não tem nenhum teste automatizado. Criar: testes Feature Laravel para `AdminController` completo (roles, bloqueio — cobrindo a correção da D-09 —, auditoria), `CheckRole`, `HealthController`, verificação de e-mail e OAuth Google; testes unitários Angular reais para `auth.service.ts` (login, refresh, logout), `result-store.service.ts` (persistência), e o cálculo de força de senha do cadastro; suíte pytest inicial no ai-service cobrindo `ownership_check`, a cadeia de fallback de provedores de IA, e o parsing de resposta do LLM (casos de JSON malformado).

**Critérios de aceite:**
- Cobertura de teste mensurável (ex: `php artisan test --coverage`, `ng test --code-coverage`, `pytest --cov`) sobre os módulos listados acima, não apenas contagem de arquivos.
- Suíte inteira (Laravel + Angular unit + pytest + Cypress) roda em menos de 10 minutos e pode ser plugada em CI no futuro.
- Nenhum teste "should create" vazio permanece nos arquivos listados — cada um testa comportamento real.

---

### D-42 — Otimizar performance e SEO do frontend
**Prioridade:** Média

**Descrição:** O bundle inicial do Angular carrega o painel admin inteiro (dashboard, users, forum, chat) e todos os 6 tipos de resultado mesmo para um visitante anônimo na home (1.38MB só de `main.js`), porque nenhuma rota usa lazy loading (`loadComponent`). Converter as rotas de `app.routes.ts` para lazy loading, especialmente a área `/admin/*` e os tipos de resultado. Além disso, remover as 18MB/438 imagens mortas em `public/images/` (sobras de template, zero referências no código) e as dependências não usadas `@angular/material`/`@angular/cdk` (o projeto usa exclusivamente PrimeNG).

**Critérios de aceite:**
- Bundle inicial (`main.js` da rota `/`) reduz significativamente de tamanho após o lazy loading (medir antes/depois com `ng build --stats-json`).
- `public/images/` não contém mais arquivos sem referência no código.
- `package.json` não lista mais `@angular/material` nem `@angular/cdk`.
- Nenhuma regressão visual ou funcional em nenhuma rota após as mudanças.

---

### D-43 — Decidir e implementar o destino do SSR
**Prioridade:** Baixa

**Descrição:** O projeto tem todo o scaffold de Angular SSR configurado (`app.config.server.ts`, `server.ts` com Express, `provideClientHydration`) mas `app.routes.server.ts` força `RenderMode.Client` em todas as rotas, anulando qualquer ganho — e o deploy real em produção serve a build como SPA estática via PHP/LiteSpeed, nem chega a usar o servidor Express do SSR. Tomar uma decisão explícita: (a) ativar SSR de verdade pelo menos nas rotas públicas que importam para SEO (home, `/precos`, páginas de termos/privacidade), ajustando o pipeline de deploy para rodar o servidor Node do Angular SSR em vez de servir HTML estático; ou (b) remover todo o scaffold de SSR não utilizado, simplificando o projeto. Esta demanda deve começar com uma decisão de produto (o quanto SEO orgânico importa para a estratégia de aquisição do `PLANO-MARKETING-EDUCORE.md`) antes de qualquer código.

**Critérios de aceite:**
- Existe uma decisão documentada (SSR ativo ou removido) com a justificativa.
- Se ativado: as rotas públicas escolhidas retornam HTML já renderizado no `view-source`, sem quebrar a hidratação no cliente.
- Se removido: nenhum arquivo/dependência de SSR morto permanece no repositório.

---

### D-44 — Padronizar tratamento de erros e limpar código morto no frontend
**Prioridade:** Média

**Descrição:** Hoje existem três padrões diferentes de exibição de erro coexistindo (o interceptor HTTP global via `ToastService`, componentes que também disparam seu próprio toast para o mesmo erro — duplicando a mensagem ao usuário —, e formulários de auth com signals locais de erro), além de `features/classes` usar uma instância própria de `MessageService` do PrimeNG em vez do `ToastService` compartilhado. Unificar em um único padrão: o interceptor trata todos os erros de rede genéricos (401/422/429/500), e componentes só tratam erros de validação específica de formulário localmente — removendo os toasts duplicados encontrados em `panel.ts`, `chat.ts`/`forum.ts` (ajustar após as demandas D-05/D-06) e migrando `classes` para o `ToastService` compartilhado. Adicionar também um `ErrorHandler` global customizado do Angular para capturar exceções não tratadas de renderização, evitando tela em branco sem feedback nenhum ao usuário.

**Critérios de aceite:**
- Nenhum erro de API dispara mais de um toast simultâneo para o usuário.
- `features/classes` usa o `ToastService` compartilhado, sem `MessageService` próprio.
- Uma exceção de renderização forçada (para teste) mostra uma tela de erro amigável em vez de tela em branco.

---

## Fase 8 — Lançamento e Aquisição de Clientes

> Esta fase só deve começar depois que a Fase 5 (Billing) estiver completamente no ar — gastar esforço de marketing antes do checkout funcionar de ponta a ponta é esforço perdido, conforme já definido em `PLANO-MARKETING-EDUCORE.md`.

### D-45 — Validar diferencial competitivo e produzir vídeos demo
**Prioridade:** Alta

**Descrição:** Fazer um teste lado a lado real entre o EduCore e os dois concorrentes diretos identificados e verificados (Smallpdf, SlideSpeak) usando o mesmo PDF de entrada, para decidir honestamente qual diferencial é defensável hoje (qualidade visual do slide é o candidato mais forte, segundo `PLANO-MARKETING-EDUCORE.md`). A partir do resultado, gravar 6 vídeos curtos (formato Instagram/TikTok): 3 demos "PDF vira X em segundos" (quiz, resumo, slides) e 3 comparativos "antes/depois" (tempo manual vs. EduCore), sem usar jargão técnico (nunca mencionar "RAG", "embeddings", "pgvector" no material voltado ao cliente final).

**Critérios de aceite:**
- Comparação lado a lado documentada (prints ou vídeo) com uma conclusão clara sobre o diferencial a comunicar.
- 6 vídeos finalizados, com duração adequada a Reels/TikTok (15-60s), sem jargão técnico.
- Vídeos aprovados pelo Fernando antes da publicação.

---

### D-46 — Lançar presença em redes sociais e programa de indicação
**Prioridade:** Alta

**Descrição:** Criar os perfis comerciais do EduCore no Instagram e TikTok (bio com link para `/precos`), publicar os vídeos da demanda D-45 com uma cadência mínima de 3 posts/semana, entrar em pelo menos 10 grupos de WhatsApp/Telegram/Facebook de professores (ajudando antes de vender, conforme a regra do `PLANO-MARKETING-EDUCORE.md`), e desenhar um programa de indicação simples (ex: 20-30% de comissão recorrente nos 3 primeiros meses do indicado, ou 1 mês grátis por indicação convertida).

**Critérios de aceite:**
- Perfis Instagram e TikTok publicados e ativos, com link de bio funcional para `/precos`.
- Pelo menos 10 grupos de professores mapeados e com presença ativa (não só entrada silenciosa).
- Programa de indicação com regra clara documentada e mecanismo de rastreio (mesmo que manual no início, ex: código de cupom).

---

### D-47 — Recrutar beta testers e coletar depoimentos
**Prioridade:** Alta

**Descrição:** Recrutar 10-15 professores beta (via os grupos da demanda D-46 ou rede quente) para usar o EduCore com trial estendido sem cobrança, especificamente para gerar prova social antes de abrir tráfego pago. Acompanhar de perto a métrica de ativação (cadastro → primeiro PDF processado com sucesso) desse grupo, resolvendo qualquer atrito encontrado, e coletar pelo menos 5 depoimentos em vídeo curto de quem teve boa experiência.

**Critérios de aceite:**
- 10-15 professores beta recrutados e ativos na plataforma.
- Taxa de ativação desse grupo (cadastro → 1º PDF processado) medida e documentada.
- Pelo menos 5 depoimentos em vídeo coletados e com autorização de uso.

---

### D-48 — Publicar página de preços otimizada para conversão
**Prioridade:** Alta

**Descrição:** Complementar tecnicamente a página `/precos` já criada na demanda D-28 com copywriting de conversão real: proposta de valor por segmento (começando por professor autônomo, conforme `PLANO-MARKETING-EDUCORE.md`), sem jargão técnico, com prova social (depoimentos da demanda D-47) assim que disponíveis, e metatags básicas de SEO (title, description, Open Graph) para compartilhamento em redes sociais.

**Critérios de aceite:**
- Página `/precos` no ar com copy revisado (não genérico "PDF vira quiz"), sem menção a arquitetura técnica.
- Metatags de Open Graph corretas ao compartilhar o link no WhatsApp/redes sociais (preview com título/imagem/descrição corretos).
- Pelo menos 1 depoimento real exibido assim que disponível.

---

### D-49 — Primeira campanha de tráfego pago controlada
**Prioridade:** Média

**Descrição:** Só deve começar depois de confirmar conversão orgânica saudável (pelo menos 10-20 assinantes vindos organicamente, conforme regra explícita do `PLANO-MARKETING-EDUCORE.md`). Configurar uma campanha pequena no Meta Ads (Instagram/Facebook), segmentada por interesse em educação/concursos/ensino no Brasil, com orçamento de teste de R$500-1000, usando os vídeos da demanda D-45 como criativos, direcionando para `/precos` com pixel de conversão instalado para medir cadastro → ativação → pagamento.

**Critérios de aceite:**
- Pixel de conversão instalado e disparando corretamente nos eventos de cadastro e assinatura paga.
- Campanha rodando dentro do orçamento definido, com custo por assinante calculado ao final do teste.
- Decisão documentada (escalar, ajustar ou pausar) com base no resultado real, não em suposição.

---

## Como usar este catálogo

1. Rode o script de limpeza para remover as 33 tarefas antigas do board Educore no Avante.
2. Importe as demandas acima (formato JSON pronto em `demandas-educore-comercial-tasks.json`, mesma pasta deste arquivo).
3. Execute na ordem das fases — cada fase pressupõe que a anterior está resolvida (não porque uma demanda dependa tecnicamente da outra dentro da mesma fase, mas porque faz pouco sentido, por exemplo, investir em marketing antes de cobrança funcionar).
