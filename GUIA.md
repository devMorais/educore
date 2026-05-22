# EduCore — Guia Completo de Início

## Todo dia que for trabalhar, siga esta ordem:

---

## 1. Abrir o Cmder

Abra o Cmder na área de trabalho.

---

## 2. Terminal 1 — AI Service

```bash
cd C:\Users\Claudia\Herd\educore\ai-service
venv\Scripts\activate
uvicorn main:app --reload --port 8001
```

Aguarde aparecer:
```
Uvicorn running on http://127.0.0.1:8001
```

---

## 3. Terminal 2 — Frontend (abra uma nova aba no Cmder com o botão +)

```bash
cd C:\Users\Claudia\Herd\educore\frontend
ng serve
```

Aguarde aparecer:
```
Local: http://localhost:4200/
```

---

## 4. Backend Laravel

Sobe automaticamente pelo Herd. Verifique acessando no browser:
```
https://educore.test/api/health
```
Deve aparecer: `{"status":"ok","message":"API funcionando","version":"1.0.0"}`

---

## 5. Verificar se tudo está rodando

| Serviço | URL | Resultado esperado |
|---|---|---|
| Frontend | http://localhost:4200 | Tela do EduCore |
| Backend | https://educore.test/api/health | `{"status":"ok"}` |
| AI Service | http://127.0.0.1:8001/health | `{"status":"ok"}` |
| Swagger AI | http://127.0.0.1:8001/docs | Interface do Swagger |

---

## 6. Antes de começar a codar — Git

```bash
cd C:\Users\Claudia\Herd\educore
git checkout F-002/autenticacao-login
git pull origin main
```

---

## 7. Ao terminar o dia — Salvar o trabalho

```bash
cd C:\Users\Claudia\Herd\educore
git add .
git commit -m "F-002: descreva o que fez hoje"
git push origin F-002/autenticacao-login
```

---

## Branches do projeto

| Branch | Para que serve | Status |
|---|---|---|
| `main` | Código estável aprovado | ✅ Estável |
| `F-001/home-inicial` | Home page | ✅ Concluída |
| `F-002/autenticacao-login` | Login e cadastro | 🔄 Em andamento |

---

## Rotas do frontend

| Rota | Página |
|---|---|
| http://localhost:4200/ | Home |
| http://localhost:4200/login | Login |
| http://localhost:4200/cadastro | Cadastro |
| http://localhost:4200/dashboard | Dashboard (em breve) |

---

## Endpoints do Backend (Laravel)

**Base URL:** `https://educore.test/api`

| Endpoint | Método | Descrição |
|---|---|---|
| `/auth/login` | POST | Login |
| `/auth/register` | POST | Cadastro |
| `/auth/logout` | POST | Logout |
| `/auth/google` | GET | Login com Google |
| `/user` | GET | Dados do usuário logado |

---

## Endpoints do AI Service (Python FastAPI)

**Base URL:** `http://127.0.0.1:8001`

| Endpoint | Método | Descrição |
|---|---|---|
| `/health` | GET | Verifica se o serviço está online |
| `/documents/upload` | POST | Envia PDF |
| `/documents/{id}/status` | GET | Verifica processamento |
| `/documents/{id}/generate` | POST | Gera conteúdo com IA |
| `/documents/{id}/export-pptx` | POST | Baixa apresentação .pptx |
| `/documents/` | GET | Lista todos os documentos |

---

## Estrutura do projeto Angular

```
frontend/src/app/
├── core/
│   └── services/
│       ├── api.ts          ← serviço base de HTTP
│       └── auth.ts         ← autenticação (login, cadastro, logout)
├── features/
│   ├── auth/
│   │   ├── login/          ← tela de login
│   │   └── register/       ← tela de cadastro
│   └── home/
│       ├── sections/
│       │   ├── hero/       ← seção principal
│       │   └── how-it-works/ ← como funciona
├── shared/
│   └── components/
│       ├── navbar/         ← menu de navegação
│       └── footer/         ← rodapé
```

---

## Dúvidas?

Fale com o Fernando pelo grupo do projeto.  
Repositório: https://github.com/devMorais/educore