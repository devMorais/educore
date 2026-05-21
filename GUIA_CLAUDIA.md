# EduCore — Guia da Claudia 🎯
## Migrar para PostgreSQL e configurar o ambiente

Este guia foi feito especialmente para você, Claudia.
Siga cada passo com calma — não pule nenhum.

---

## PARTE 1 — Preparar o ambiente

### Passo 1 — Ligar o computador e abrir o Cmder

1. Ligue o computador normalmente
2. Localize o **Cmder** na sua área de trabalho ou em `C:\cmder\cmder.exe`
3. Clique duas vezes para abrir
4. Você vai ver uma tela preta com o símbolo `λ` — é aqui que você vai digitar todos os comandos

> Se não tiver o Cmder instalado, baixe em https://cmder.app (versão Mini)

---

### Passo 2 — Entrar na pasta do projeto

No Cmder, digite:

```bash
cd C:\Users\Claudia\Herd\educore
```

> Substitua `Claudia` pelo seu nome de usuário do Windows se for diferente.
> Para descobrir seu usuário, digite: `echo %USERNAME%`

Você vai ver algo assim no terminal:
```
C:\Users\Claudia\Herd\educore (main -> origin)
λ
```

Isso confirma que você está dentro do projeto. ✅

---

### Passo 3 — Criar sua branch de trabalho

Nunca trabalhe direto na `main`. Crie uma branch com seu nome:

```bash
git checkout main
git pull origin main
git checkout -b C-002/migracao-postgresql
```

Você vai ver:
```
Switched to a new branch 'C-002/migracao-postgresql'
```

Isso significa que você está na sua branch pessoal. ✅

---

### Passo 4 — Puxar tudo atualizado da main

```bash
git pull origin main
```

Isso vai baixar tudo que o Fernando desenvolveu — o pipeline de IA, os novos arquivos, o SETUP.md atualizado.

---

## PARTE 2 — Instalar o PostgreSQL

### Passo 5 — Baixar o PostgreSQL 14

1. Acesse no navegador: https://www.postgresql.org/download/windows
2. Clique em **Download the installer**
3. Na tabela que aparecer, localize a linha do **PostgreSQL 14**
4. Clique no link da coluna **Windows x86-64** para baixar
5. O arquivo vai para sua pasta Downloads — aguarde terminar

---

### Passo 6 — Instalar o PostgreSQL

1. Abra a pasta Downloads e clique duas vezes no arquivo `.exe` que baixou
2. Clique em **Next** nas primeiras telas
3. Na tela **Select Components**, deixe tudo marcado e clique **Next**
4. Na tela **Data Directory**, deixe o padrão e clique **Next**
5. Na tela **Password** — **MUITO IMPORTANTE:**
   - Digite: `123456`
   - Confirme: `123456`
   - **Anote essa senha! Você vai precisar dela sempre.**
6. Na tela **Port**, deixe `5432` e clique **Next**
7. Continue clicando **Next** até **Install**
8. Aguarde a instalação terminar (pode demorar 2-3 minutos)
9. Na última tela, **desmarque** o Stack Builder e clique **Finish**

---

### Passo 7 — Verificar se o PostgreSQL está funcionando

Abra o Cmder e digite:

```bash
psql -U postgres -c "SELECT version();"
```

Vai aparecer uma linha pedindo senha — digite `123456` e pressione Enter.

Se aparecer algo como `PostgreSQL 14.x` está funcionando! ✅

Se aparecer erro, reinicie o computador e tente novamente.

---

## PARTE 3 — Instalar o DBeaver

O DBeaver é uma interface visual para você ver e gerenciar o banco de dados.

### Passo 8 — Baixar e instalar o DBeaver

1. Acesse: https://dbeaver.io/download
2. Clique em **Download** na versão **Community** (gratuita)
3. Baixe o instalador `.exe`
4. Execute e instale com as opções padrão (Next, Next, Install)

---

### Passo 9 — Conectar o DBeaver ao PostgreSQL

1. Abra o DBeaver
2. Clique no ícone de **tomada/plug** no canto superior esquerdo (Nova Conexão)
3. Selecione **PostgreSQL** e clique **Next**
4. Preencha:
   - **Host:** `localhost`
   - **Port:** `5432`
   - **Database:** `postgres`
   - **Username:** `postgres`
   - **Password:** `123456`
5. Clique em **Test Connection** — deve aparecer **Connected** ✅
6. Clique em **Finish**

---

## PARTE 4 — Instalar o pgvector

O pgvector é uma extensão do PostgreSQL que permite armazenar vetores de IA.
É necessário para o EduCore funcionar.

### Passo 10 — Baixar o pgvector

1. Acesse: https://github.com/andreiramani/pgvector_pgsql_windows/releases
2. Procure a versão mais recente para **PostgreSQL 14 Windows**
3. Baixe o arquivo `.zip`
4. Extraia o zip — você vai ver 3 pastas: `lib`, `share`, `include`

---

### Passo 11 — Instalar o pgvector (precisa de administrador)

1. Pressione **Win + S**, digite **cmd**
2. Clique com botão direito no **Prompt de Comando** → **Executar como administrador**
3. Na janela preta que abrir, rode os 3 comandos abaixo

Substitua `Claudia` pelo seu usuário do Windows:

```bash
xcopy "C:\Users\Claudia\Downloads\vector.v0.8.2-pg14\lib" "C:\Program Files\PostgreSQL\14\lib" /E /I /Y
```

```bash
xcopy "C:\Users\Claudia\Downloads\vector.v0.8.2-pg14\share" "C:\Program Files\PostgreSQL\14\share" /E /I /Y
```

```bash
xcopy "C:\Users\Claudia\Downloads\vector.v0.8.2-pg14\include" "C:\Program Files\PostgreSQL\14\include" /E /I /Y
```

Cada comando vai mostrar vários arquivos sendo copiados. Isso é normal. ✅

---

### Passo 12 — Criar o banco de dados

Volte ao **Cmder normal** (não o administrador) e rode:

```bash
psql -U postgres -c "CREATE DATABASE edu_platform;"
```

Digite a senha `123456` quando pedir.

Deve aparecer: `CREATE DATABASE` ✅

Agora ative a extensão pgvector:

```bash
psql -U postgres -d edu_platform -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

Deve aparecer: `CREATE EXTENSION` ✅

---

## PARTE 5 — Configurar o backend Laravel

### Passo 13 — Atualizar o arquivo .env do backend

1. Abra o VS Code
2. Vá em **Arquivo → Abrir Pasta** e selecione `C:\Users\Claudia\Herd\educore`
3. No explorador de arquivos à esquerda, abra a pasta `backend`
4. Encontre o arquivo `.env` e clique nele para abrir

Localize as linhas que começam com `DB_` e **substitua todas** por:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=edu_platform
DB_USERNAME=postgres
DB_PASSWORD=123456
```

> Se você tinha MySQL antes, vai ver `DB_CONNECTION=mysql`. Troque por `pgsql`.

Agora adicione (ou verifique se já existe) no final do arquivo:

```env
SANCTUM_STATEFUL_DOMAINS=localhost:4200
SESSION_DOMAIN=localhost
FRONTEND_URL=http://localhost:4200
```

Salve o arquivo com **Ctrl + S**.

---

### Passo 14 — Instalar as dependências do backend

No Cmder, dentro da pasta do projeto:

```bash
cd C:\Users\Claudia\Herd\educore\backend
composer install
```

Aguarde terminar. Pode demorar alguns minutos.

---

### Passo 15 — Rodar as migrations

As migrations criam todas as tabelas no banco de dados:

```bash
herd php artisan migrate
```

Você vai ver várias linhas aparecendo com `DONE` no final de cada uma.

Se aparecer algum erro de conexão, verifique se o PostgreSQL está rodando —
abra o DBeaver e tente conectar.

---

### Passo 16 — Verificar se o backend está funcionando

Abra o navegador e acesse:

```
https://educore.test/api/health
```

Deve aparecer:
```json
{"status":"ok","message":"API funcionando","version":"1.0.0"}
```

Se aparecer isso, o backend está funcionando perfeitamente! ✅

---

## PARTE 6 — Rodar o frontend

### Passo 17 — Instalar as dependências do frontend

```bash
cd C:\Users\Claudia\Herd\educore\frontend
npm install
```

### Passo 18 — Rodar o frontend

```bash
ng serve
```

Aguarde aparecer `Local: http://localhost:4200`

Abra o navegador em: http://localhost:4200

Deve aparecer a página inicial do EduCore! ✅

---

## PARTE 7 — Verificação final

Abra o DBeaver, conecte no banco `edu_platform` e verifique se as tabelas foram criadas.
Você deve ver tabelas como `users`, `documents`, `sessions`, etc.

| O que verificar | Como verificar | Resultado esperado |
|---|---|---|
| PostgreSQL | `psql -U postgres -c "SELECT version();"` | PostgreSQL 14.x |
| pgvector | DBeaver → edu_platform → Extensions | `vector` na lista |
| Backend | https://educore.test/api/health | `{"status":"ok"}` |
| Frontend | http://localhost:4200 | Página inicial do EduCore |

---

## PARTE 8 — Contexto do projeto para usar com IA

Quando quiser pedir ajuda para uma IA (ChatGPT, Claude, Gemini) para trabalhar no frontend,
cole este contexto no início da conversa:

---

**CONTEXTO DO PROJETO EDUCORE — FRONTEND**

Estou trabalhando no frontend do **EduCore**, uma plataforma de geração automática de conteúdo educacional com IA.

**Stack:**
- Frontend: Angular 20
- Backend: Laravel 13 (PHP 8.4) rodando em https://educore.test
- Banco de dados: PostgreSQL 14 com pgvector
- AI Service: Python FastAPI rodando em http://127.0.0.1:8001

**O que o sistema faz:**
O professor faz upload de um PDF. O sistema usa o pipeline RAG (LlamaParse + LangChain + Gemini Embeddings + pgvector) para processar o documento e gera automaticamente: quiz de múltipla escolha, resumo com pontos-chave, slides estruturados e apresentação .pptx profissional.

**Endpoints do AI Service disponíveis:**
- `POST /documents/upload` — envia PDF, retorna `document_id`
- `GET /documents/{id}/status` — verifica se o processamento terminou (status: pending/processing/completed/failed)
- `POST /documents/{id}/generate` — gera conteúdo (body: `{"document_id": 1, "type": "quiz"}` — tipos: quiz, summary, slides)
- `POST /documents/{id}/export-pptx` — baixa apresentação .pptx
- `GET /documents/` — lista todos os documentos

**Estrutura do frontend Angular:**
```
frontend/src/app/
├── features/
│   └── home/
│       ├── home.ts
│       ├── home.html
│       └── sections/
│           ├── hero/
│           └── how-it-works/
└── shared/
    └── components/
        ├── navbar/
        └── footer/
```

**O que já está pronto no frontend:**
- Página inicial com Navbar, Hero, How It Works e Footer
- Design profissional com o template edu-core-frontend

**O que precisa ser desenvolvido:**
- Página de upload de PDF com drag-and-drop
- Tela de processamento com indicador de progresso
- Tela de resultados mostrando quiz, resumo ou slides gerados
- Integração com os endpoints do AI Service via HttpClient
- Sistema de autenticação (login/registro) integrado com o backend Laravel

**Autenticação no backend:**
O backend usa Laravel Sanctum para autenticação. As rotas protegidas precisam do header `Authorization: Bearer {token}`.

**Minha tarefa atual:**
Estou responsável pelo frontend Angular. O Fernando cuida do backend e do AI Service.
Preciso criar componentes Angular que se integrem com os endpoints descritos acima.

---

## Dúvidas?

Fale com o Fernando pelo grupo do projeto.

Repositório: https://github.com/devMorais/educore
