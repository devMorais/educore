-- ============================================================
-- EduCore — Recriacao completa do backlog comercial (board Educore, board_id=7)
-- Gerado automaticamente a partir de demandas-educore-comercial-tasks.json
-- Executar em uma unica sessao, na ordem: tags -> sprints -> tasks -> task_tag
-- ============================================================

-- 1) TAGS
INSERT INTO tags (board_id, name, color, created_at, updated_at) VALUES
(7, 'Laravel', '#FF2D20', NOW(), NOW()),
(7, 'Angular', '#DD0031', NOW(), NOW()),
(7, 'AI-Service', '#7C3AED', NOW(), NOW()),
(7, 'Seguranca', '#DC2626', NOW(), NOW()),
(7, 'LGPD', '#0891B2', NOW(), NOW()),
(7, 'Billing', '#059669', NOW(), NOW()),
(7, 'Infraestrutura', '#D97706', NOW(), NOW()),
(7, 'Performance', '#4F46E5', NOW(), NOW()),
(7, 'Testes', '#16A34A', NOW(), NOW()),
(7, 'Correcao-Fachada', '#EA580C', NOW(), NOW()),
(7, 'Marketing', '#DB2777', NOW(), NOW());

-- 2) SPRINTS
INSERT INTO sprints (board_id, name, start_date, end_date, created_at, updated_at) VALUES
(7, 'Sprint 1 - Corrigir Fachada Critica e Seguranca Inicial (06-12/07)', '2026-07-06', '2026-07-12', NOW(), NOW()),
(7, 'Sprint 2 - Finalizar Fachada e Seguranca IA (13-19/07)', '2026-07-13', '2026-07-19', NOW(), NOW()),
(7, 'Sprint 3 - Seguranca e Infraestrutura (20-26/07)', '2026-07-20', '2026-07-26', NOW(), NOW()),
(7, 'Sprint 4 - Config e Inicio do Billing (27/07-02/08)', '2026-07-27', '2026-08-02', NOW(), NOW()),
(7, 'Sprint 5 - LGPD e Cobranca Ativa (03-09/08)', '2026-08-03', '2026-08-09', NOW(), NOW()),
(7, 'Sprint 6 - Billing Frontend e Backlog IA (10-16/08)', '2026-08-10', '2026-08-16', NOW(), NOW()),
(7, 'Sprint 7 - Backlog Funcional e Observabilidade (17-23/08)', '2026-08-17', '2026-08-23', NOW(), NOW()),
(7, 'Sprint 8 - Performance e Lancamento Comercial (24-30/08)', '2026-08-24', '2026-08-30', NOW(), NOW());

-- 3) TASKS (49 demandas)
INSERT INTO tasks (board_id, sprint_id, status_id, assigned_to, description, priority, epic, sort_order, created_at, updated_at) VALUES
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 1 - Corrigir Fachada Critica e Seguranca Inicial (06-12/07)' LIMIT 1), 25, 2, '[D-01] Finalizar sistema de Turmas de ponta a ponta: criar migrations classes/class_user, Model EduClass, ClassController com os 7 endpoints que o frontend /turmas já espera (listar, criar, detalhar, editar, excluir, matricular, remover aluno) + GET /admin/classes. Critérios: professor cria/gerencia só suas turmas; isolamento entre professores testado; admin vê todas; teste Feature Laravel cobrindo o fluxo.', 'Alta', 'Fase 1: Corrigir Pendencias', 0, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 1 - Corrigir Fachada Critica e Seguranca Inicial (06-12/07)' LIMIT 1), 25, 2, '[D-02] Finalizar recuperação de senha: implementar POST /auth/forgot-password e POST /auth/reset-password (tabela password_reset_tokens já existe, está órfã), envio de e-mail via fila, e criar a tela /redefinir-senha no frontend (só existe a tela que pede o e-mail hoje). Critérios: token expira em 60min e é de uso único; resposta não revela se e-mail existe (evita enumeração); teste Feature cobrindo o fluxo completo.', 'Alta', 'Fase 1: Corrigir Pendencias', 1, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 1 - Corrigir Fachada Critica e Seguranca Inicial (06-12/07)' LIMIT 1), 25, 2, '[D-03] Finalizar edição de perfil: criar POST /profile (nome + upload de avatar) — frontend já chama essa rota, não existe no backend. Critérios: avatar valida tipo/tamanho (2MB max); avatar antigo é removido ao enviar novo; persiste após logout/login; teste Feature cobrindo sucesso e rejeição.', 'Alta', 'Fase 1: Corrigir Pendencias', 2, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 1 - Corrigir Fachada Critica e Seguranca Inicial (06-12/07)' LIMIT 1), 25, 1, '[D-04] Finalizar notificações in-app: criar migration notifications, NotificationController (GET /notifications, /unread-count, PATCH /read, /read-all) e NotificationService::send() injetável, disparando notificação real ao concluir processamento de PDF. Critérios: badge do sino reflete contagem real; marcação de leitura persiste; teste Feature cobrindo isolamento entre usuários.', 'Alta', 'Fase 1: Corrigir Pendencias', 0, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 2 - Finalizar Fachada e Seguranca IA (13-19/07)' LIMIT 1), 25, 2, '[D-05] Finalizar fórum de discussão: criar migrations forum_topics/forum_replies, ForumController completo (o frontend já parece pronto mas é 100% fachada, sem controller nem tabelas). Critérios: criar tópico/resposta funciona; exclusão restrita a autor ou admin; teste Feature cobrindo paginação e regra de exclusão.', 'Média', 'Fase 1: Corrigir Pendencias', 0, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 2 - Finalizar Fachada e Seguranca IA (13-19/07)' LIMIT 1), 25, 2, '[D-06] Descontinuar Chat interno: remover do menu admin e da rota app.routes.ts (o próprio código admite que o backend nunca foi feito; baixo ROI comparado ao resto do backlog). Critérios: menu não exibe mais ''Chat''; acesso direto pela URL não quebra a navegação; componente mantido no repo para retomar no futuro se fizer sentido.', 'Média', 'Fase 1: Corrigir Pendencias', 1, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 2 - Finalizar Fachada e Seguranca IA (13-19/07)' LIMIT 1), 25, 2, '[D-07] Exibir botão ''Abrir no Google Slides'' na tela de resultado de slides — o backend já gera google_slides_url (_try_google_slides em documents.py), só falta o frontend consumir. Critérios: botão só aparece quando a URL vem preenchida (login via Google); ausência da URL não gera erro visível.', 'Alta', 'Fase 1: Corrigir Pendencias', 2, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 3 - Seguranca e Infraestrutura (20-26/07)' LIMIT 1), 25, 2, '[D-08] Remover código morto de EventSource/SSE no upload — o endpoint /documents/{id}/stream nunca existiu, sempre cai no fallback de polling. Simplificar upload.ts para usar só polling direto. Critérios: progresso continua funcionando sem regressão; sem mais tentativas de conexão a /stream no console.', 'Baixa', 'Fase 1: Corrigir Pendencias', 0, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 1 - Corrigir Fachada Critica e Seguranca Inicial (06-12/07)' LIMIT 1), 25, 1, '[D-09] Corrigir bloqueio administrativo de usuários: hoje ''bloquear'' só zera email_verified_at, não revoga token nem impede reativação via verificação de e-mail. Adicionar coluna status (active/blocked), revogar personal_access_tokens ao bloquear, checar status em login/me/verify. Critérios: token para de funcionar imediatamente ao bloquear; usuário bloqueado não se autodesbloqueia; teste Feature cobrindo o fluxo.', 'Alta', 'Fase 2: Seguranca Critica', 1, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 3 - Seguranca e Infraestrutura (20-26/07)' LIMIT 1), 25, 2, '[D-10] Configurar CORS explícito no Laravel: criar config/cors.php com allowed_origins vindo de env var CORS_ALLOWED_ORIGINS (hoje não existe o arquivo, cors.paths fica vazio). Critérios: origem não listada é bloqueada; frontend local volta a funcionar sem config manual extra; variável documentada no .env.example.', 'Alta', 'Fase 2: Seguranca Critica', 1, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 3 - Seguranca e Infraestrutura (20-26/07)' LIMIT 1), 25, 2, '[D-11] Eliminar credencial de admin hardcoded no AdminSeeder (admin@educore.test / Admin@123! em texto plano). Gerar senha aleatória forte ou exigir env var sem default, travando em produção sem confirmação explícita. Critérios: seeder sem configuração falha explicitamente; senha antiga não existe mais no código.', 'Alta', 'Fase 2: Seguranca Critica', 2, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 4 - Config e Inicio do Billing (27/07-02/08)' LIMIT 1), 25, 2, '[D-12] Proteger auto-promoção a admin do ''primeiro usuário'' (hoje qualquer cadastro público vira admin se a base estiver sem admin). Substituir por comando artisan explícito ou env var checada só no boot. Critérios: cadastro público nunca promove a admin automaticamente; teste Feature confirmando isso.', 'Alta', 'Fase 2: Seguranca Critica', 0, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 4 - Config e Inicio do Billing (27/07-02/08)' LIMIT 1), 25, 2, '[D-13] Corrigir AI_SERVICE_URL usado via env() direto fora de config/ (quebra com config:cache em produção, causando falso ''degraded'' no health check). Mover para config/services.php. Critérios: funciona corretamente após config:cache; variável documentada no .env.example.', 'Média', 'Fase 2: Seguranca Critica', 1, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 4 - Config e Inicio do Billing (27/07-02/08)' LIMIT 1), 25, 2, '[D-14] Corrigir 7 vulnerabilidades ''high'' de XSS no Angular (bypass de sanitização, versão 20.3.21). Rodar npm audit fix / atualizar para >=20.3.25 e revalidar toda a suíte Cypress. Critérios: npm audit sem vulnerabilidades high/critical; suíte e2e completa sem regressão.', 'Alta', 'Fase 2: Seguranca Critica', 2, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 1 - Corrigir Fachada Critica e Seguranca Inicial (06-12/07)' LIMIT 1), 25, 1, '[D-15] Validar arquivos por conteúdo real (magic bytes %PDF-) no upload do ai-service, não só extensão do nome. Critérios: arquivo renomeado para .pdf é rejeitado com 400 sem acionar o pipeline; PDF real continua funcionando; teste pytest cobrindo ambos os casos.', 'Alta', 'Fase 2: Seguranca Critica', 2, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 2 - Finalizar Fachada e Seguranca IA (13-19/07)' LIMIT 1), 25, 1, '[D-16] Aplicar rate limit por usuário nos endpoints /audio e /html-view do ai-service (disparam geração real de IA sem @limiter.limit hoje, só protegidos pelo limite genérico de IP). Critérios: exceder o limite retorna 429 mesmo trocando de IP; uso normal não afetado.', 'Média', 'Fase 2: Seguranca Critica', 0, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 2 - Finalizar Fachada e Seguranca IA (13-19/07)' LIMIT 1), 25, 1, '[D-17] Trocar default de DEBUG para False no config.py do ai-service (hoje True por padrão, pode expor /docs e /redoc publicamente em produção) e confirmar DEBUG=False setado no Railway. Critérios: ambiente sem a variável roda com docs desativados por padrão.', 'Média', 'Fase 2: Seguranca Critica', 1, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 5 - LGPD e Cobranca Ativa (03-09/08)' LIMIT 1), 25, 2, '[D-18] Fortalecer política de senha (Rules\Password: maiúscula/número/símbolo) e adicionar bloqueio de conta por 5 tentativas de login falhas em 10min (usando audit_logs já existente), não só rate-limit por IP. Critérios: senha fraca rejeitada no cadastro; bloqueio funciona mesmo trocando de IP; teste Feature cobrindo ambos.', 'Média', 'Fase 2: Seguranca Critica', 0, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 5 - LGPD e Cobranca Ativa (03-09/08)' LIMIT 1), 25, 2, '[D-19] Publicar Termos de Uso e Política de Privacidade com checkbox de aceite obrigatório no cadastro, salvando terms_accepted_at/terms_version no usuário (sem isso, cadastro rejeitado com 422). ATENÇÃO: conteúdo jurídico dos textos precisa revisão de advogado — esta demanda cobre só a implementação técnica. Critérios: cadastro sem aceite é rejeitado; páginas públicas acessíveis; migration adicionando os campos.', 'Alta', 'Fase 3: LGPD e Compliance', 1, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 5 - LGPD e Cobranca Ativa (03-09/08)' LIMIT 1), 25, 2, '[D-20] Banner de consentimento de cookies na primeira visita, persistindo escolha em localStorage. Critérios: aparece só na primeira visita; não bloqueia navegação; não reaparece após aceitar.', 'Média', 'Fase 3: LGPD e Compliance', 2, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 2 - Finalizar Fachada e Seguranca IA (13-19/07)' LIMIT 1), 25, 1, '[D-21] Exclusão de conta e exportação de dados pessoais (LGPD): GET /profile/export (dados do MySQL + metadados do ai-service) e DELETE /profile (soft-delete + anonimização + revogação de tokens, com confirmação de senha). Critérios: usuário consegue exportar e excluir a própria conta; dados ficam anonimizados, não identificáveis; teste Feature cobrindo ambos.', 'Alta', 'Fase 3: LGPD e Compliance', 2, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 3 - Seguranca e Infraestrutura (20-26/07)' LIMIT 1), 25, 1, '[D-22] Migrar armazenamento de PDFs do ai-service (disco local efêmero no Railway, some a cada redeploy) para storage persistente (Supabase Storage ou S3/R2), criando storage_service.py com interface save/get/delete, mantendo compatibilidade com modo local em dev. Critérios: PDF sobrevive a redeploy; renovação de URI do Gemini volta a funcionar; dev local continua funcionando sem credenciais de nuvem.', 'Alta', 'Fase 4: Confiabilidade e Infraestrutura', 0, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 3 - Seguranca e Infraestrutura (20-26/07)' LIMIT 1), 25, 1, '[D-23] Watchdog para documentos travados em ''processing'' para sempre (pipeline roda via BackgroundTasks in-process, sem detecção de falha). Rotina periódica marca como failed após 15min sem update + botão ''Tentar novamente'' no frontend. Critérios: documento travado é detectado e marcado failed automaticamente; usuário consegue reprocessar.', 'Alta', 'Fase 4: Confiabilidade e Infraestrutura', 1, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 3 - Seguranca e Infraestrutura (20-26/07)' LIMIT 1), 25, 1, '[D-24] Eliminar gargalo de concorrência do ai-service: 1 worker + chamadas síncronas (Gemini SDK, PPTX, TTS, Pexels) bloqueando o event loop inteiro — 2 usuários gerando ao mesmo tempo travam o serviço todo. Envolver chamadas síncronas com asyncio.to_thread e rodar múltiplos workers. Critérios: 2 gerações simultâneas não travam uma a outra nem o /health; teste de carga confirmando.', 'Alta', 'Fase 4: Confiabilidade e Infraestrutura', 2, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 4 - Config e Inicio do Billing (27/07-02/08)' LIMIT 1), 25, 1, '[D-25] Definir e implementar backup automático dos bancos (MySQL Hostinger e Postgres Supabase) — hoje não existe nenhuma rotina. Ativar backup nativo do Supabase (7+ dias retenção) e cron de mysqldump na Hostinger enviando para storage externo. Critérios: backup diário verificável em ambos; procedimento de restauração testado e documentado.', 'Alta', 'Fase 4: Confiabilidade e Infraestrutura', 0, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 4 - Config e Inicio do Billing (27/07-02/08)' LIMIT 1), 25, 1, '[D-26] Migrar schema do ai-service (init_db() imperativo, sem versionamento) para Alembic + connection pooling (hoje abre conexão nova por request, pressiona limite do Supabase). Critérios: alembic upgrade head recria schema do zero; múltiplas instâncias não geram corrida de DDL; conexões simultâneas não crescem linearmente com requisições.', 'Média', 'Fase 4: Confiabilidade e Infraestrutura', 1, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 4 - Config e Inicio do Billing (27/07-02/08)' LIMIT 1), 25, 1, '[D-27] Implementar planos e quota de uso (sem cobrança ainda): migrations plans/usage_counters, seed Free/Pro/Equipe, estender /auth/verify com plan/limits/usage, enforce_quota + HTTP 402 no ai-service (upload e generate), POST /api/usage/increment atômico, badge de uso + modal de upgrade no frontend. Critérios: bloqueio no limite funciona com mensagem clara; sem race condition em uploads simultâneos; reset mensal automático.', 'Alta', 'Fase 5: Billing e Monetizacao', 2, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 5 - LGPD e Cobranca Ativa (03-09/08)' LIMIT 1), 25, 1, '[D-28] Implementar cobrança recorrente via Asaas (portar integração já validada do projeto Votar): migrations subscriptions/payments, POST /billing/subscribe, GET /billing/subscription, POST /billing/cancel, GET /plans, POST /webhooks/asaas idempotente, páginas /precos e /conta/assinatura. NUNCA armazenar dados de cartão, só IDs do gateway. Critérios: assinatura ativa automaticamente via webhook; webhook duplicado não gera cobrança dupla; cancelamento mantém acesso até fim do período pago.', 'Alta', 'Fase 5: Billing e Monetizacao', 0, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 6 - Billing Frontend e Backlog IA (10-16/08)' LIMIT 1), 25, 2, '[D-29] Painel de gestão de assinatura do usuário: histórico de pagamentos, troca de plano self-service, e-mails automáticos (boas-vindas, pagamento recusado, fim de trial) via fila. Critérios: usuário troca de plano sem intervenção manual; e-mails disparam corretamente nos 3 eventos.', 'Média', 'Fase 5: Billing e Monetizacao', 0, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 6 - Billing Frontend e Backlog IA (10-16/08)' LIMIT 1), 25, 2, '[D-30] Dashboard de métricas de negócio para admin: MRR, churn mensal, taxa de conversão Free->Pago, lista de assinaturas em atraso. Critérios: dados batem com conferência manual no banco; lista de atrasados é acionável.', 'Média', 'Fase 5: Billing e Monetizacao', 1, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 6 - Billing Frontend e Backlog IA (10-16/08)' LIMIT 1), 25, 2, '[D-31] Feedback de conteúdo gerado: migration content_feedbacks, POST /feedback (rating 1-5 + comentário, upsert por usuário+documento+tipo), GET /admin/feedback + stats, widget de estrelas não-bloqueante no rodapé de cada resultado. Critérios: reenviar avaliação atualiza, não duplica; admin vê média por tipo de geração.', 'Média', 'Fase 6: Backlog Funcional', 2, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 5 - LGPD e Cobranca Ativa (03-09/08)' LIMIT 1), 25, 1, '[D-32] Compressão de PDFs grandes (>10MB) antes do processamento via PyMuPDF (deflate_images). Se falhar, seguir com arquivo original. Critérios: PDF grande é comprimido sem perder legibilidade do texto; falha na compressão nunca trava o upload.', 'Baixa', 'Fase 6: Backlog Funcional', 1, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 6 - Billing Frontend e Backlog IA (10-16/08)' LIMIT 1), 25, 1, '[D-33] Suporte a multi-idioma (pt-BR/en-US/es-ES) na geração: campo language no GenerationRequest, instrução de idioma em todos os prompts, seletor de idioma no frontend persistido em localStorage. Critérios: geração no idioma escolhido produz conteúdo de fato traduzido; preferência lembrada entre sessões.', 'Média', 'Fase 6: Backlog Funcional', 0, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 6 - Billing Frontend e Backlog IA (10-16/08)' LIMIT 1), 25, 1, '[D-34] Cache de embeddings reutilizável entre gerações do mesmo documento (hoje recalcula toda vez, desperdiçando custo de API). Checar embeddings existentes antes de gerar novos; endpoint /reindex para forçar regeneração. Critérios: segunda geração para o mesmo doc não chama API de embedding de novo (mensuravelmente mais rápida).', 'Média', 'Fase 6: Backlog Funcional', 1, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 6 - Billing Frontend e Backlog IA (10-16/08)' LIMIT 1), 25, 1, '[D-35] Operações em lote em Meus Documentos: DELETE /documents/bulk e GET /documents/bulk-export (ZIP), checkbox de seleção + barra de ações no frontend (depende de D-36 existir). Critérios: seleção múltipla exclui/baixa de uma vez; ownership validado por item; limite de 20 por operação.', 'Baixa', 'Fase 6: Backlog Funcional', 2, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 7 - Backlog Funcional e Observabilidade (17-23/08)' LIMIT 1), 25, 2, '[D-36] Tela ''Meus Documentos'' (histórico completo): rota /meus-docs com grid, filtro, busca, paginação, navegação direta ao resultado já gerado, exclusão individual — usando GET /documents e DELETE /documents/{id} já existentes no ai-service. Critérios: histórico completo navegável; clicar no card leva ao resultado sem reprocessar.', 'Média', 'Fase 6: Backlog Funcional', 0, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 7 - Backlog Funcional e Observabilidade (17-23/08)' LIMIT 1), 25, 2, '[D-37] Compartilhamento de resultado via link público: migration shared_links, POST /share (token único, expira em 30 dias) e GET /share/{token} público, rota /p/{token} no frontend sem authGuard. Critérios: link funciona sem login; expira automaticamente; reuso do token para mesmo documento+tipo.', 'Baixa', 'Fase 6: Backlog Funcional', 1, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 7 - Backlog Funcional e Observabilidade (17-23/08)' LIMIT 1), 25, 2, '[D-38] Analytics de uso (admin e professor): GET /admin/analytics (docs/gerações/usuários ativos por dia, cache 10min) + rota /analytics no frontend com KPIs pessoais e gráfico Chart.js. Critérios: admin vê tendência de 30 dias; professor só vê seus próprios dados; números batem com conferência manual.', 'Média', 'Fase 6: Backlog Funcional', 2, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 8 - Performance e Lancamento Comercial (24-30/08)' LIMIT 1), 25, 2, '[D-39] NPS pós-exportação: dialog de avaliação não-bloqueante após download (PPTX/Kahoot/SCORM/Socrative), reaproveitando content_feedbacks (depende de D-31), 1x por sessão, fecha sozinho em 15s. Critérios: aparece após download iniciar; não bloqueia; não repete na mesma sessão.', 'Baixa', 'Fase 6: Backlog Funcional', 0, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 7 - Backlog Funcional e Observabilidade (17-23/08)' LIMIT 1), 25, 1, '[D-40] Monitoramento de erros (Sentry) nos 3 serviços — hoje zero visibilidade de erro em produção além de logs manuais via SSH. Critérios: exceção de teste aparece no painel em cada serviço; dados sensíveis redigidos; alertas configurados.', 'Alta', 'Fase 7: Observabilidade e Performance', 0, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 7 - Backlog Funcional e Observabilidade (17-23/08)' LIMIT 1), 25, 1, '[D-41] Cobertura de testes automatizados para fluxos críticos: Feature tests Laravel completos (AdminController, CheckRole, verificação de email, OAuth), unit tests Angular reais (auth.service, result-store, força de senha — hoje 28 specs são só boilerplate), suíte pytest inicial no ai-service (ownership_check, fallback de IA, parsing de LLM). Critérios: cobertura mensurável nos módulos citados; suíte completa roda em <10min.', 'Alta', 'Fase 7: Observabilidade e Performance', 1, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 8 - Performance e Lancamento Comercial (24-30/08)' LIMIT 1), 25, 2, '[D-42] Otimizar performance do frontend: lazy loading de rotas (bundle inicial de 1.38MB carrega painel admin inteiro pra visitante anônimo), remover 18MB/438 imagens mortas de public/images, remover @angular/material e @angular/cdk não usados. Critérios: bundle inicial reduz mensuravelmente; sem regressão visual/funcional.', 'Média', 'Fase 7: Observabilidade e Performance', 1, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 7 - Backlog Funcional e Observabilidade (17-23/08)' LIMIT 1), 25, 1, '[D-43] Decidir e implementar o destino do SSR (scaffold presente mas RenderMode.Client força CSR em tudo, deploy real nem usa o servidor Express). Decisão de produto primeiro (importância de SEO orgânico), depois ativar de verdade nas rotas públicas OU remover o scaffold morto. Critérios: decisão documentada com justificativa; implementação consistente com a decisão.', 'Baixa', 'Fase 7: Observabilidade e Performance', 2, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 8 - Performance e Lancamento Comercial (24-30/08)' LIMIT 1), 25, 2, '[D-44] Padronizar tratamento de erros no frontend (3 padrões coexistindo hoje, toasts duplicados em vários componentes) e adicionar ErrorHandler global (hoje uma exceção de renderização gera tela em branco sem feedback). Migrar features/classes para o ToastService compartilhado. Critérios: nenhum erro dispara mais de 1 toast; tela de erro amigável em exceção não tratada.', 'Média', 'Fase 7: Observabilidade e Performance', 2, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 8 - Performance e Lancamento Comercial (24-30/08)' LIMIT 1), 25, 1, '[D-45] Validar diferencial competitivo (teste lado a lado EduCore vs Smallpdf vs SlideSpeak, mesmo PDF) e produzir 6 vídeos demo curtos (3 ''PDF vira X em segundos'' + 3 antes/depois), sem jargão técnico. Critérios: comparação documentada com conclusão clara; vídeos finalizados e aprovados.', 'Alta', 'Fase 8: Lancamento e Marketing', 0, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 8 - Performance e Lancamento Comercial (24-30/08)' LIMIT 1), 25, 1, '[D-46] Lançar presença em redes sociais (Instagram/TikTok, 3 posts/semana) e programa de indicação (comissão recorrente ou mês grátis), entrar em 10+ grupos de professores ajudando antes de vender. Critérios: perfis ativos com link de bio pra /precos; 10+ grupos com presença real; programa de indicação com regra e rastreio definidos.', 'Alta', 'Fase 8: Lancamento e Marketing', 1, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 8 - Performance e Lancamento Comercial (24-30/08)' LIMIT 1), 25, 1, '[D-47] Recrutar 10-15 professores beta (trial estendido sem cobrar) e coletar 5+ depoimentos em vídeo, medindo taxa de ativação (cadastro -> 1º PDF processado) desse grupo. Critérios: beta ativo e medido; depoimentos coletados com autorização de uso.', 'Alta', 'Fase 8: Lancamento e Marketing', 2, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 8 - Performance e Lancamento Comercial (24-30/08)' LIMIT 1), 25, 1, '[D-48] Publicar página /precos com copy de conversão real por segmento (professor autônomo primeiro), sem jargão técnico, prova social assim que disponível, metatags de SEO/Open Graph. Critérios: copy revisado no ar; preview correto ao compartilhar em redes sociais; depoimento real exibido quando disponível.', 'Alta', 'Fase 8: Lancamento e Marketing', 3, NOW(), NOW()),
(7, (SELECT id FROM sprints WHERE board_id = 7 AND name = 'Sprint 8 - Performance e Lancamento Comercial (24-30/08)' LIMIT 1), 25, 1, '[D-49] Primeira campanha de tráfego pago controlada (Meta Ads, R$500-1000, só após validar conversão orgânica com 10-20 assinantes), usando os vídeos da D-45, pixel de conversão instalado. Critérios: pixel disparando corretamente; custo por assinante calculado ao final; decisão de escalar/ajustar/pausar documentada.', 'Média', 'Fase 8: Lancamento e Marketing', 4, NOW(), NOW());

-- 4) TASK_TAG (vincula cada demanda as suas tags)
INSERT INTO task_tag (task_id, tag_id)
SELECT t.id, tg.id
FROM tasks t
JOIN tags tg ON tg.board_id = 7
WHERE t.board_id = 7 AND (
  (t.description LIKE '[D-01]%' AND tg.name IN ('Laravel', 'Angular', 'Correcao-Fachada'))
  OR
  (t.description LIKE '[D-02]%' AND tg.name IN ('Laravel', 'Angular', 'Correcao-Fachada', 'Seguranca'))
  OR
  (t.description LIKE '[D-03]%' AND tg.name IN ('Laravel', 'Angular', 'Correcao-Fachada'))
  OR
  (t.description LIKE '[D-04]%' AND tg.name IN ('Laravel', 'Angular', 'AI-Service', 'Correcao-Fachada'))
  OR
  (t.description LIKE '[D-05]%' AND tg.name IN ('Laravel', 'Angular', 'Correcao-Fachada'))
  OR
  (t.description LIKE '[D-06]%' AND tg.name IN ('Angular', 'Correcao-Fachada'))
  OR
  (t.description LIKE '[D-07]%' AND tg.name IN ('Angular', 'Correcao-Fachada'))
  OR
  (t.description LIKE '[D-08]%' AND tg.name IN ('Angular', 'Correcao-Fachada'))
  OR
  (t.description LIKE '[D-09]%' AND tg.name IN ('Laravel', 'Seguranca'))
  OR
  (t.description LIKE '[D-10]%' AND tg.name IN ('Laravel', 'Seguranca'))
  OR
  (t.description LIKE '[D-11]%' AND tg.name IN ('Laravel', 'Seguranca'))
  OR
  (t.description LIKE '[D-12]%' AND tg.name IN ('Laravel', 'Seguranca'))
  OR
  (t.description LIKE '[D-13]%' AND tg.name IN ('Laravel'))
  OR
  (t.description LIKE '[D-14]%' AND tg.name IN ('Angular', 'Seguranca'))
  OR
  (t.description LIKE '[D-15]%' AND tg.name IN ('AI-Service', 'Seguranca'))
  OR
  (t.description LIKE '[D-16]%' AND tg.name IN ('AI-Service', 'Seguranca'))
  OR
  (t.description LIKE '[D-17]%' AND tg.name IN ('AI-Service', 'Seguranca'))
  OR
  (t.description LIKE '[D-18]%' AND tg.name IN ('Laravel', 'Seguranca'))
  OR
  (t.description LIKE '[D-19]%' AND tg.name IN ('Laravel', 'Angular', 'LGPD'))
  OR
  (t.description LIKE '[D-20]%' AND tg.name IN ('Angular', 'LGPD'))
  OR
  (t.description LIKE '[D-21]%' AND tg.name IN ('Laravel', 'AI-Service', 'LGPD'))
  OR
  (t.description LIKE '[D-22]%' AND tg.name IN ('AI-Service', 'Infraestrutura'))
  OR
  (t.description LIKE '[D-23]%' AND tg.name IN ('AI-Service', 'Infraestrutura'))
  OR
  (t.description LIKE '[D-24]%' AND tg.name IN ('AI-Service', 'Infraestrutura', 'Performance'))
  OR
  (t.description LIKE '[D-25]%' AND tg.name IN ('Infraestrutura'))
  OR
  (t.description LIKE '[D-26]%' AND tg.name IN ('AI-Service', 'Infraestrutura'))
  OR
  (t.description LIKE '[D-27]%' AND tg.name IN ('Laravel', 'AI-Service', 'Billing'))
  OR
  (t.description LIKE '[D-28]%' AND tg.name IN ('Laravel', 'Angular', 'Billing'))
  OR
  (t.description LIKE '[D-29]%' AND tg.name IN ('Laravel', 'Angular', 'Billing'))
  OR
  (t.description LIKE '[D-30]%' AND tg.name IN ('Laravel', 'Angular', 'Billing'))
  OR
  (t.description LIKE '[D-31]%' AND tg.name IN ('Laravel', 'Angular'))
  OR
  (t.description LIKE '[D-32]%' AND tg.name IN ('AI-Service', 'Performance'))
  OR
  (t.description LIKE '[D-33]%' AND tg.name IN ('AI-Service', 'Angular'))
  OR
  (t.description LIKE '[D-34]%' AND tg.name IN ('AI-Service', 'Performance'))
  OR
  (t.description LIKE '[D-35]%' AND tg.name IN ('AI-Service', 'Angular'))
  OR
  (t.description LIKE '[D-36]%' AND tg.name IN ('Angular'))
  OR
  (t.description LIKE '[D-37]%' AND tg.name IN ('Laravel', 'Angular'))
  OR
  (t.description LIKE '[D-38]%' AND tg.name IN ('Laravel', 'Angular'))
  OR
  (t.description LIKE '[D-39]%' AND tg.name IN ('Angular'))
  OR
  (t.description LIKE '[D-40]%' AND tg.name IN ('Laravel', 'Angular', 'AI-Service', 'Infraestrutura'))
  OR
  (t.description LIKE '[D-41]%' AND tg.name IN ('Laravel', 'Angular', 'AI-Service', 'Testes'))
  OR
  (t.description LIKE '[D-42]%' AND tg.name IN ('Angular', 'Performance'))
  OR
  (t.description LIKE '[D-43]%' AND tg.name IN ('Angular'))
  OR
  (t.description LIKE '[D-44]%' AND tg.name IN ('Angular'))
  OR
  (t.description LIKE '[D-45]%' AND tg.name IN ('Marketing'))
  OR
  (t.description LIKE '[D-46]%' AND tg.name IN ('Marketing'))
  OR
  (t.description LIKE '[D-47]%' AND tg.name IN ('Marketing'))
  OR
  (t.description LIKE '[D-48]%' AND tg.name IN ('Marketing', 'Angular'))
  OR
  (t.description LIKE '[D-49]%' AND tg.name IN ('Marketing'))
);

-- 5) Verificacao final
SELECT COUNT(*) AS total_tasks FROM tasks WHERE board_id = 7 AND deleted_at IS NULL;
SELECT COUNT(*) AS total_sprints FROM sprints WHERE board_id = 7 AND deleted_at IS NULL;
SELECT COUNT(*) AS total_tags FROM tags WHERE board_id = 7 AND deleted_at IS NULL;
SELECT COUNT(*) AS total_vinculos_tag FROM task_tag tt JOIN tasks t ON t.id = tt.task_id WHERE t.board_id = 7;
SELECT assigned_to, COUNT(*) AS total FROM tasks WHERE board_id = 7 AND deleted_at IS NULL GROUP BY assigned_to;