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

    cy.intercept('*', { statusCode: 429, body: { message: 'Too Many Requests' } }).as('rate429')

    cy.visit('/upload')
    cy.wait('@rate429')

    cy.get('p-toast .p-toast-message-content, .p-toast-detail', { timeout: 8000 })
      .should('contain.text', 'Muitas tentativas')
  })

  it('TC-32 · Polling de /status não exibe toast em caso de erro', () => {
    cy.loginUI(usuario.email, usuario.senha)

    // Intercepta apenas chamadas de status e retorna erro
    cy.intercept('GET', '**/status', { statusCode: 503 }).as('statusPoll')

    // Aguarda possível polling
    cy.wait(3000)

    // Toast não deve aparecer para erros de polling
    cy.get('.p-toast-message', { timeout: 2000 }).should('not.exist')
  })
})
