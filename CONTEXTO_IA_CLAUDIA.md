# EduCore — Contexto completo para usar com IA
## Cole este arquivo inteiro no início da conversa com qualquer IA

---

## SOBRE O PROJETO

Estou trabalhando no **frontend Angular 20** do **EduCore** — uma plataforma de geração automática de conteúdo educacional com Inteligência Artificial.

**Minha função:** Sou responsável pelo frontend. O Fernando cuida do backend e do microserviço de IA.

**Objetivo atual:** Adaptar, testar e implementar as telas do EduCore usando o template HTML/CSS que já existe no projeto, convertendo para componentes Angular e integrando com o backend real.

---

## STACK TECNOLÓGICA

- **Frontend:** Angular 20 (standalone components)
- **Backend:** Laravel 13 (PHP 8.4) → https://educore.test
- **Banco de dados:** PostgreSQL 14 + pgvector
- **AI Service:** Python FastAPI → http://127.0.0.1:8001
- **Autenticação:** Laravel Sanctum (Bearer Token)

---

## ESTRUTURA DO PROJETO ANGULAR

```
frontend/
├── src/
│   ├── app/
│   │   ├── features/
│   │   │   └── home/
│   │   │       ├── home.ts
│   │   │       ├── home.html
│   │   │       ├── home.scss
│   │   │       └── sections/
│   │   │           ├── hero/
│   │   │           │   ├── hero.ts
│   │   │           │   ├── hero.html
│   │   │           │   └── hero.scss
│   │   │           └── how-it-works/
│   │   │               ├── how-it-works.ts
│   │   │               ├── how-it-works.html
│   │   │               └── how-it-works.scss
│   │   └── shared/
│   │       └── components/
│   │           ├── navbar/
│   │           │   ├── navbar.ts
│   │           │   ├── navbar.html
│   │           │   └── navbar.scss
│   │           └── footer/
│   │               ├── footer.ts
│   │               ├── footer.html
│   │               └── footer.scss
│   ├── index.html
│   └── styles.scss
└── public/
    ├── images/     ← todas as imagens do template já copiadas aqui
    ├── js/         ← todos os scripts do template já copiados aqui
    └── webfonts/   ← Font Awesome já copiado aqui
```

---

## TEMPLATE HTML DISPONÍVEL

O projeto tem um template HTML completo em:
`frontend/1_edu-core-frontend/edu-core-frontend/`

**Páginas disponíveis no template (para converter para Angular):**

| Arquivo HTML | Para que serve no EduCore |
|---|---|
| `index.html` | Home page (já implementada parcialmente) |
| `sign_in.html` | Tela de login |
| `sign_up.html` | Tela de cadastro |
| `dashboard.html` | Dashboard do professor/aluno |
| `dashboard_profile.html` | Perfil do usuário |
| `dashboard_profile_edit.html` | Editar perfil |
| `dashboard_courses.html` | Lista de documentos/materiais |
| `dashboard_add_courses.html` | Upload de novo PDF |
| `dashboard_student.html` | Área do aluno |
| `dashboard_notification.html` | Notificações |
| `dashboard_security.html` | Segurança da conta |
| `courses.html` | Lista de materiais gerados |
| `courses_details.html` | Detalhes de um material |
| `contact.html` | Página de contato |
| `faq.html` | Perguntas frequentes |
| `pricing.html` | Planos e preços |
| `error.html` | Página 404 |

**CSS disponível no template:**
- `bootstrap.min.css` — grid e componentes
- `style.css` — estilos principais do template
- `responsive.css` — responsividade
- `animate.css` — animações
- `slick.css` — carrossel
- `venobox.min.css` — lightbox

**JS disponível no template:**
- `jquery-3.7.1.min.js`
- `bootstrap.bundle.min.js`
- `slick.min.js` — carrossel
- `wow.min.js` — animações no scroll
- `main.js` — inicializações do template

**Imagens disponíveis em `frontend/public/images/`:**
- Logo: `logo.png`, `logo_dark.png`, `footer_logo.png`
- Banners: `banner_img.png`, `banner_bg.png`, `banner_2_*`, `banner_3_*`
- Dashboard: `dash_icon_1.png` até `dash_icon_16.png`
- Login: `login_img_1.jpg`, `login_img_2.jpg`
- Cursos: `courses_img_1.jpg`, `courses_img_2.jpg`, `courses_img_3.jpg`
- Features: `features_icon_1.png` até `features_icon_4.png`
- Ícones variados para UI

---

## O QUE JÁ ESTÁ IMPLEMENTADO NO ANGULAR

### Componentes prontos:
- **Navbar** (`shared/components/navbar/`) — menu de navegação
- **Footer** (`shared/components/footer/`) — rodapé
- **Hero** (`features/home/sections/hero/`) — seção principal da home
- **How It Works** (`features/home/sections/how-it-works/`) — como funciona

### Rota principal:
- `/` → HomeComponent com Navbar + Hero + HowItWorks + Footer

---

## O QUE PRECISA SER IMPLEMENTADO

### Prioridade 1 — Autenticação
- Página de **Login** (`sign_in.html` → componente Angular)
- Página de **Cadastro** (`sign_up.html` → componente Angular)
- Serviço de autenticação com Sanctum
- Guard para rotas protegidas

### Prioridade 2 — Upload e processamento de PDF
- Página de **Upload de PDF** com drag-and-drop (`dashboard_add_courses.html`)
- Tela de **processamento** com indicador de progresso (polling do status)
- Integração com `POST /documents/upload` do AI Service

### Prioridade 3 — Resultados gerados pela IA
- Tela de **resultados** mostrando quiz, resumo ou slides gerados
- Botão de download do `.pptx`
- Integração com `POST /documents/{id}/generate`

### Prioridade 4 — Dashboard
- Lista de documentos já processados (`dashboard_courses.html`)
- Perfil do usuário (`dashboard_profile.html`)

---

## ENDPOINTS DO BACKEND (Laravel)

**Base URL:** `https://educore.test/api`

| Endpoint | Método | Descrição | Auth |
|---|---|---|---|
| `/auth/login` | POST | Login | ❌ |
| `/auth/register` | POST | Cadastro | ❌ |
| `/auth/logout` | POST | Logout | ✅ |
| `/auth/google` | GET | Login com Google | ❌ |
| `/user` | GET | Dados do usuário logado | ✅ |

**Headers para rotas autenticadas:**
```
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

---

## ENDPOINTS DO AI SERVICE (Python FastAPI)

**Base URL:** `http://127.0.0.1:8001`

| Endpoint | Método | Descrição |
|---|---|---|
| `/health` | GET | Verifica se o serviço está online |
| `/documents/upload` | POST | Envia PDF (multipart/form-data) |
| `/documents/{id}/status` | GET | Verifica processamento |
| `/documents/{id}/generate` | POST | Gera conteúdo com IA |
| `/documents/{id}/export-pptx` | POST | Baixa apresentação .pptx |
| `/documents/` | GET | Lista todos os documentos |

**Exemplo de upload de PDF:**
```typescript
const formData = new FormData();
formData.append('file', file);
this.http.post('http://127.0.0.1:8001/documents/upload', formData)
```

**Exemplo de geração de quiz:**
```typescript
this.http.post(`http://127.0.0.1:8001/documents/${id}/generate`, {
  document_id: id,
  type: 'quiz',        // 'quiz' | 'summary' | 'slides'
  options: { num_questions: 5 }
})
```

**Status possíveis de um documento:**
- `pending` — aguardando processamento
- `processing` — sendo processado pela IA
- `completed` — pronto para gerar conteúdo
- `failed` — erro no processamento

**Exemplo de polling do status:**
```typescript
// Verificar a cada 3 segundos até completar
const checkStatus = () => {
  this.http.get(`http://127.0.0.1:8001/documents/${id}/status`)
    .subscribe(doc => {
      if (doc.status === 'completed') {
        // Liberar geração de conteúdo
      } else if (doc.status === 'failed') {
        // Mostrar erro
      } else {
        setTimeout(checkStatus, 3000); // Verificar novamente
      }
    });
};
```

---

## RESPOSTA DO QUIZ (exemplo real gerado pelo sistema)

```json
{
  "title": "Quiz sobre o documento: Nossa Forma de Liderança",
  "questions": [
    {
      "question": "Qual é a definição de liderança?",
      "options": [
        "A) Capacidade de delegar tarefas",
        "B) Inspirar, motivar e animar ideias, pessoas ou projetos",
        "C) Habilidade de planejar estratégias",
        "D) Gestão eficiente de recursos"
      ],
      "correct_answer": "B) Inspirar, motivar e animar ideias, pessoas ou projetos",
      "explanation": "O conteúdo afirma explicitamente essa definição."
    }
  ],
  "document_id": 1,
  "total_questions": 5
}
```

---

## RESPOSTA DOS SLIDES (exemplo real)

```json
{
  "title": "QUALIDADE DE VIDA E ALTA PERFORMANCE: Liderança",
  "slides": [
    {
      "title": "O Essencial da Liderança",
      "content": [
        "Liderança é inspirar, motivar e animar ideias, pessoas ou projetos.",
        "Liderança não é dom, é virtude!",
        "Qual a sua forma de liderança?"
      ],
      "notes": "Defina liderança de forma concisa e impactante."
    }
  ],
  "document_id": 1,
  "total_slides": 8
}
```

---

## PADRÃO DE COMPONENTES ANGULAR DO PROJETO

```typescript
// Exemplo de componente standalone (padrão do projeto)
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-nome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nome.html',
  styleUrl: './nome.scss'
})
export class NomeComponent {
  constructor(private http: HttpClient) {}
}
```

---

## OBSERVAÇÕES IMPORTANTES

1. **Todos os componentes são standalone** — não usa NgModule
2. **As imagens ficam em `frontend/public/images/`** — no template HTML use `/images/nome.png`
3. **Os JS do template** ficam em `frontend/public/js/` — podem ser referenciados no `index.html`
4. **Não adaptar tudo do template** — usar só o que faz sentido para o EduCore (upload de PDF, resultados, dashboard, login)
5. **O template usa Bootstrap + jQuery** — pode usar as classes Bootstrap normalmente nos HTMLs dos componentes
6. **CORS já configurado** no backend e no AI Service — pode fazer requests direto do Angular

---

## COMO RODAR O AMBIENTE COMPLETO

```bash
# Terminal 1 — AI Service
cd C:\Users\Claudia\Herd\educore\ai-service
venv\Scripts\activate
uvicorn main:app --reload --port 8001

# Terminal 2 — Frontend
cd C:\Users\Claudia\Herd\educore\frontend
ng serve

# Backend Laravel roda automaticamente pelo Herd
# Acesse: https://educore.test/api/health para verificar
```

---

## REPOSITÓRIO

https://github.com/devMorais/educore

**Qualquer dúvida, fale com o Fernando pelo grupo do projeto.**
