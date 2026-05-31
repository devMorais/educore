/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

describe('US-003 · Página de Login — UX e Feedback Visual', () => {
  const usuario = gerarUsuario('us003')

  before(() => {
    cy.criarContaAPI(usuario)
  })

  beforeEach(() => {
    // Garante sessão limpa antes de cada teste
    cy.window().then((w) => w.localStorage.clear())
    cy.visit('/login')
  })

  it('TC-33 · Página de login carrega com campos corretos', () => {
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
    cy.get('a[routerLink="/esqueci-senha"], a[href*="esqueci"]').should('exist')
  })

  it('TC-34 · Submeter campos vazios não envia requisição', () => {
    cy.intercept('POST', '**/auth/login').as('loginCall')
    cy.get('button[type="submit"]').click()
    cy.get('@loginCall.all').should('have.length', 0)
  })

  it('TC-35 · Credenciais erradas → alerta vermelho inline', () => {
    cy.get('input[name="email"]').type(usuario.email)
    cy.get('input[name="password"]').type('senha_errada_123')
    cy.get('button[type="submit"]').click()

    // Alerta vermelho inline (não toast)
    cy.get('.alert-error', { timeout: 10000 })
      .should('be.visible')
      .and('contain.text', 'incorretos')
  })

  it('TC-36 · Spinner aparece durante o loading', () => {
    cy.intercept('POST', '**/auth/login', (req) => {
      req.on('response', (res) => { res.setDelay(1500) })
    }).as('loginLento')

    cy.get('input[name="email"]').type(usuario.email)
    cy.get('input[name="password"]').type(usuario.senha)
    cy.get('button[type="submit"]').click()

    // Spinner deve aparecer
    cy.get('.spinner, button[disabled]', { timeout: 3000 }).should('exist')
    cy.wait('@loginLento')
  })

  it('TC-37 · Toggle mostrar/ocultar senha funciona', () => {
    cy.get('input[name="password"]').type('minha_senha')
    cy.get('input[name="password"]').should('have.attr', 'type', 'password')

    // Clica no botão de toggle (ícone de olho)
    cy.get('.toggle-senha, button[aria-label*="senha"], button[aria-label*="Mostrar"]').click()
    cy.get('input[name="password"]').should('have.attr', 'type', 'text')

    // Clica novamente para ocultar
    cy.get('.toggle-senha, button[aria-label*="Ocultar"]').click()
    cy.get('input[name="password"]').should('have.attr', 'type', 'password')
  })

  it('TC-38 · Login correto → toast verde + redirect para /upload', () => {
    cy.get('input[name="email"]').type(usuario.email)
    cy.get('input[name="password"]').type(usuario.senha)
    cy.get('button[type="submit"]').click()

    // Toast de boas-vindas
    cy.get('p-toast, .p-toast', { timeout: 12000 }).should('exist')

    // Redirect para /upload
    cy.url({ timeout: 12000 }).should('include', '/upload')
  })

  it('TC-39 · Link "Esqueceu a senha?" navega para /esqueci-senha', () => {
    cy.get('a[routerLink="/esqueci-senha"], a[href*="esqueci-senha"]').click()
    cy.url({ timeout: 6000 }).should('include', 'esqueci-senha')
  })
})
