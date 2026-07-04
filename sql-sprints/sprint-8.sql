-- ============================================================
-- EduCore — Sprint 8: descricoes enriquecidas em formato de prompt
-- Atualiza o campo description das tarefas ja existentes (nao recria nada)
-- ============================================================

UPDATE tasks SET description = '[D-39] Pesquisa de satisfação (NPS) pós-exportação

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Angular (frontend/, reaproveita a tabela content_feedbacks da D-31).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Depende da demanda D-31 já existir (reaproveita content_feedbacks, com um campo adicional export_type).

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-39-nps-pos-exportacao
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- CRIAR: frontend/src/app/shared/components/molecules/feedback/export-feedback-dialog/
- frontend/src/app/features/result/ (adicionar o hook pós-download em cada tipo de exportação: PPTX, Kahoot, SCORM, Socrative)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Dialog de avaliação (5 estrelas + comentário opcional) aparece após o download iniciar (nunca antes, nunca bloqueando o download)
- [ ] Aparece só uma vez por combinação documento+tipo de exportação por sessão (sessionStorage)
- [ ] Fecha sozinho em 15 segundos se o usuário não interagir

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-39): NPS pos-exportacao"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-39]%' LIMIT 1;

UPDATE tasks SET description = '[D-42] Otimizar performance e SEO do frontend

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Angular (frontend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
O bundle inicial carrega o painel admin inteiro mesmo para um visitante anônimo na home (1.38MB de main.js), porque nenhuma rota usa lazy loading.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-42-performance-frontend
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- frontend/src/app/app.routes.ts (converter para loadComponent nas rotas de /admin/* e nos tipos de resultado)
- frontend/public/images/ (remover imagens mortas, sem referência no código)
- frontend/package.json (remover @angular/material e @angular/cdk, não usados)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Rotas convertidas para lazy loading (loadComponent), especialmente /admin/* e os tipos de resultado
- [ ] public/images/ não contém mais arquivos sem referência no código
- [ ] package.json não lista mais @angular/material nem @angular/cdk
- [ ] Bundle inicial (main.js da rota /) reduz significativamente de tamanho (medir antes/depois com ng build --stats-json)
- [ ] Nenhuma regressão visual ou funcional em nenhuma rota

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "perf(D-42): lazy loading e limpeza de assets/dependencias mortas"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-42]%' LIMIT 1;

UPDATE tasks SET description = '[D-44] Padronizar tratamento de erros e limpar código morto no frontend

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Angular (frontend/).
Seu ambiente de trabalho local: C:\Users\claudia\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Hoje existem 3 padrões de erro coexistindo (interceptor global, componentes com toast próprio duplicando a mensagem, formulários de auth com signals locais), e features/classes usa MessageService próprio do PrimeNG em vez do ToastService compartilhado.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\claudia\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-44-padronizar-erros-frontend
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

📌 Nota: se qualquer comando acima der erro ou você não tiver certeza do que ele faz, PARE e pergunte antes de continuar — não tente "resolver sozinho" adivinhando.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- frontend/src/app/core/interceptors/auth.interceptor.ts (já trata 401/422/429/500 via ToastService)
- frontend/src/app/features/panel/panel.ts, frontend/src/app/features/admin/forum/forum.ts (remover toasts duplicados)
- frontend/src/app/features/classes/classes.ts (migrar de MessageService proprio para o ToastService compartilhado)
- CRIAR: um ErrorHandler global customizado (implementar a interface ErrorHandler do Angular)
- frontend/src/app/app.config.ts (registrar o novo ErrorHandler)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Nenhum erro de API dispara mais de um toast simultâneo pro usuário
- [ ] features/classes usa o ToastService compartilhado, sem MessageService próprio
- [ ] ErrorHandler global captura exceções de renderização não tratadas
- [ ] Uma exceção de renderização forçada (pra teste) mostra uma tela de erro amigável em vez de tela em branco

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "fix(D-44): padronizar tratamento de erros e remover toasts duplicados"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-44]%' LIMIT 1;

UPDATE tasks SET description = '[D-45] Validar diferencial competitivo e produzir vídeos demo

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Marketing/Produto (não é uma demanda de código).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Ver PLANO-MARKETING-EDUCORE.md seção 1.5 — pesquisa de mercado já mapeada, o diferencial mais defensável hoje é a qualidade visual do slide.

ℹ️ Esta demanda é de marketing/negócio, não gera código — não há passo de Git/branch/PR. Execução e evidência (prints, vídeos, links) devem ser registradas diretamente no card desta tarefa no Avante.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- PLANO-MARKETING-EDUCORE.md (referência completa)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Teste lado a lado real entre EduCore, Smallpdf e SlideSpeak com o mesmo PDF de entrada, documentado (prints ou vídeo)
- [ ] Conclusão clara sobre qual diferencial comunicar (ex: qualidade visual do slide)
- [ ] 6 vídeos curtos finalizados: 3 demos "PDF vira X em segundos" (quiz, resumo, slides) + 3 comparativos antes/depois
- [ ] Nenhum jargão técnico nos vídeos (nunca mencionar RAG, embeddings, pgvector)
- [ ] Vídeos aprovados pelo Fernando antes da publicação' WHERE board_id = 7 AND description LIKE '[D-45]%' LIMIT 1;

UPDATE tasks SET description = '[D-46] Lançar presença em redes sociais e programa de indicação

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Marketing (não é uma demanda de código).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Ver PLANO-MARKETING-EDUCORE.md seções 4 e 4.5.

ℹ️ Esta demanda é de marketing/negócio, não gera código — não há passo de Git/branch/PR. Execução e evidência (prints, vídeos, links) devem ser registradas diretamente no card desta tarefa no Avante.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- PLANO-MARKETING-EDUCORE.md

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Perfis Instagram e TikTok do EduCore criados e ativos, com link de bio funcional para /precos
- [ ] Cadência de pelo menos 3 posts/semana com os vídeos da D-45
- [ ] Pelo menos 10 grupos de WhatsApp/Telegram/Facebook de professores mapeados e com presença ativa
- [ ] Programa de indicação desenhado com regra clara (comissão recorrente ou mês grátis) e mecanismo de rastreio' WHERE board_id = 7 AND description LIKE '[D-46]%' LIMIT 1;

UPDATE tasks SET description = '[D-47] Recrutar beta testers e coletar depoimentos

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Marketing (não é uma demanda de código).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Fase de validação antes de tráfego pago, conforme PLANO-MARKETING-EDUCORE.md.

ℹ️ Esta demanda é de marketing/negócio, não gera código — não há passo de Git/branch/PR. Execução e evidência (prints, vídeos, links) devem ser registradas diretamente no card desta tarefa no Avante.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- PLANO-MARKETING-EDUCORE.md

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] 10 a 15 professores beta recrutados, usando trial estendido sem cobrança
- [ ] Taxa de ativação desse grupo (cadastro -> 1º PDF processado com sucesso) medida e documentada
- [ ] Pelo menos 5 depoimentos em vídeo coletados, com autorização de uso' WHERE board_id = 7 AND description LIKE '[D-47]%' LIMIT 1;

UPDATE tasks SET description = '[D-48] Publicar página de preços otimizada para conversão

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Marketing + Angular (frontend/, a página técnica já existe da D-28, aqui é o copy).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
A página /precos já foi criada tecnicamente na D-28 — esta demanda complementa com copywriting de conversão real e SEO básico.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-48-pagina-precos-conversao
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- frontend/src/app/features/pricing/ (já existe da D-28)
- PLANO-MARKETING-EDUCORE.md seção 3 (proposta de valor por segmento)

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Copy revisado no ar, focado no segmento professor autônomo primeiro, sem jargão técnico
- [ ] Metatags de Open Graph corretas (title, description, imagem) ao compartilhar o link em redes sociais/WhatsApp
- [ ] Pelo menos 1 depoimento real exibido assim que disponível (da D-47)

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-48): copy de conversao e SEO na pagina de precos"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-48]%' LIMIT 1;

UPDATE tasks SET description = '[D-49] Primeira campanha de tráfego pago controlada

📖 CONTEXTO DO PROJETO:
Você vai trabalhar no EduCore, uma plataforma SaaS educacional que usa IA generativa (Google Gemini) para transformar PDFs em quiz, resumo, apresentações de slides, mapa mental, flashcards e conteúdo adaptado (PCD), via um pipeline RAG (Retrieval Augmented Generation).

Arquitetura (3 serviços independentes dentro do mesmo monorepo "educore"):
- backend/  -> Laravel 13.7 + PHP 8.4 + Sanctum (bearer token) + Google OAuth. Roda em http://educore.test (via Laravel Herd)
- frontend/ -> Angular 20.3 + PrimeNG 20 + Signals. Roda em http://localhost:4200
- ai-service/ -> Python 3.11 + FastAPI + Google Gemini + pgvector/PostgreSQL. Roda em http://localhost:8001

Esta demanda envolve: Marketing (não é uma demanda de código, exceto instalação de pixel).
Seu ambiente de trabalho local: C:\Users\UITEC\Herd\educore

📂 ONDE ISSO SE ENCAIXA:
Só deve começar depois de confirmar conversão orgânica saudável (10-20 assinantes vindos organicamente), conforme regra explícita do PLANO-MARKETING-EDUCORE.md.

🛠️ ANTES DE COMEÇAR (Git) — siga exatamente nesta ordem, sem pular etapas:
1. Abra o terminal (CMDER ou PowerShell)
2. cd C:\Users\UITEC\Herd\educore\frontend
3. git checkout main
4. git pull origin main
5. git checkout -b feature/d-49-campanha-trafego-pago
6. Antes de escrever qualquer código, ABRA e LEIA os arquivos listados em "Arquivos envolvidos" abaixo — entenda o padrão já usado no projeto antes de criar algo novo. Não copie um padrão de outro projeto, siga exatamente o que já existe aqui.

⚠️ REGRA OBRIGATÓRIA: você (a IA executando esta tarefa) NUNCA deve assumir, adivinhar ou inventar nome de rota, campo de banco, comportamento ou decisão de arquitetura que não esteja explícito nesta descrição ou já presente no código existente do projeto. Se qualquer parte desta tarefa estiver ambígua, incompleta, ou surgir qualquer dúvida sobre como proceder, PARE imediatamente e pergunte ao responsável antes de continuar. Nunca prossiga no "achismo".

📍 TELA(S) / ROTA(S) / ARQUIVOS ENVOLVIDOS:
- frontend/src/index.html (instalar o pixel de conversão do Meta Ads)
- PLANO-MARKETING-EDUCORE.md seção 4.4

📋 CRITÉRIOS DE ACEITE (checklist — só considere concluído quando TODOS estiverem marcados):
- [ ] Pixel de conversão instalado e disparando corretamente nos eventos de cadastro e assinatura paga
- [ ] Campanha rodando no Meta Ads dentro do orçamento de teste (R$500-1000), usando os vídeos da D-45
- [ ] Custo por assinante calculado ao final do teste
- [ ] Decisão documentada (escalar, ajustar ou pausar) com base no resultado real

🚀 QUANDO TERMINAR:
1. git add .
2. git commit -m "feat(D-49): instalar pixel de conversao para campanha de trafego pago"
3. git push -u origin HEAD
4. Abra o Pull Request no GitHub (base: main). NÃO faça merge sozinho — avise o responsável do projeto.' WHERE board_id = 7 AND description LIKE '[D-49]%' LIMIT 1;

-- Verificacao: confirme que todas as descricoes desta sprint foram atualizadas (buscar pelo novo cabecalho "CONTEXTO DO PROJETO")
SELECT id, LEFT(description, 60) AS inicio FROM tasks WHERE board_id = 7 AND sprint_id = (SELECT id FROM sprints WHERE board_id = 7 AND name LIKE 'Sprint 8 -%' LIMIT 1) ORDER BY id;