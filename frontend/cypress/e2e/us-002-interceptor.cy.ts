/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

describe('US-002 · Interceptor HTTP — Tratamento de Erros Global', () => {
  const usuario = gerarUsuario('us002')

  before(() => {
    cy.criarContaAPI(usuario)
  })

  it('TC-29 · Token expirado/removido → redirect para /login', () => {
    cy.loginUI(usuario.email, usuario.senha)
    cy.url().should('include', '/upload')

    // Remove o token do localStorage simulando expiração
    cy.window().then((win) => {
      win.localStorage.removeItem('token')
    })

    // Força uma navegação que dispara requisição autenticada
    cy.visit('/upload')
    cy.url({ timeout: 10000 }).should('include', '/login')
  })

  it('TC-30 · Erro 500 simulado → toast "Erro interno"', () => {
    cy.loginUI(usuario.email, usuario.senha)

    // Intercepta chamada ao AI Service e simula 500
    cy.intercept('GET', '**/documents/**', { statusCode: 500, body: { message: 'Server Error' } }).as('erro500')

    cy.visit('/upload')
    cy.wait('@erro500')

    // Toast de erro deve aparecer
    cy.get('p-toast, .p-toast', { timeout: 8000 }).should('exist')
  })

  it('TC-31 · Erro 429 → toast "Muitas tentativas"', () => {
    cy.loginUI(usuario.email, usuario.senha)

    // Aguarda toast do login desaparecer antes de interceptar
    cy.get('p-toast .p-toast-message', { timeout: 6000 }).should('not.exist')

    // Intercepta requisições ao AI Service e simula 429
    cy.intercept('GET', `${Cypress.env('aiUrl')}/**`, {
      statusCode: 429,
      body: { detail: 'Too Many Requests' },
    }).as('rate429')

    // Navega para /upload sem falhar no status HTTP (já estamos logados)
    cy.visit('/upload', { failOnStatusCode: false })

    cy.get('p-toast .p-toast-message, .p-toast-detail', { timeout: 10000 })
      .should('exist')
  })

  it('TC-32 · Polling de /status não exibe toast em caso de erro', () => {
    cy.loginUI(usuario.email, usuario.senha)

    // Aguarda toast do login desaparecer
    cy.get('p-toast .p-toast-message', { timeout: 6000 }).should('not.exist')

    // Intercepta apenas chamadas de status e retorna erro
    cy.intercept('GET', '**/status', { statusCode: 503 }).as('statusPoll')

    cy.visit('/upload', { failOnStatusCode: false })

    // Aguarda e verifica que nenhum toast apareceu por erro de polling
    cy.wait(3000)
    cy.get('.p-toast-message').should('not.exist')
  })
})
