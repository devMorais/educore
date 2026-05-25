# Guia de Trabalho — EduCore

Rotina simples para começar e manter o projeto atualizado.

---

## 1. Ao ligar o computador (rotina de todo dia)

**Backend:** não precisa fazer nada. O Herd já deixa rodando sozinho.

**Frontend:** abrir o terminal na pasta do projeto e fazer:

```bash
cd frontend
git pull
ng serve
```

> **Sobre o `npm install`:** NÃO precisa rodar todo dia.
> Só rode `npm install` quando o `git pull` trouxer alteração no arquivo `package.json`
> (isso acontece quando alguém adicionou uma biblioteca nova).
> Na dúvida, se o `ng serve` der erro de "Cannot find module", rode `npm install` e tente de novo.

Resumo da ordem quando precisa instalar:

```bash
cd frontend
git pull
npm install      # só se package.json mudou
ng serve
```

O site abre em **http://localhost:4200**

---

## 2. Atualizar tudo (pegar o trabalho de todo mundo)

Faça isso antes de começar a trabalhar, para não ficar com versão velha:

```bash
git fetch --all --prune
git pull
```

- `git fetch --all --prune` → vê todas as branches novas e remove as que foram apagadas.
- `git pull` → atualiza a branch em que você está agora.

---

## 3. Salvar e enviar seu trabalho (para o quem trabalha na main)

Quando terminar de mexer em algo e quiser enviar para o GitHub:

```bash
git add .
git commit -m "descreva o que você fez aqui"
git push
```

> **Importante:** sempre dê `git pull` ANTES de começar a trabalhar,
> para evitar conflito com o que os outros enviaram.

---

## 4. Criar uma branch nova (rotina da Claudia)

Sempre crie a branch a partir da main atualizada:

```bash
git checkout main
git pull
git checkout -b F-XXX/nome-da-tarefa
```

Troque `F-XXX/nome-da-tarefa` pelo código e nome da tarefa, por exemplo:
`F-005/dashboard-aluno`

Trabalhe normalmente. Para salvar e enviar a branch pela primeira vez:

```bash
git add .
git commit -m "descreva o que você fez"
git push -u origin F-XXX/nome-da-tarefa
```

Nos próximos envios dessa mesma branch, basta:

```bash
git add .
git commit -m "mensagem"
git push
```

---

## 5. Trazer uma branch para a main (juntar o trabalho)

Quando a tarefa de uma branch estiver pronta e for para entrar na main:

```bash
git checkout main
git pull
git merge nome-da-branch
git push
```

> **Combinar antes!** Antes de juntar qualquer coisa na main,
> avisem um ao outro para evitar bagunçar o trabalho do outro.

---

## Comandos úteis para conferir

| O que você quer ver | Comando |
|---|---|
| Em qual branch estou e se tem coisa pra salvar | `git status` |
| Todas as branches (locais e remotas) | `git branch -a` |
| Últimos commits | `git log --oneline -10` |
| Commits de uma pessoa | `git log --author="Nome" --oneline --all` |

---

## Erros comuns e o que fazer

- **"Cannot find module ..." ao rodar `ng serve`** → falta instalar dependência. Rode `npm install`.
- **`ng serve` não é reconhecido** → use `npm start` (faz a mesma coisa).
- **"Your branch is ahead by X commits"** → você tem trabalho salvo só na sua máquina. Rode `git push` para enviar.
- **Conflito ao dar `git pull` ou `git merge`** → não entre em pânico, parem e resolvam juntos antes de continuar.