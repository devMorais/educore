/// <reference types="cypress" />

describe('US-004 · Página de Recuperação de Senha', () => {
  beforeEach(() => {
    cy.window().then((w) => w.localStorage.clear())
    cy.visit('/esqueci-senha')
  })

  it('TC-40 · Página carrega com campos corretos', () => {
    cy.get('input[name="email"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
    cy.get('a[routerLink="/login"], a[href*="login"]').should('be.visible')
  })

  it('TC-41 · Submeter sem email → erro inline, sem requisição', () => {
    cy.intercept('POST', '**/auth/forgot-password').as('forgotCall')
    cy.get('button[type="submit"]').click()
    cy.get('.erro-inline, .field-has-error + span, [class*="erro"]', { timeout: 4000 })
      .should('exist')
    cy.get('@forgotCall.all').should('have.length', 0)
  })

  it('TC-42 · Email com formato inválido → erro no blur', () => {
    cy.get('input[name="email"]').type('emailsemarroba').blur()
    cy.get('.erro-inline, [class*="erro"]', { timeout: 4000 })
      .should('be.visible')
      .and('contain.text', 'válido')
  })

  it('TC-43 · Email válido → mensagem genérica (independente de existir)', () => {
    cy.intercept('POST', '**/auth/forgot-password', {
      statusCode: 200,
      body: { message: 'ok' },
    }).as('forgotOk')

    cy.get('input[name="email"]').type('qualquer@teste.com')
    cy.get('button[type="submit"]').click()
    cy.wait('@forgotOk')

    // Mensagem genérica deve aparecer
    cy.get('.alert-success', { timeout: 8000 })
      .should('be.visible')
      .and('contain.text', 'cadastrado')
  })

  it('TC-44 · Erro 404 → mesma mensagem genérica (segurança)', () => {
    cy.intercept('POST', '**/auth/forgot-password', {
      statusCode: 404,
      body: { message: 'Not Found' },
    }).as('forgot404')

    cy.get('input[name="email"]').type('naocadastrado@teste.com')
    cy.get('button[type="submit"]').click()
    cy.wait('@forgot404')

    // Deve mostrar a mesma mensagem genérica, não um erro
    cy.get('.alert-success', { timeout: 8000 }).should('be.visible')
    cy.get('.alert-error').should('not.exist')
  })

  it('TC-45 · Countdown animado aparece após envio', () => {
    cy.intercept('POST', '**/auth/forgot-password', { statusCode: 200, body: {} }).as('forgot')
    cy.get('input[name="email"]').type('qualquer@teste.com')
    cy.get('button[type="submit"]').click()
    cy.wait('@forgot')

    // Barra de countdown deve existir
    cy.get('.countdown-barra, .countdown-progresso, [class*="countdown"]', { timeout: 6000 })
      .should('exist')
  })

  it('TC-46 · Redirect automático para /login após 5s', () => {
    cy.intercept('POST', '**/auth/forgot-password', { statusCode: 200, body: {} }).as('forgot')
    cy.get('input[name="email"]').type('qualquer@teste.com')
    cy.get('button[type="submit"]').click()
    cy.wait('@forgot')

    // Aguarda redirect (5s + margem)
    cy.url({ timeout: 8000 }).should('include', '/login')
  })

  it('TC-47 · Link "Voltar ao login" visível antes e depois do envio', () => {
    // Antes do envio
    cy.get('a[routerLink="/login"], a[href*="login"]').should('be.visible')

    cy.intercept('POST', '**/auth/forgot-password', { statusCode: 200, body: {} })
    cy.get('input[name="email"]').type('qualquer@teste.com')
    cy.get('button[type="submit"]').click()

    // Depois do envio também deve estar visível
    cy.get('a[routerLink="/login"], a[href*="login"]', { timeout: 6000 }).should('be.visible')
  })
})
