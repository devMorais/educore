# EduCore — Guia Completo de Configuração do Ambiente

Este guia foi escrito para qualquer pessoa que queira contribuir com o EduCore,
mesmo sem experiência prévia com as ferramentas utilizadas.
Siga os passos na ordem — não pule nenhum.

---

## O que você vai instalar

| Ferramenta | Para que serve | Versão |
|---|---|---|
| Laravel Herd | Servidor local + PHP | Mais recente |
| PHP | Linguagem do backend | 8.4 |
| Composer | Gerenciador de pacotes PHP | Mais recente |
| Node.js | Ambiente do frontend | 20 LTS |
| PostgreSQL | Banco de dados | 14 |
| pgvector | Extensão de IA para o banco | 0.8.2 |
| DBeaver | Interface visual do banco | Community |
| Git | Controle de versão | Mais recente |
| VS Code | Editor de código | Mais recente |
| Cmder Mini | Terminal melhorado | Mais recente |

---

## Requisitos mínimos de hardware

- Windows 10 ou 11 (64 bits)
- 8 GB de RAM (recomendado 16 GB)
- 10 GB de espaço livre em disco
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
herd php -r "echo 'OK';"
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

Deve aparecer `v20.x.x` e `10.x.x`

5. Configure a variável de ambiente para evitar erros de SSL:

```bash
powershell -Command "[System.Environment]::SetEnvironmentVariable('NODE_OPTIONS', '--openssl-legacy-provider', 'User')"
```

6. Feche e abra o Cmder novamente para carregar a variável

7. Instale o Angular CLI globalmente:

```bash
npm install -g @angular/cli
```

8. Verifique:

```bash
ng version
```

---

## Passo 6 — PostgreSQL 14

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

## Passo 7 — DBeaver (interface visual do banco)

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

## Passo 8 — pgvector (extensão de IA para o banco)

O pgvector permite armazenar e buscar vetores de IA diretamente no PostgreSQL.
É o coração do sistema RAG do EduCore.

### 8.1 Baixar

1. Acesse: https://github.com/andreiramani/pgvector_pgsql_windows/releases
2. Clique na versão **pgvector v0.8.2 for PostgreSQL 14, Microsoft Windows**
3. Baixe o arquivo `vector.v0.8.2-pg14.zip`
4. Extraia o zip — você verá 3 pastas: `lib`, `share`, `include`

### 8.2 Instalar (precisa de administrador)

Abra o **CMD como administrador**:
- Pressione Win + S
- Digite `cmd`
- Clique com botão direito → **Executar como administrador**

Rode os 3 comandos abaixo, substituindo `SEU_USUARIO` pelo seu nome de usuário Windows:

```bash
xcopy "C:\Users\SEU_USUARIO\Downloads\vector.v0.8.2-pg14\lib" "C:\Program Files\PostgreSQL\14\lib" /E /I /Y
xcopy "C:\Users\SEU_USUARIO\Downloads\vector.v0.8.2-pg14\share" "C:\Program Files\PostgreSQL\14\share" /E /I /Y
xcopy "C:\Users\SEU_USUARIO\Downloads\vector.v0.8.2-pg14\include" "C:\Program Files\PostgreSQL\14\include" /E /I /Y
```

### 8.3 Criar o banco e ativar a extensão

De volta ao Cmder normal (não precisa ser admin):

```bash
psql -U postgres -c "CREATE DATABASE edu_platform;"
psql -U postgres -d edu_platform -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

Deve aparecer `CREATE EXTENSION` — se aparecer, está funcionando!

---

## Passo 9 — Clonar o projeto

```bash
cd C:\Users\SEU_USUARIO\Herd
git clone https://github.com/devMorais/educore.git
cd educore
```

---

## Passo 10 — Configurar o backend

### 10.1 Instalar as dependências

```bash
cd backend
composer install
```

### 10.2 Criar o arquivo .env

```bash
copy .env.example .env
herd php artisan key:generate
```

### 10.3 Configurar o .env

Abra o arquivo `backend/.env` no VS Code e localize as linhas que começam com `DB_`.
Substitua por:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=edu_platform
DB_USERNAME=postgres
DB_PASSWORD=123456
```

Localize também as linhas do Sanctum e frontend:

```env
SANCTUM_STATEFUL_DOMAINS=localhost:4200
SESSION_DOMAIN=localhost
FRONTEND_URL=http://localhost:4200
```

### 10.4 Configurar o Google OAuth

Para o login com Google funcionar, você precisa de credenciais do Google.
Peça as credenciais ao Fernando ou crie as suas em https://console.cloud.google.com.

No `.env`, preencha:

```env
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URL=http://localhost/api/auth/google/callback
```

> Se não tiver as credenciais ainda, deixe em branco por enquanto.
> O sistema funciona normalmente com login por e-mail e senha.

### 10.5 Rodar as migrations

```bash
herd php artisan migrate
```

Deve aparecer todas as migrations com status `DONE`.

### 10.6 Verificar a conexão

```bash
herd php artisan tinker
```

Quando aparecer `>>>`, digite:

```php
DB::connection()->getPdo()->getAttribute(PDO::ATTR_SERVER_VERSION);
```

Deve retornar a versão do PostgreSQL (ex: `"14.12"`). Digite `exit` para sair.

---

## Passo 11 — Configurar o frontend

```bash
cd C:\Users\SEU_USUARIO\Herd\educore\frontend
npm install
```

Verifique se o arquivo `src/environments/environment.development.ts` existe.
Se não existir, crie com o conteúdo:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://educore.test/api',
};
```

---

## Passo 12 — Rodar o projeto

Você precisa de **dois terminais abertos ao mesmo tempo**.

**Terminal 1 — Backend** (Laravel já roda automaticamente pelo Herd)

Verifique acessando no browser: https://educore.test/api/health
Deve aparecer: `{"status":"ok","message":"API funcionando","version":"1.0.0"}`

**Terminal 2 — Frontend**

```bash
cd C:\Users\SEU_USUARIO\Herd\educore\frontend
ng serve
```

Aguarda aparecer `Local: http://localhost:4200` e acesse no browser.

---

## Passo 13 — Criar sua branch de trabalho

Nunca trabalhe diretamente na `main`. Crie sempre uma branch para suas tarefas.

O padrão de nomenclatura do projeto é:

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

Quando terminar sua tarefa:

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
| Node | `node -v` | v20.x.x |
| Angular | `ng version` | Angular 20.x |
| PostgreSQL | `psql -U postgres -c "SELECT version();"` | PostgreSQL 14.x |
| pgvector | DBeaver → edu_platform → Extensions | `vector` aparece na lista |
| Backend | https://educore.test/api/health | `{"status":"ok"}` |
| Frontend | http://localhost:4200 | Página inicial do EduCore |

---

## Problemas comuns

**`ng` não é reconhecido:**
```bash
npm install -g @angular/cli
```

**Erro de SSL no npm:**
```bash
set NODE_OPTIONS=--openssl-legacy-provider
npm install
```

**`herd php` não é reconhecido:**
Reinstale o Laravel Herd e reinicie o terminal.

**Erro de conexão com o banco:**
Verifique se o PostgreSQL está rodando:
- Abra o DBeaver e tente conectar
- Ou abra o Painel de Controle → Ferramentas Administrativas → Serviços → procure por `postgresql-x64-14`

**Migrations com erro:**
Verifique se o banco `edu_platform` foi criado e se o `.env` está configurado corretamente.

**Frontend não conecta com o backend:**
Verifique se o `SANCTUM_STATEFUL_DOMAINS` no `.env` está como `localhost:4200`.

---

## Contato

Qualquer dúvida fale com o Fernando pelo grupo do projeto.

Repositório: https://github.com/devMorais/educore
