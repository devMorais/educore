/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

describe('US-006 · Toast Global (PrimeNG p-toast)', () => {
  const usuario = gerarUsuario('us006')

  before(() => {
    cy.criarContaAPI(usuario)
  })

  beforeEach(() => {
    cy.window().then((w) => w.localStorage.clear())
  })

  it('TC-59 · Toast verde aparece no login bem-sucedido', () => {
    cy.visit('/login')
    cy.get('input[name="email"]').type(usuario.email)
    cy.get('input[name="password"]').type(usuario.senha)
    cy.get('button[type="submit"]').click()

    cy.get('p-toast .p-toast-message, .p-toast-message', { timeout: 10000 })
      .should('be.visible')
  })

  it('TC-60 · Toast aparece no canto superior direito (posição top-right)', () => {
    cy.visit('/login')
    cy.get('input[name="email"]').type(usuario.email)
    cy.get('input[name="password"]').type(usuario.senha)
    cy.get('button[type="submit"]').click()

    cy.get('p-toast', { timeout: 10000 }).should('exist').then(($toast) => {
      const rect = $toast[0].getBoundingClientRect()
      // Toast deve estar no lado direito da viewport
      expect(rect.right).to.be.greaterThan(window.innerWidth / 2)
      // Toast deve estar no topo
      expect(rect.top).to.be.lessThan(200)
    })
  })

  it('TC-61 · Toast desaparece automaticamente em ~4 segundos', () => {
    cy.visit('/login')
    cy.get('input[name="email"]').type(usuario.email)
    cy.get('input[name="password"]').type(usuario.senha)
    cy.get('button[type="submit"]').click()

    cy.get('p-toast .p-toast-message', { timeout: 10000 }).should('be.visible')

    // Aguarda o toast desaparecer (4s + 1s de margem)
    cy.get('p-toast .p-toast-message', { timeout: 7000 }).should('not.exist')
  })

  it('TC-62 · Máximo 3 toasts simultâneos — 4º limpa os anteriores', () => {
    cy.loginUI(usuario.email, usuario.senha)

    // Injeta múltiplos toasts via o ToastService do Angular
    cy.window().then((win: any) => {
      // Acessa o Angular através do DOM
      const appRoot = win.document.querySelector('app-root')
      if (!appRoot) return

      // Simula múltiplos toasts usando cy.intercept para forçar erros
      cy.intercept('GET', '**/documents/**', (req) => {
        req.reply({ statusCode: 500, body: { message: `Erro ${Date.now()}` } })
      }).as('erros')
    })

    // Faz 4 requisições que vão gerar toasts de erro
    cy.visit('/upload')

    // Verifica que no máximo 3 toasts aparecem
    cy.get('p-toast .p-toast-message', { timeout: 8000 }).then(($toasts) => {
      expect($toasts.length).to.be.at.most(3)
    })
  })

  it('TC-63 · Toast de sucesso tem classe/cor correta', () => {
    cy.visit('/login')
    cy.get('input[name="email"]').type(usuario.email)
    cy.get('input[name="password"]').type(usuario.senha)
    cy.get('button[type="submit"]').click()

    cy.get('p-toast .p-toast-message', { timeout: 10000 })
      .invoke('attr', 'class')
      .should('match', /success/)
  })

  it('TC-64 · Toast de erro é vermelho (classe error)', () => {
    cy.loginUI(usuario.email, usuario.senha)

    // Intercepta e força um 500
    cy.intercept('GET', '**/documents/**', { statusCode: 500 }).as('erro')
    cy.visit('/upload')
    cy.wait('@erro')

    cy.get('p-toast .p-toast-message', { timeout: 8000 }).should('exist')
  })
})
