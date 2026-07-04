# 🚀 EduCore — Roteiro Master para Comercialização

> Documento único que consolida TUDO que precisa acontecer entre hoje e o EduCore virar SaaS vendável, terminando na sprint de marketing/aquisição de clientes.
> Junta 4 fontes: `ANALISE-TECNICA-PRODUCAO.md` (segurança/LGPD/infra), `MULTITENANT-BILLING.md` (billing técnico), o board **Educore** do Avante (33 tarefas já criadas — auditadas contra o código real nesta rodada) e `PLANO-MARKETING-EDUCORE.md`/`PLANO-NEGOCIO.md` (aquisição de clientes).
> Última atualização: 04/07/2026.

---

## 0. O achado que muda a prioridade de tudo

Ao cruzar as 33 tarefas do board Avante com o código real, descobri que **4 features inteiras marcadas "Concluída" não têm backend nenhum**: Turmas, Chat, Fórum e Notificações in-app. O frontend parece pronto (formulários, paginação, skeleton loading), mas não existe controller nem migration para nenhuma delas no Laravel — em produção, qualquer clique nelas retorna 404. Ao mesmo tempo, 3 itens marcados "Em Fila" **já estão prontos de verdade** (Google Slides no ai-service, fallback de provedores de IA, dark mode) — só não foram implementados exatamente como o ticket original descrevia, e ninguém atualizou o board.

**Conclusão prática: o status do board Avante não é confiável sozinho.** A tabela da seção 1 é a fonte de verdade agora — baseada em grep direto no código, não no que o board diz.

---

## 1. Auditoria completa das 33 tarefas do board (board vs. realidade)

| ID | Demanda | Sprint original | Board | Realidade verificada | Ação necessária |
|---|---|---|---|---|---|
| BS-001/002 | API Professores/Alunos | S1 | Em Fila | ✅ Feito (unificado em `AdminController`, filtro `role`) | Fechar ticket — já funciona |
| BS-003 | API Turmas | S1 | Em Fila | ❌ Não existe | Ver RM-01 |
| US-001/002 | Telas Professores/Alunos | S1 | Concluída | ✅ Feito | Nenhuma |
| US-009 | Tela Turmas | S1 | Concluída | 🔴 Quebrado (404 real) | Ver RM-01 |
| BS-005 | SSE backend | S2 | Em Fila | ❌ Não existe | Ver RM-02 |
| BS-006 | Notificações backend | S2 | Em Fila | ❌ Não existe | Ver RM-03 |
| BS-011 | Webhook conclusão | S2 | Em Fila | ❌ Não existe | Baixa prioridade — só vale a pena após RM-02/03 |
| US-003 | Chat interno | S2 | Concluída | 🔴 Quebrado (assumido no próprio código) | Ver RM-04 |
| US-004 | Fórum | S2 | Concluída | 🔴 Quebrado (parece pronto, não é) | Ver RM-05 |
| US-005 | Sino de notificações | S2 | Concluída | 🔴 Quebrado | Ver RM-03 |
| US-006 | SSE no upload | S2 | Concluída | 🟡 Funciona via fallback polling; SSE nunca roda | Ver RM-02 |
| BS-007 | API Feedback de conteúdo | S3 | Em Fila | ❌ Não existe | Backlog legítimo (BE-A) |
| BS-012 | Compressão de PDF | S3 | Em Fila | ❌ Não existe | Backlog legítimo (BE-B) |
| BS-013 | Multi-idioma na geração | S3 | Em Fila | ❌ Não existe | Backlog legítimo (BE-C) |
| BS-014 | Fallback IA (Groq/Mistral) | S3 | Em Fila | ✅ Feito (embutido em `rag_service.py`) | Fechar ticket |
| BS-015 | Cache de embeddings | S3 | Em Fila | ❌ Não existe | Backlog legítimo (BE-D) |
| US-007 | Widget de feedback (estrelas) | S3 | Em Fila | ❌ Não existe | Depende de BS-007 |
| US-015 | Seletor de idioma | S3 | Em Fila | ❌ Não existe | Depende de BS-013 |
| BS-008 | Google Slides API | S4 | Em Fila | ✅ Feito (`_try_google_slides`, ai-service) | Só falta o botão (US-008) |
| BS-009 | Bulk operations | S4 | Em Fila | ❌ Não existe | Backlog legítimo (BE-E) |
| BS-010 | Planos/quotas (versão simples) | S4 | Em Fila | ❌ Não existe | **Superseder por `MULTITENANT-BILLING.md`** — não implementar a versão simples |
| US-008 | Botão exportar Google Slides | S4 | Em Fila | ❌ Não existe (backend pronto, invisível) | Backlog legítimo (FE-A) — fácil, backend já existe |
| US-011 | Meus documentos (histórico) | S4 | Em Fila | ❌ Não existe | Backlog legítimo (FE-B) |
| US-012 | Compartilhar link público | S4 | Em Fila | ❌ Não existe | Backlog legítimo (FE-C) |
| US-013 | Tela de planos | S4 | Em Fila | ❌ Não existe | **Superseder por `MULTITENANT-BILLING.md` §5** |
| US-016 | Bulk select em meus-docs | S4 | Em Fila | ❌ Não existe | Depende de BS-009 e US-011 |
| US-018 | Banner de limite de plano | S4 | Em Fila | ❌ Não existe | **Superseder por `MULTITENANT-BILLING.md` §5** |
| BS-004 | Analytics de uso (admin) | S5 | Em Fila | ❌ Não existe | Backlog legítimo (BE-F) |
| US-010 | Dashboard analytics do professor | S5 | Em Fila | ❌ Não existe | Backlog legítimo (FE-D) |
| US-014 | Dark mode | S5 | Em Fila | ✅ Feito (`theme.service.ts`) | Fechar ticket |
| US-017 | NPS pós-exportação | S5 | Em Fila | ❌ Não existe | Backlog legítimo (FE-E), baixa prioridade |

**Placar real: 6 de 33 genuinamente prontas, 5 quebradas ("fachada"), 22 nunca começadas.**

---

## 2. RM — Correção de Fachada (decisão obrigatória antes de vender)

Para cada feature quebrada, a escolha é binária: **terminar o backend** ou **tirar da UI**. Não dá pra deixar como está — é a pior combinação possível pra confiança de um cliente pagante (parece que funciona, quebra na cara dele).

| ID | Feature | Opção A (terminar) | Opção B (remover) | Recomendação |
|---|---|---|---|---|
| RM-01 | Turmas | Criar `ClassController` + migrations `classes`/`class_user` (era exatamente o escopo de BS-003, nunca feito) | Tirar `/turmas` do menu até terminar | **Terminar** — é feature de valor real (organização por turma), citada no plano de preços "Equipe" |
| RM-02 | SSE (upload) | Criar `GET /documents/{id}/stream` no ai-service (era o escopo de BS-005) | Remover o código de `EventSource` do frontend, ficar só com polling (já é o que roda hoje de fato) | **Remover o código morto** — polling já funciona e SSE é otimização, não correção de bug; fazer depois se sobrar tempo |
| RM-03 | Notificações in-app | Criar `NotificationController` + migration `notifications` (escopo de BS-006) | Remover o sino do header | **Terminar** — feature pequena e o frontend (sino, dropdown) já está pronto, só falta a API |
| RM-04 | Chat interno | Criar `ChatController` + migration `chat_messages` (escopo de US-003, nunca feito apesar de "Concluída") | Remover `/admin/chat` do menu admin | **Remover por ora** — é comunicação interna da equipe, não afeta o cliente final; baixo ROI perto de tudo mais que falta |
| RM-05 | Fórum | Criar `ForumController` + migrations `forum_topics`/`forum_replies` (escopo de US-004) | Remover `/admin/forum` do menu | **Terminar** — é uma feature voltada à comunidade de usuários (diferencial de retenção), maior prioridade que o chat interno |

---

## 3. Roteiro único de sprints (ordem definitiva)

### Sprint 0 — Correção de Fachada
`RM-01` (Turmas) → `RM-03` (Notificações) → `RM-05` (Fórum) → `RM-02` (remover SSE morto) → `RM-04` (remover chat interno) → `FE-A` (botão Google Slides — 1 dia de esforço, backend já pronto)

### Sprint 1 — Segurança, LGPD e Infraestrutura crítica
Ver detalhe completo em `ANALISE-TECNICA-PRODUCAO.md` §4-5. Resumo dos IDs: `FE-01` (npm audit) → `BE-01…BE-13` (segurança Laravel/ai-service) → `FE-02…FE-06` (LGPD/features quebradas do relatório anterior — `FE-05`/`FE-06` já cobertos por `RM-04` acima).

### Sprint 2 — Billing básico (planos e quota, sem cobrança ainda)
`BE-14` do relatório anterior = Sprint 1 do `MULTITENANT-BILLING.md`: migrations `plans`/`subscriptions`/`usage_counters`, estender `/auth/verify`, `enforce_quota` no ai-service, `POST /api/usage/increment`. **Isso substitui BS-010/US-013/US-018 do board Avante** — não implementar a versão simples, ir direto para a completa.

### Sprint 3 — Cobrança ativa
`BE-27` do relatório anterior = Sprint 2 do `MULTITENANT-BILLING.md`: gateway Asaas, webhooks, página `/precos`, checkout.

### Sprint 4 — Backlog funcional legítimo (o que resta do board, com valor real)
| ID | Demanda | Origem |
|---|---|---|
| BE-A | API de feedback de conteúdo (rating 1-5 + comentário) | BS-007 |
| BE-B | Compressão de PDFs grandes antes de processar | BS-012 |
| BE-C | Suporte a multi-idioma na geração (pt-BR/en-US/es-ES) | BS-013 |
| BE-D | Cache de embeddings entre gerações do mesmo documento | BS-015 |
| BE-E | Bulk delete/export de documentos | BS-009 |
| BE-F | Analytics de uso agregado (admin) | BS-004 |
| FE-B | Tela "Meus Documentos" (histórico, busca, exclusão) | US-011 |
| FE-C | Compartilhar resultado via link público | US-012 |
| FE-D | Dashboard de analytics pessoal do professor | US-010 |
| FE-E | Widget de feedback (estrelas) nos resultados | US-007 |
| FE-F | Seletor de idioma na geração | US-015 (depende de BE-C) |
| FE-G | Bulk select em Meus Documentos | US-016 (depende de BE-E, FE-B) |
| FE-H | NPS pós-exportação | US-017 |

### Sprint 5 — Observabilidade, testes e performance
Ver `ANALISE-TECNICA-PRODUCAO.md` §4-5, itens 🟡: `BE-15…BE-26` (Sentry, testes, cron, custo de IA, índices) e `FE-08…FE-17` (lazy loading, SSR, toasts, Reactive Forms, testes unitários reais).

### Sprint 6 — Marketing e Aquisição de Clientes (a sprint final que você pediu)
Esta sprint só começa depois que a Sprint 3 (cobrança ativa) estiver no ar — é a própria regra do `PLANO-MARKETING-EDUCORE.md`: *"não gaste 1 real ou 1 hora em aquisição antes do checkout funcionar ponta a ponta"*. O plano completo (segmentação, canais, calendário de 90 dias, o que NÃO fazer) já está inteiramente escrito em `PLANO-MARKETING-EDUCORE.md` — esta sprint só resume o que entra primeiro:

1. Teste lado a lado EduCore vs. Smallpdf vs. SlideSpeak — decidir o diferencial real de venda
2. Gravar 6 vídeos demo curtos ("PDF vira quiz/resumo/slide em segundos", antes/depois)
3. Criar perfis Instagram/TikTok do EduCore
4. Recrutar 10-15 professores beta (trial estendido, sem cobrar ainda) e coletar depoimentos em vídeo
5. Publicar a página `/precos` com a proposta de valor por segmento (professor autônomo primeiro)
6. Entrar em 10 grupos de professores (WhatsApp/Telegram/Facebook)
7. Só então: 1º orçamento pequeno de tráfego pago (R$500-1000), depois de validar conversão orgânica

---

## 4. Checklist go/no-go atualizado

- [ ] Sprint 0 completa — nenhuma feature "fantasma" no menu (Turmas/Notificações/Fórum funcionando de verdade OU removidas)
- [ ] Sprint 1 completa (ver checklist detalhado em `ANALISE-TECNICA-PRODUCAO.md` §8)
- [ ] Sprint 2 completa — planos/quota reais, gating funcionando
- [ ] Sprint 3 completa — cobrança Asaas ativa, `/precos` no ar, cadastro self-service ponta a ponta
- [ ] Sprint 4 — pelo menos os itens de maior valor percebido (BE-A feedback, FE-B meus documentos) prontos
- [ ] Sprint 5 — observabilidade mínima (Sentry) rodando antes de ter tráfego pago de verdade
- [ ] Só então: Sprint 6 (marketing/vídeos/aquisição)

---

## 5. Documentos-fonte (não duplicados aqui)

> ⚠️ **Atualização de 04/07/2026:** o backlog `BE-*`/`FE-*` (dividido por área) e `demandas-tecnicas-tasks.json` foram **substituídos** por `DEMANDAS-EDUCORE-COMERCIAL.md` — catálogo único com demandas `D-01…D-49` full-stack e autossuficientes (sem separação frontend/backend), incluindo a correção das 6 features "fachada" descobertas na auditoria do board Avante (seção 1 e 2 deste documento continuam válidas como diagnóstico, só o backlog de execução mudou de formato).

| Documento | Cobre |
|---|---|
| `DEMANDAS-EDUCORE-COMERCIAL.md` | **Backlog de execução atual** — 49 demandas full-stack, autossuficientes, com critérios de aceite e prioridade |
| `demandas-educore-comercial-tasks.json` | Mesmo backlog, pronto para importação em massa no Avante |
| `ANALISE-TECNICA-PRODUCAO.md` | Diagnóstico técnico detalhado (segurança, LGPD, confiabilidade, escala, testes) — base das demandas D-09 em diante |
| `MULTITENANT-BILLING.md` | Billing técnico completo — migrations, enforcement de quota, gateway Asaas (base das demandas D-27…D-30) |
| `PLANO-MARKETING-EDUCORE.md` | Segmentação, canais, calendário de 90 dias, métricas — base das demandas D-45…D-49 |
| `PLANO-NEGOCIO.md` | Posicionamento de marca, preços, catálogo de produtos da empresa |
