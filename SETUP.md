# EduCore — Guia de Configuração do Ambiente

Guia para desenvolvedores que queiram rodar o EduCore localmente.
Siga os passos na ordem.

---

## Visão geral

```
educore/
├── backend/      Laravel 13 (PHP 8.4)  — API REST + autenticação
├── frontend/     Angular 20            — Interface do usuário
└── ai-service/   Python FastAPI        — Pipeline RAG, IA, geração de conteúdo
```

Três serviços rodando em paralelo:

| Serviço | URL local |
|---------|-----------|
| Backend (Laravel) | https://educore.test |
| Frontend (Angular) | http://localhost:4200 |
| AI Service (FastAPI) | http://localhost:8001 |

O backend roda automaticamente via Laravel Herd. Frontend e AI Service precisam de um terminal cada.

---

## Requisitos

- Windows 10 ou 11 (64-bit)
- 8 GB RAM (16 GB recomendado)
- 15 GB de espaço livre

---

## Passo 1 — Git

Acesse https://git-scm.com/download/win, instale com opções padrão.

```bash
git --version
# git version 2.x.x
```

---

## Passo 2 — VS Code

Acesse https://code.visualstudio.com. Extensões recomendadas:
- PHP Intelephense
- Angular Language Service
- Python (Microsoft)
- GitLens

---

## Passo 3 — Laravel Herd (PHP 8.4 + servidor local)

Acesse https://herd.laravel.com, instale o Herd para Windows.

```bash
herd php -v
# PHP 8.4.x
composer -V
```

---

## Passo 4 — Node.js 20 LTS

Acesse https://nodejs.org, instale a versão LTS.

```bash
node -v
# v20.x.x
npm install -g @angular/cli
```

---

## Passo 5 — Python 3.11

Use exatamente a versão 3.11.x. Marque **"Add Python to PATH"** durante a instalação.

Acesse https://www.python.org/downloads/release/python-3119/

```bash
python --version
# Python 3.11.x
```

---

## Passo 6 — PostgreSQL 14

Acesse https://www.postgresql.org/download/windows → PostgreSQL 14.

- Senha do superusuário: `123456`
- Porta: `5432`

```bash
psql -U postgres -c "SELECT version();"
```

---

## Passo 7 — pgvector

O AI Service usa pgvector para busca semântica (embeddings de 3072 dimensões).

1. Baixe `vector.v0.8.2-pg14.zip` em https://github.com/andreiramani/pgvector_pgsql_windows/releases
2. Extraia e copie as pastas `lib`, `share`, `include` para `C:\Program Files\PostgreSQL\14\`
3. Crie o banco e ative a extensão:

```bash
psql -U postgres -c "CREATE DATABASE edu_platform;"
psql -U postgres -d edu_platform -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

---

## Passo 8 — Clonar o projeto

```bash
cd C:\Users\SEU_USUARIO\Herd
git clone https://github.com/devMorais/educore.git
cd educore
```

---

## Passo 9 — Backend (Laravel)

```bash
cd backend
composer install
copy .env.example .env
herd php artisan key:generate
```

Edite `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=edu_platform
DB_USERNAME=root
DB_PASSWORD=root

SANCTUM_STATEFUL_DOMAINS=localhost:4200
SESSION_DOMAIN=localhost
FRONTEND_URL=http://localhost:4200

GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REDIRECT_URL=http://localhost/api/auth/google/callback
```

> Google OAuth é opcional — o sistema funciona com email/senha se as chaves estiverem em branco.

Crie o banco e rode as migrations:

```bash
php artisan migrate
```

---

## Passo 10 — AI Service (FastAPI)

```bash
cd C:\Users\SEU_USUARIO\Herd\educore\ai-service
python -m venv venv
venv\Scripts\activate
```

Instale as dependências:

```bash
pip install fastapi uvicorn pymupdf pdfplumber langchain langchain-text-splitters ^
    langchain-google-genai google-generativeai google-genai pgvector psycopg2-binary ^
    python-multipart python-dotenv pydantic-settings llama-parse python-pptx ^
    google-api-python-client google-auth google-auth-httplib2
```

Crie `ai-service/.env`:

```env
GEMINI_API_KEY=sua_chave_aqui
DATABASE_URL=postgresql://postgres:123456@localhost:5432/edu_platform
LLAMAPARSE_API_KEY=sua_chave_aqui
PORT=8001

# D-04: chave compartilhada com o Laravel pra POST /api/internal/notifications
# (avisa quando um documento termina de processar). Precisa ter o MESMO valor
# do INTERNAL_API_KEY em backend/.env — gere uma string aleatória qualquer.
LARAVEL_INTERNAL_API_KEY=uma_chave_aleatoria_igual_nos_dois_env

# Opcional — integração Google Slides (requer Google Workspace)
# GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

**Como obter as chaves:**
- Gemini API Key: https://aistudio.google.com/apikey (gratuito)
- LlamaParse API Key: https://cloud.llamaindex.ai (gratuito — 10.000 páginas/mês)

---

## Passo 11 — Frontend (Angular)

```bash
cd C:\Users\SEU_USUARIO\Herd\educore\frontend
npm install
```

Verifique `src/environments/environment.development.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://educore.test/api',
  aiServiceUrl: 'http://localhost:8001',
};
```

---

## Rodando o projeto

Você precisa de **2 terminais**. O backend sobe automaticamente pelo Herd.

**Terminal 1 — AI Service:**

```bash
cd C:\Users\SEU_USUARIO\Herd\educore\ai-service
venv\Scripts\activate
uvicorn main:app --reload --port 8001
```

Aguarde: `Application startup complete.`

**Terminal 2 — Frontend:**

```bash
cd C:\Users\SEU_USUARIO\Herd\educore\frontend
ng serve
```

Aguarde: `Local: http://localhost:4200`

---

## Verificação

| Serviço | URL | Resultado esperado |
|---------|-----|--------------------|
| Backend | https://educore.test/api/health | `{"status":"ok"}` |
| AI Service | http://localhost:8001/health | `{"status":"ok"}` |
| AI Service Docs | http://localhost:8001/docs | Swagger UI |
| Frontend | http://localhost:4200 | Interface EduCore |

---

## Endpoints do AI Service

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/documents/upload` | POST | Recebe PDF e inicia pipeline RAG |
| `/documents/{id}/status` | GET | Status do processamento |
| `/documents/{id}/generate` | POST | Gera quiz, resumo ou slides |
| `/documents/{id}/export-pptx` | POST | Exporta `.pptx` com design EduCore |
| `/documents/` | GET | Lista documentos |
| `/health` | GET | Health check |

**Tipos de geração:**

```json
{ "document_id": 1, "type": "quiz",    "options": { "num_questions": 5 } }
{ "document_id": 1, "type": "summary" }
{ "document_id": 1, "type": "slides",  "options": { "num_slides": 20 } }
```

---

## Problemas comuns

| Erro | Solução |
|------|---------|
| `python` não reconhecido | Marque "Add to PATH" na instalação ou adicione manualmente |
| `ng` não reconhecido | `npm install -g @angular/cli` |
| `(venv)` não aparece | `cd ai-service && venv\Scripts\activate` |
| Erro de conexão com banco | Verifique se PostgreSQL está rodando |
| AI Service erro 429 | Limite gratuito Gemini (100 req/min). Aguarde 1 minuto. |
| Frontend não conecta | `SANCTUM_STATEFUL_DOMAINS=localhost:4200` no `backend/.env` |

---

## Fluxo de branches

A `main` está protegida. Trabalhe sempre em branches:

```bash
git checkout main && git pull
git checkout -b F-001/nome-da-feature
# desenvolva...
git add . && git commit -m "F-001: descrição"
git push origin F-001/nome-da-feature
# abra Pull Request no GitHub
```

Padrão de nomes: `INICIAL-NUMERO/descricao` (ex: `F-001/tela-quiz`, `C-002/fix-login`)

---

## Contato

Repositório: https://github.com/devMorais/educore  
Dúvidas: fale com Fernando pelo grupo do projeto.
