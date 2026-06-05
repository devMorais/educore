/// <reference types="cypress" />

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface Usuario {
  name: string
  email: string
  senha: string
  token?: string
}

// Gera credenciais determinísticas por prefixo.
// Emails são fixos por prefixo: na 1ª execução cria o usuário,
// nas seguintes detecta 422 e faz login — evita esgotar o rate limit.
export function gerarUsuario(prefixo = 'cy'): Usuario {
  return {
    name:  `Cypress ${prefixo}`,
    email: `cypress_${prefixo}@educore-test.com`,
    senha: 'CypressTest@123',
  }
}

// ── Comandos customizados ────────────────────────────────────────────────────

declare global {
  namespace Cypress {
    interface Chainable {
      criarContaAPI(usuario: Usuario): Chainable<string>
      loginAPI(email: string, senha: string): Chainable<string>
      loginUI(email: string, senha: string): Chainable<void>
      getToken(): Chainable<string>
      comToken(token: string): Chainable<Cypress.RequestOptions>
    }
  }
}

// Cria uma conta via API e retorna o token.
// Trata 422 (email já existe → login) e 429 (rate limit → aguarda 65s e tenta novamente).
Cypress.Commands.add('criarContaAPI', (usuario: Usuario) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/register`,
    body: {
      name: usuario.name,
      email: usuario.email,
      password: usuario.senha,
      password_confirmation: usuario.senha,
    },
    headers: { 'Accept': 'application/json' },
    failOnStatusCode: false,
    followRedirect: false,
  }).then((res) => {
    // Email já existe — apenas faz login (422 = validation error, 302 = fallback redirect)
    if (res.status === 422 || res.status === 302 || res.status === 301) {
      return cy.loginAPI(usuario.email, usuario.senha)
    }
    // Rate limit atingido — aguarda 65s e tenta novamente (uma vez)
    if (res.status === 429) {
      cy.log('Rate limit atingido no register — aguardando 65s...')
      cy.wait(65000)
      return cy.criarContaAPI(usuario)
    }
    expect(res.status, `criarContaAPI(${usuario.email}) → HTTP ${res.status}: ${JSON.stringify(res.body).slice(0, 400)}`).to.be.oneOf([200, 201])
    const token = res.body.token ?? res.body.access_token
    expect(token, `criarContaAPI(${usuario.email}) → sem token no body: ${JSON.stringify(res.body).slice(0, 400)}`).to.be.a('string')
    return cy.wrap(token as string)
  })
})

// Login via API, retorna o token
Cypress.Commands.add('loginAPI', (email: string, senha: string) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password: senha },
    failOnStatusCode: false,
  }).then((res) => {
    expect(res.status, `loginAPI(${email}) → HTTP ${res.status}: ${JSON.stringify(res.body).slice(0, 300)}`).to.eq(200)
    const token = res.body.token ?? res.body.access_token
    expect(token, `loginAPI(${email}) → sem token no body: ${JSON.stringify(res.body).slice(0, 300)}`).to.be.a('string')
    return cy.wrap(token as string)
  })
})

// Login pela interface (UI), aguarda redirect para /upload
Cypress.Commands.add('loginUI', (email: string, senha: string) => {
  cy.visit('/login')
  cy.get('input[name="email"]').clear().type(email)
  cy.get('input[name="password"]').clear().type(senha)
  cy.get('button[type="submit"]').click()
  cy.url({ timeout: 15000 }).should('include', '/upload')
})

// Lê o token do localStorage após login pela UI
Cypress.Commands.add('getToken', () => {
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('token')
    expect(token, 'token no localStorage').to.be.a('string')
    return cy.wrap(token as string)
  })
})
