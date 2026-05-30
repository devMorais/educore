# EduCore — Guia Completo de Configuração do Ambiente

Este guia foi escrito para qualquer pessoa que queira contribuir com o EduCore,
mesmo sem experiência prévia com as ferramentas utilizadas.
Siga os passos na ordem — não pule nenhum.

---

## O que você vai instalar

| Ferramenta | Para que serve | Versão |
|---|---|---|
| Laravel Herd | Servidor local + PHP + MySQL | Mais recente |
| PHP | Linguagem do backend | 8.4 |
| Composer | Gerenciador de pacotes PHP | Mais recente |
| Node.js | Ambiente do frontend + PptxGenJS | 20 LTS |
| Python | Microserviço de IA | 3.11.9 |
| MySQL | Banco do Laravel (igual produção) | Herd inclui |
| PostgreSQL | Banco do AI Service (pgvector) | 14 |
| pgvector | Extensão vetorial para IA | 0.8.2 |
| DBeaver | Interface visual do banco | Community |
| Git | Controle de versão | Mais recente |
| VS Code | Editor de código | Mais recente |
| Cmder Mini | Terminal melhorado | Mais recente |

---

## Arquitetura do projeto

```
EduCore/
├── backend/          Laravel 13 (PHP 8.4) — API REST
│                     https://educore.test
├── frontend/         Angular 20 — Interface do usuário
│                     http://localhost:4200
└── ai-service/       Python FastAPI — Microserviço de IA
                      http://127.0.0.1:8001
```

O projeto usa **3 serviços rodando ao mesmo tempo**. Você vai precisar de 2 terminais
abertos para rodar o frontend e o ai-service (o backend roda automaticamente pelo Herd).

---

## Requisitos mínimos de hardware

- Windows 10 ou 11 (64 bits)
- 8 GB de RAM (recomendado 16 GB)
- 15 GB de espaço livre em disco
- Conexão com a internet

---

## Passo 1 — Git

1. Acesse https://git-scm.com/download/win
2. Baixe e instale com as opções padrão
3. Verifique abrindo o CMD e rodando:

```bash
git --version
```

Deve aparecer `git version 2.x.x`

---

## Passo 2 — VS Code

1. Acesse https://code.visualstudio.com
2. Baixe e instale com as opções padrão
3. Extensões recomendadas (instale dentro do VS Code):
   - PHP Intelephense
   - Angular Language Service
   - Python (Microsoft)
   - GitLens
   - PostgreSQL (by Chris Kolkman)

---

## Passo 3 — Cmder Mini (terminal melhorado)

1. Acesse https://cmder.app
2. Baixe o **Cmder Mini**
3. Extraia o zip em uma pasta fácil (ex: `C:\cmder`)
4. Abra o `cmder.exe` — será o terminal que você vai usar daqui pra frente

---

## Passo 4 — Laravel Herd (PHP + servidor local)

1. Acesse https://herd.laravel.com
2. Baixe o instalador para Windows
3. Instale normalmente — ele configura o PHP 8.4 automaticamente
4. Após instalar, abra o Cmder e verifique:

```bash
herd php -v
```

Deve aparecer `PHP 8.4.x`

5. Verifique também o Composer:

```bash
composer -V
```

---

## Passo 5 — Node.js

1. Acesse https://nodejs.org
2. Baixe a versão **LTS** (20 ou superior)
3. Instale com as opções padrão
4. Feche e abra o Cmder novamente, depois verifique:

```bash
node -v
npm -v
```

Deve aparecer `v20.x.x`

5. Configure a variável de ambiente para evitar erros de SSL:

```bash
powershell -Command "[System.Environment]::SetEnvironmentVariable('NODE_OPTIONS', '--openssl-legacy-provider', 'User')"
```

6. Feche e abra o Cmder novamente

7. Instale o Angular CLI globalmente:

```bash
npm install -g @angular/cli
```

---

## Passo 6 — Python 3.11

> **Atenção:** Use exatamente a versão 3.11.9 — outras versões podem ter incompatibilidades.

1. Acesse: https://www.python.org/downloads/release/python-3119/
2. Baixe **Windows installer (64-bit)**
3. Execute o instalador — **MARQUE A OPÇÃO "Add Python 3.11 to PATH"** antes de instalar
4. Verifique **fechando e abrindo o Cmder novamente**:

```bash
python --version
pip --version
```

Deve aparecer `Python 3.11.9`

> Se `python` não for reconhecido mesmo após reiniciar o terminal, rode no PowerShell como administrador:
> ```powershell
> [System.Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Users\SEU_USUARIO\AppData\Local\Programs\Python\Python311;C:\Users\SEU_USUARIO\AppData\Local\Programs\Python\Python311\Scripts", "User")
> ```

---

## Passo 7 — PostgreSQL 14

1. Acesse https://www.postgresql.org/download/windows
2. Clique em **Download the installer**
3. Baixe o instalador do **PostgreSQL 14** (coluna Windows x86-64)
4. Execute o instalador:
   - Diretório de instalação: deixe o padrão (`C:\Program Files\PostgreSQL\14`)
   - Senha do superusuário: `123456` (anote bem esta senha!)
   - Porta: `5432` (padrão — não mude)
   - Locale: deixe o padrão
   - Stack Builder ao final: pode desmarcar e fechar

5. Verifique abrindo o Cmder:

```bash
psql -U postgres -c "SELECT version();"
```

Digite a senha `123456` quando solicitado.
Deve aparecer `PostgreSQL 14.x`

---

## Passo 8 — DBeaver (interface visual do banco)

1. Acesse https://dbeaver.io/download
2. Baixe a versão **Community Edition**
3. Instale com as opções padrão
4. Abra o DBeaver e crie uma nova conexão:
   - Clique em **Nova Conexão** (ícone de tomada)
   - Escolha **PostgreSQL**
   - Host: `localhost`
   - Porta: `5432`
   - Banco: `postgres`
   - Usuário: `postgres`
   - Senha: `123456`
5. Clique em **Testar conexão** — deve aparecer "Conectado"
6. Clique em **Finalizar**

---

## Passo 9 — pgvector (extensão vetorial para IA)

O pgvector permite armazenar e buscar vetores de IA diretamente no PostgreSQL.
É o coração do sistema RAG do EduCore.

### 9.1 Baixar

1. Acesse: https://github.com/andreiramani/pgvector_pgsql_windows/releases
2. Baixe o arquivo `vector.v0.8.2-pg14.zip`
3. Extraia o zip — você verá 3 pastas: `lib`, `share`, `include`

### 9.2 Instalar (precisa de administrador)

Abra o **CMD como administrador** e rode, substituindo `SEU_USUARIO`:

```bash
xcopy "C:\Users\SEU_USUARIO\Downloads\vector.v0.8.2-pg14\lib" "C:\Program Files\PostgreSQL\14\lib" /E /I /Y
xcopy "C:\Users\SEU_USUARIO\Downloads\vector.v0.8.2-pg14\share" "C:\Program Files\PostgreSQL\14\share" /E /I /Y
xcopy "C:\Users\SEU_USUARIO\Downloads\vector.v0.8.2-pg14\include" "C:\Program Files\PostgreSQL\14\include" /E /I /Y
```

### 9.3 Criar o banco e ativar a extensão

```bash
psql -U postgres -c "CREATE DATABASE edu_platform;"
psql -U postgres -d edu_platform -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

Deve aparecer `CREATE EXTENSION`

> **Nota técnica:** O pgvector 0.8.2 suporta até 2000 dimensões para índices.
> O EduCore usa o modelo `gemini-embedding-2` que gera vetores de 3072 dimensões.
> Por isso o índice está desativado temporariamente — a busca funciona normalmente
> via varredura sequencial. Isso será resolvido em versão futura.

---

## Passo 10 — Clonar o projeto

```bash
cd C:\Users\SEU_USUARIO\Herd
git clone https://github.com/devMorais/educore.git
cd educore
```

---

## Passo 11 — Configurar o backend

### 11.1 Instalar as dependências

```bash
cd backend
composer install
```

### 11.2 Criar o arquivo .env

```bash
copy .env.example .env
herd php artisan key:generate
```

### 11.3 Configurar o .env

Abra o arquivo `backend/.env` no VS Code e localize as linhas `DB_`. Substitua por:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=edu_platform
DB_USERNAME=root
DB_PASSWORD=root
```

> **Por que MySQL?** O ambiente local usa MySQL igual à produção (Hostinger).
> O PostgreSQL é usado apenas pelo AI Service (para embeddings com pgvector).

Localize também as linhas do Sanctum:

```env
SANCTUM_STATEFUL_DOMAINS=localhost:4200
SESSION_DOMAIN=localhost
FRONTEND_URL=http://localhost:4200
```

### 11.4 Configurar o Google OAuth

Peça as credenciais ao Fernando ou crie em https://console.cloud.google.com.

```env
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URL=http://localhost/api/auth/google/callback
```

> Se não tiver as credenciais, deixe em branco — o sistema funciona com email/senha.

### 11.4.1 Criar o banco MySQL

O Herd já inclui MySQL. Crie o banco com:

```bash
cd backend
php artisan db:create 2>/dev/null; php artisan migrate
```

Se der erro, crie o banco manualmente via DBeaver:
- Conecta no MySQL: Host `127.0.0.1`, porta `3306`, user `root`, senha `root`
- Cria um banco chamado `edu_platform`
- Depois rode: `php artisan migrate`

### 11.5 Rodar as migrations

```bash
php artisan migrate
```

Deve aparecer todas as migrations com status `DONE`.

---

## Passo 12 — Configurar o ai-service (microserviço de IA)

Este é o coração do EduCore — responsável por processar PDFs, gerar embeddings
e criar quiz, resumos e slides usando IA.

### 12.1 Entrar na pasta e criar o ambiente virtual

```bash
cd C:\Users\SEU_USUARIO\Herd\educore\ai-service
python -m venv venv
venv\Scripts\activate
```

O terminal deve mostrar `(venv)` no início — isso confirma que o ambiente está ativo.

### 12.2 Instalar as dependências Python

```bash
pip install fastapi uvicorn pymupdf pdfplumber langchain langchain-text-splitters langchain-google-genai google-generativeai google-genai pgvector psycopg2-binary python-multipart python-dotenv pydantic-settings llama-parse
```

> Este comando pode demorar alguns minutos.

### 12.3 Instalar as dependências Node.js (para geração de PPTX)

```bash
npm install
```

### 12.4 Criar o arquivo .env do ai-service

Crie o arquivo `ai-service/.env` com o conteúdo abaixo.
Peça as chaves de API ao Fernando:

```env
GEMINI_API_KEY=sua_chave_gemini_aqui
DATABASE_URL=postgresql://postgres:123456@localhost:5432/edu_platform
LLAMAPARSE_API_KEY=sua_chave_llamaparse_aqui
PORT=8001
```

**Como obter as chaves:**
- **Gemini API Key:** https://aistudio.google.com/apikey (gratuito)
- **LlamaParse API Key:** https://cloud.llamaindex.ai (gratuito — 10.000 páginas/mês)

> **Importante:** Nunca commite o arquivo `.env` no Git. Ele já está no `.gitignore`.

---

## Passo 13 — Configurar o frontend

```bash
cd C:\Users\SEU_USUARIO\Herd\educore\frontend
npm install
```

Verifique se o arquivo `src/environments/environment.development.ts` existe.
Se não existir, crie com:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://educore.test/api',
};
```

---

## Passo 14 — Rodar o projeto completo

Você precisa de **3 serviços rodando**. Abra **2 terminais**.

### Terminal 1 — AI Service (microserviço de IA)

```bash
cd C:\Users\SEU_USUARIO\Herd\educore\ai-service
venv\Scripts\activate
uvicorn main:app --reload --port 8001
```

Aguarde aparecer:
```
Iniciando EduCore AI Service...
Banco de dados inicializado com sucesso!
Application startup complete.
```

### Terminal 2 — Frontend Angular

```bash
cd C:\Users\SEU_USUARIO\Herd\educore\frontend
ng serve
```

Aguarde aparecer `Local: http://localhost:4200`

### Backend Laravel

O backend roda automaticamente pelo Herd. Não precisa de terminal.

---

## Passo 15 — Criar sua branch de trabalho

Nunca trabalhe diretamente na `main`. Crie sempre uma branch para suas tarefas.

O padrão do projeto é:

```
INICIAL-NUMERO/descricao-da-tarefa
```

Exemplos:
- `F-001/home-inicial` → Fernando, tarefa 1
- `C-001/pagina-login` → Claudia, tarefa 1
- `M-001/componente-quiz` → Marília, tarefa 1

Para criar sua branch:

```bash
cd C:\Users\SEU_USUARIO\Herd\educore
git checkout main
git pull origin main
git checkout -b C-001/sua-tarefa
```

Quando terminar:

```bash
git add .
git commit -m "C-001: descrição do que foi feito"
git push origin C-001/sua-tarefa
```

---

## Verificação final — tudo funcionando

| O que verificar | Como verificar | Resultado esperado |
|---|---|---|
| PHP | `herd php -v` | PHP 8.4.x |
| Python | `python --version` | Python 3.11.9 |
| Node | `node -v` | v20.x.x |
| Angular | `ng version` | Angular 20.x |
| PostgreSQL | `psql -U postgres -c "SELECT version();"` | PostgreSQL 14.x |
| pgvector | DBeaver → edu_platform → Extensions | `vector` na lista |
| Backend | https://educore.test/api/health | `{"status":"ok"}` |
| AI Service | http://127.0.0.1:8001/health | `{"status":"ok","service":"EduCore AI Service"}` |
| AI Service Docs | http://127.0.0.1:8001/docs | Interface Swagger da API |
| Frontend | http://localhost:4200 | Página inicial do EduCore |

---

## O que o AI Service faz

O microserviço Python é o coração inteligente do EduCore. Ele expõe os seguintes endpoints:

| Endpoint | Método | Descrição |
|---|---|---|
| `/documents/upload` | POST | Recebe PDF e inicia pipeline RAG |
| `/documents/{id}/status` | GET | Verifica status do processamento |
| `/documents/{id}/generate` | POST | Gera quiz, resumo ou slides |
| `/documents/{id}/export-pptx` | POST | Exporta apresentação .pptx profissional |
| `/documents/` | GET | Lista todos os documentos |
| `/health` | GET | Verifica saúde do serviço |

### Pipeline RAG (como o EduCore processa um PDF)

```
1. Upload do PDF
       ↓
2. LlamaParse extrai o texto (preserva estrutura, tabelas, colunas)
       ↓
3. LangChain divide em chunks (~512 tokens com overlap de 50)
       ↓
4. Gemini Embedding-2 gera vetores de 3072 dimensões para cada chunk
       ↓
5. pgvector armazena os vetores no PostgreSQL
       ↓
6. Ao gerar conteúdo: busca semântica encontra chunks relevantes
       ↓
7. Gemini 2.5 Flash gera quiz / resumo / slides com base no conteúdo
```

### Tipos de geração disponíveis

```json
// Quiz
{ "document_id": 1, "type": "quiz", "options": { "num_questions": 5 } }

// Resumo
{ "document_id": 1, "type": "summary" }

// Slides (retorna JSON estruturado)
{ "document_id": 1, "type": "slides", "options": { "num_slides": 8 } }
```

---

## Problemas comuns

**`python` não é reconhecido:**
Certifique-se de marcar "Add Python to PATH" durante a instalação, ou adicione manualmente via PowerShell como administrador.

**`ng` não é reconhecido:**
```bash
npm install -g @angular/cli
```

**`(venv)` não aparece no terminal:**
```bash
cd C:\Users\SEU_USUARIO\Herd\educore\ai-service
venv\Scripts\activate
```

**Erro de SSL no npm:**
```bash
set NODE_OPTIONS=--openssl-legacy-provider
npm install
```

**`herd php` não é reconhecido:**
Reinstale o Laravel Herd e reinicie o terminal.

**Erro de conexão com o banco:**
Verifique se o PostgreSQL está rodando — abra o DBeaver e tente conectar.

**Migrations com erro:**
Verifique se o banco `edu_platform` foi criado e se o `.env` está configurado.

**AI Service: erro 429 (quota excedida):**
O plano gratuito do Gemini tem limite de 100 requisições/minuto para embeddings.
Aguarde 1 minuto e tente novamente. Para PDFs grandes, o processamento pode pausar e retomar.

**Frontend não conecta com o backend:**
Verifique se `SANCTUM_STATEFUL_DOMAINS=localhost:4200` está no `backend/.env`.

---

## Fluxo de trabalho com branches

A branch `main` está **protegida** — ninguém faz push direto nela.

### Fluxo do colaborador

```bash
# 1. Pegar a main atualizada
git checkout main
git pull origin main

# 2. Criar sua branch
git checkout -b C-001/nome-da-feature

# 3. Trabalhar e commitar
git add .
git commit -m "C-001: descrição do que foi feito"

# 4. Enviar a branch
git push origin C-001/nome-da-feature

# 5. Abrir Pull Request no GitHub para revisão do Fernando
```

### Padrão de nomes de branch

```
INICIAL-NUMERO/descricao
```

Exemplos:
- `F-001/tela-resultado-quiz` → Fernando, tarefa 1
- `C-001/correcao-login` → Colaborador, tarefa 1

### O que acontece depois

1. Fernando revisa o PR no GitHub
2. Aprova e faz merge na `main`
3. Fernando testa local e faz deploy para homologação
4. Testa em https://educore.devmorais.com.br

---

## Contato

Qualquer dúvida fale com o Fernando pelo grupo do projeto.

Repositório: https://github.com/devMorais/educore
