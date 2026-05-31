/// <reference types="cypress" />

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface Usuario {
  name: string
  email: string
  senha: string
  token?: string
}

// Gera credenciais únicas por execução (evita conflito entre runs)
export function gerarUsuario(prefixo = 'cy'): Usuario {
  const ts = Date.now()
  return {
    name:  `Cypress ${prefixo} ${ts}`,
    email: `${prefixo}_${ts}@educore-test.com`,
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

// Cria uma conta via API e retorna o token
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
    failOnStatusCode: false,
  }).then((res) => {
    // Se 422, email já existe — tenta logar
    if (res.status === 422) {
      return cy.loginAPI(usuario.email, usuario.senha)
    }
    // Laravel pode retornar 200 ou 201 no register
    expect(res.status).to.be.oneOf([200, 201])
    const token = res.body.token ?? res.body.access_token
    expect(token).to.be.a('string')
    return cy.wrap(token as string)
  })
})

// Login via API, retorna o token
Cypress.Commands.add('loginAPI', (email: string, senha: string) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password: senha },
  }).then((res) => {
    expect(res.status).to.eq(200)
    const token = res.body.token ?? res.body.access_token
    expect(token).to.be.a('string')
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
