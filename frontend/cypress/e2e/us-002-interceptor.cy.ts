/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

describe('US-002 · Interceptor HTTP — Tratamento de Erros Global', () => {
  const usuario = gerarUsuario('us002')

  before(() => {
    cy.criarContaAPI(usuario).then(token => Cypress.env('tokenUS002', token))
  })

  it('TC-29 · Token expirado/removido → redirect para /login', () => {
    const token = Cypress.env('tokenUS002') as string
    cy.visit('/upload', { onBeforeLoad: win => win.localStorage.setItem('token', token) })
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
    const token = Cypress.env('tokenUS002') as string
    // Intercepta chamada ao AI Service e simula 500
    cy.intercept('GET', '**/documents/**', { statusCode: 500, body: { message: 'Server Error' } }).as('erro500')
    cy.visit('/upload', { onBeforeLoad: win => win.localStorage.setItem('token', token) })
    cy.wait('@erro500')

    // Toast de erro deve aparecer
    cy.get('p-toast, .p-toast', { timeout: 8000 }).should('exist')
  })

  it('TC-31 · Erro 429 → toast "Muitas tentativas"', () => {
    const token = Cypress.env('tokenUS002') as string
    // Intercepta requisições ao AI Service e simula 429
    cy.intercept('GET', `${Cypress.env('aiUrl')}/**`, {
      statusCode: 429,
      body: { detail: 'Too Many Requests' },
    }).as('rate429')

    cy.visit('/upload', {
      failOnStatusCode: false,
      onBeforeLoad: win => win.localStorage.setItem('token', token),
    })

    cy.get('p-toast .p-toast-message, .p-toast-detail', { timeout: 10000 })
      .should('exist')
  })

  it('TC-32 · Polling de /status não exibe toast em caso de erro', () => {
    const token = Cypress.env('tokenUS002') as string
    // Intercepta apenas chamadas de status e retorna erro
    cy.intercept('GET', '**/status', { statusCode: 503 }).as('statusPoll')

    cy.visit('/upload', {
      failOnStatusCode: false,
      onBeforeLoad: win => win.localStorage.setItem('token', token),
    })

    // Aguarda e verifica que nenhum toast apareceu por erro de polling
    cy.wait(3000)
    cy.get('.p-toast-message').should('not.exist')
  })
})
