# EduCore

Plataforma inteligente de aprendizado que transforma documentos PDF em experiências educacionais completas — quiz, resumos e apresentações — usando IA generativa com pipeline RAG.

## Demonstração

**Homologação:** https://educore.devmorais.com.br

---

## O que o EduCore faz

1. O usuário faz upload de um PDF (apostila, artigo, material didático)
2. A IA processa o documento, extrai o conteúdo e armazena embeddings vetoriais
3. O usuário escolhe o que gerar: quiz, resumo ou apresentação de slides
4. O sistema entrega conteúdo pedagógico estruturado, pronto para usar

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Angular 20 |
| Backend / API | Laravel 13, PHP 8.4 |
| Microserviço de IA | Python 3.11, FastAPI |
| Banco relacional | MySQL (Laravel) · PostgreSQL (AI Service) |
| Busca semântica | pgvector + Gemini Embedding-2 (3072 dim) |
| Extração de PDF | LlamaParse + pdfplumber |
| Geração de IA | Google Gemini 2.5 Flash |
| Apresentações | python-pptx (design EduCore nativo) |
| Autenticação | Laravel Sanctum + Google OAuth |
| Infraestrutura | Hostinger (Laravel + Angular) · Railway (FastAPI) · Supabase (PostgreSQL) |

---

## Funcionalidades

- **Upload com drag & drop** — validação de tipo/tamanho, barra de progresso em tempo real
- **Pipeline RAG assíncrono** — LlamaParse → chunking → embeddings → pgvector
- **Quiz** — perguntas de múltipla escolha geradas a partir do conteúdo real do documento
- **Resumo** — síntese estruturada com seções e pontos-chave
- **Slides** — apresentação `.pptx` com design system EduCore, 11 layouts, Padrão Ouro Pedagógico
- **Google Slides** — integração opcional via Google Workspace (API + service account)
- **Autenticação** — login/registro com email/senha ou Google OAuth

---

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    Angular 20                        │
│              https://educore.devmorais.com.br        │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         ▼                            ▼
┌─────────────────┐        ┌──────────────────────┐
│  Laravel 13     │        │  FastAPI (Python)     │
│  PHP 8.4        │        │  Railway              │
│  Hostinger      │        │                       │
│  MySQL          │        │  RAG Pipeline         │
└─────────────────┘        │  Quiz / Resumo / PPTX │
                           │  PostgreSQL + pgvector │
                           │  Supabase              │
                           └──────────────────────┘
```

---

## Configuração local

Consulte [SETUP.md](SETUP.md) para o guia completo passo a passo.

**Resumo rápido:**

```bash
# Clone
git clone https://github.com/devMorais/educore.git
cd educore

# Backend
cd backend && composer install && cp .env.example .env
php artisan key:generate && php artisan migrate

# AI Service
cd ../ai-service && python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt   # ou o comando completo no SETUP.md
# configure .env com GEMINI_API_KEY e DATABASE_URL
uvicorn main:app --reload --port 8001

# Frontend
cd ../frontend && npm install && ng serve
```

Acesse http://localhost:4200

---

## Variáveis de ambiente

### `ai-service/.env`

```env
GEMINI_API_KEY=
DATABASE_URL=postgresql://postgres:senha@localhost:5432/edu_platform
LLAMAPARSE_API_KEY=
PORT=8001
```

### `backend/.env` (principais)

```env
DB_CONNECTION=mysql
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SANCTUM_STATEFUL_DOMAINS=localhost:4200
```

---

## Deploy

O deploy para homologação é feito via `deploy-homolog.bat` (arquivo local, não versionado):

1. Commit + push → Railway auto-deploya o AI Service
2. Build Angular + SCP → Hostinger
3. SSH → `git pull + migrate + config:cache` no Laravel

---

## Contribuindo

1. Crie uma branch a partir da `main`: `git checkout -b F-001/nome-da-feature`
2. Desenvolva e commite: `git commit -m "F-001: descrição"`
3. Abra um Pull Request no GitHub
4. Fernando revisa e faz merge

A `main` está protegida — não faça push direto.

---

## Licença

Projeto privado — todos os direitos reservados.  
Desenvolvido por Fernando Morais.
