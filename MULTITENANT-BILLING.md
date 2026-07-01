# 🏢 EduCore — Mapeamento Técnico: Multi-Tenant + Billing

> Base: análise do código atual (Laravel + AI Service FastAPI + PostgreSQL/pgvector).
> Objetivo: transformar o EduCore em SaaS cobrável. Última atualização: 27/06/2026.

---

## 0. Diagnóstico — ponto de partida real

| Camada | Estado atual | Veredito |
|--------|-------------|----------|
| Identidade/auth | Laravel Sanctum, users em MySQL, `GET /api/auth/verify` devolve `user_id,email,role` | ✅ Pronto |
| Isolamento de dados | `user_id` em `documents`/`generations`/`chunks`; `ownership_check()` em todas as rotas; índice em `user_id` | ✅ **Já é multi-tenant por usuário** |
| Organizações/times (B2B) | Não existe | ⚠️ Decisão de produto |
| Planos / quota / cobrança | **Não existe nada** | 🔴 Greenfield — é aqui que está o trabalho |

**Insight-chave:** o multi-tenant B2C já está feito. Não reescreva isolamento — ele funciona. Foque o esforço em **billing + enforcement de quota**.

---

## 1. Decisão de modelo de tenancy

Escolher ANTES de codar billing, porque define a chave de cobrança.

### Opção A — Conta individual (B2C) ✅ recomendada para o MVP
- Tenant = `user`. Já implementado. Cada usuário tem seus documentos.
- Billing atrelado ao `user_id`.
- **Esforço:** baixo. Só adicionar planos sobre o que existe.

### Opção B — Organização/time (B2B)
- Tenant = `organization`. Vários usuários compartilham documentos e uma assinatura.
- Exige: tabela `organizations`, `organization_user` (pivot + papel), `organization_id` em users e em `documents`/`generations`, e trocar `ownership_check` de `user_id` → `organization_id`.
- **Esforço:** médio-alto. Recomendo como **fase 2**, depois que houver receita B2C.

> **Recomendação:** lançar com **Opção A**. Migrar para B2B é incremental (adicionar `organization_id` opcional; quando nulo, cai no comportamento atual).

---

## 2. Modelo de dados — Billing (no Laravel/MySQL)

A cobrança vive no Laravel (onde já está a identidade e o gateway de pagamento existe no Votar). O AI Service apenas **lê** o plano via API.

### 2.1 Migrations novas (Laravel)

```
plans            id, slug, name, price_cents, interval (monthly/yearly),
                 limits_json {pdfs_per_month, generations_per_month, max_users},
                 is_active, created_at

subscriptions    id, user_id (ou organization_id), plan_id, status
                 (active/past_due/canceled/trialing), gateway,
                 gateway_subscription_id, current_period_start,
                 current_period_end, canceled_at, trial_ends_at

payments         id, subscription_id, amount_cents, status (paid/failed/refunded),
                 gateway_payment_id, paid_at, raw_payload_json

usage_counters   id, user_id, period (YYYY-MM), pdfs_used,
                 generations_used, updated_at   (unique: user_id + period)
```

> `limits_json` em `plans` mantém limites flexíveis sem migration nova a cada ajuste.
> `usage_counters` é a fonte de verdade para quota mensal — reseta por período (YYYY-MM).

### 2.2 Models / relacionamentos
- `User hasOne activeSubscription` / `hasMany subscriptions`.
- `Subscription belongsTo Plan`.
- Helper `User::currentPlanLimits()` → array com limites (free como fallback se sem assinatura).

---

## 3. Enforcement de quota (onde o dinheiro encontra o código)

Dois pontos de checagem. O **AI Service** é quem precisa barrar, porque é lá que o custo (Gemini/LlamaParse) acontece.

### 3.1 Estender `GET /api/auth/verify` no Laravel
Hoje devolve `user_id,email,role`. Adicionar:
```json
{
  "user_id": 12, "email": "...", "role": "user",
  "plan": "pro",
  "limits": { "pdfs_per_month": 30, "generations_per_month": 200 },
  "usage":  { "pdfs_used": 7, "generations_used": 41 },
  "subscription_status": "active"
}
```
- Arquivo: `backend/app/Http/Controllers/Api/AuthController.php` → método `verify`.
- O AI Service já cacheia essa resposta ([auth.py:29](ai-service/app/core/auth.py#L29)) — TTL curto (ex: 60s) para refletir consumo.

### 3.2 Barrar no AI Service
- Em `auth.py`, propagar `plan/limits/usage` no dict `current_user`.
- Criar dependência `enforce_quota(kind)` e aplicar:
  - **Upload de PDF** → [documents.py:85](ai-service/app/routers/documents.py#L85): se `usage.pdfs_used >= limits.pdfs_per_month` → HTTP 402 (Payment Required) com mensagem de upgrade.
  - **Generate (quiz/resumo/slides)** → [documents.py:301](ai-service/app/routers/documents.py#L301): mesma lógica com `generations`.
- Após sucesso, chamar `POST /api/usage/increment` no Laravel (`{ kind: "pdf"|"generation" }`) que faz `usage_counters++` no período atual. Idempotência via `document_id`/`generation_id` para evitar contagem dupla em retry.

> Decisão: **contabilizar no Laravel** (fonte única) e não no Postgres do AI Service — evita divergência entre os dois bancos.

---

## 4. Gateway de pagamento — reaproveitar o do Votar

O Votar já integra **Asaas** e **InfinitePay** com webhooks (`PagamentoAsaasControlador`, `PagamentoInfinitepayControlador`). Portar esse código para o Laravel do EduCore.

### 4.1 Recomendação de gateway
- **Asaas** para assinatura recorrente (suporta cobrança recorrente nativa, PIX/cartão/boleto, mercado BR). InfinitePay como alternativa de checkout.
- Stripe só se for cobrar internacional — fica fase 2.

### 4.2 Fluxo
```
1. Usuário escolhe plano  →  POST /api/billing/subscribe { plan_slug }
2. Laravel cria customer + subscription no Asaas  →  retorna URL de pagamento
3. Webhook Asaas  →  POST /api/webhooks/asaas
   - payment.confirmed  → subscriptions.status=active, cria payment, define period_end
   - payment.overdue    → status=past_due
   - subscription.canceled → status=canceled
4. AI Service lê status atualizado via /auth/verify (cache 60s)
```

### 4.3 Rotas novas (Laravel `api.php`)
```
POST   /api/billing/subscribe        (auth) inicia assinatura
GET    /api/billing/subscription     (auth) status atual + uso
POST   /api/billing/cancel           (auth) cancela ao fim do período
GET    /api/plans                    (público) catálogo de planos
POST   /api/usage/increment          (interno, AI Service) ++ contador
POST   /api/webhooks/asaas           (público, valida assinatura) eventos
```

---

## 5. Frontend (Angular)

- Página `/precos` — catálogo de planos (consome `GET /api/plans`).
- Página `/conta/assinatura` — plano atual, uso do mês (barra), botão upgrade/cancelar.
- Interceptor: tratar **HTTP 402** → modal "Você atingiu o limite do plano Free. Faça upgrade."
- Badge de uso no header ("7/30 PDFs este mês").

---

## 6. Roteiro de implementação (ordem sugerida)

**Sprint 1 — Planos e quota (sem cobrança ainda)**
1. Migrations: `plans`, `subscriptions`, `usage_counters`.
2. Seed de planos (Free/Pro/Equipe) com `limits_json`.
3. Estender `/auth/verify` com plan/limits/usage.
4. `enforce_quota` + 402 no AI Service (upload e generate).
5. `POST /api/usage/increment` idempotente.
6. Frontend: barra de uso + modal 402.
> Resultado: já dá para limitar o plano Free e provar o gating, **sem gateway**.

**Sprint 2 — Cobrança**
7. Portar Asaas do Votar.
8. `/api/billing/*` + webhook + página `/precos`.
9. Trial de 7 dias (`trial_ends_at`).

**Sprint 3 — Operação**
10. E-mails: boas-vindas, falha de pagamento, fim de trial.
11. Painel admin: assinaturas, MRR, churn (estender `AdminController`).
12. Dunning (retry de pagamento atrasado).

**Fase 2 — B2B (quando houver demanda)**
13. `organizations` + pivot; `organization_id` em users/documents.
14. Migrar `ownership_check` para escopo de organização.

---

## 7. Pontos de atenção / riscos

- **Dois bancos (MySQL + Postgres):** mantenha billing só no MySQL; o Postgres nunca decide cobrança. Evita inconsistência.
- **Cache de `/auth/verify`:** TTL atual pode mascarar bloqueio de quota; reduzir para ~60s ou invalidar no upgrade.
- **Idempotência de webhook:** Asaas reenvia eventos — usar `gateway_payment_id` como chave única.
- **Race condition de quota:** dois uploads simultâneos podem furar o limite; usar `UPDATE ... WHERE pdfs_used < limit` atômico ou lock por linha.
- **LGPD:** assinatura implica guardar dados de pagamento — não armazenar cartão (deixar com o gateway), guardar só `gateway_*_id`.
- **Reembolso/cancelamento:** definir política (acesso até fim do período pago).
```
```
