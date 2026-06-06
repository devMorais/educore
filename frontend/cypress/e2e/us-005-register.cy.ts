/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

describe('US-005 · Página de Cadastro — Validação e UX', () => {
  beforeEach(() => {
    cy.window().then((w) => w.localStorage.clear())
    cy.visit('/cadastro')
  })

  it('TC-48 · Página carrega com todos os campos', () => {
    cy.get('input[name="name"]').should('be.visible')
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
    cy.get('input[name="passwordConfirmation"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('TC-49 · Nome com 2 chars → erro após blur (não durante digitação)', () => {
    cy.get('input[name="name"]').type('Jo')
    // Sem blur ainda — erro não deve aparecer
    cy.get('.erro-inline').should('not.exist')

    // Blur → erro aparece
    cy.get('input[name="name"]').blur()
    cy.get('.erro-inline', { timeout: 4000 }).should('be.visible')
      .and('contain.text', 'mínimo 3')
  })

  it('TC-50 · Nome com 3+ chars → ícone verde após blur', () => {
    cy.get('input[name="name"]').type('João Silva').blur()
    cy.get('.input-icon.success, .pi-check-circle', { timeout: 4000 }).should('exist')
    cy.get('.erro-inline').should('not.exist')
  })

  it('TC-51 · Email inválido → erro após blur', () => {
    cy.get('input[name="email"]').type('emailsemarroba').blur()
    cy.get('.erro-inline', { timeout: 4000 }).should('be.visible')
      .and('contain.text', 'válido')
  })

  it('TC-52 · Email válido → ícone verde após blur', () => {
    cy.get('input[name="email"]').type('teste@email.com').blur()
    cy.get('.input-icon.success, .pi-check-circle', { timeout: 4000 }).should('exist')
  })

  it('TC-53 · Indicador de força da senha — 3 níveis', () => {
    // Fraca (menos de 8 chars)
    cy.get('input[name="password"]').type('abc')
    cy.get('.forca-senha', { timeout: 4000 }).should('exist')
    cy.get('.forca-texto.fraca').should('contain.text', 'Fraca')

    // Média
    cy.get('input[name="password"]').clear().type('abcd1234')
    cy.get('.forca-texto.media, .forca-texto.forte').should('exist')

    // Forte
    cy.get('input[name="password"]').clear().type('Abc@12345')
    cy.get('.forca-texto.forte').should('contain.text', 'Forte')
  })

  it('TC-54 · Confirmação mismatch → erro em tempo real', () => {
    cy.get('input[name="password"]').type('Abc@12345')
    cy.get('input[name="passwordConfirmation"]').type('Abc@12346')
    cy.get('.erro-inline', { timeout: 4000 }).should('contain.text', 'não coincidem')
  })

  it('TC-55 · Confirmação igual → mensagem verde "Senhas coincidem"', () => {
    cy.get('input[name="password"]').type('Abc@12345')
    cy.get('input[name="passwordConfirmation"]').type('Abc@12345')
    cy.get('.sucesso-inline', { timeout: 4000 }).should('contain.text', 'coincidem')
  })

  it('TC-56 · Botão desabilitado com formulário inválido', () => {
    // Sem preencher nada, o botão deve estar desabilitado
    cy.get('button[type="submit"]').should('be.disabled')
  })

  it('TC-57 · Cadastro completo → toast de boas-vindas + redirect /upload', () => {
    const ts = Date.now()
    const usuario = { name: 'Cypress US005', email: `cypress_us005reg_${ts}@educore-test.com`, senha: 'CypressTest@123' }

    cy.get('input[name="name"]').type(usuario.name)
    cy.get('input[name="email"]').type(usuario.email).blur()
    cy.get('input[name="password"]').type(usuario.senha)
    cy.get('input[name="passwordConfirmation"]').type(usuario.senha)

    cy.get('button[type="submit"]').should('not.be.disabled').click()

    // Toast de boas-vindas
    cy.get('p-toast, .p-toast', { timeout: 12000 }).should('exist')

    // Redirect para /upload
    cy.url({ timeout: 12000 }).should('include', '/upload')
  })

  it('TC-58 · Email duplicado → erro inline no campo email', () => {
    const usuario = gerarUsuario('us005dup')

    // Cria o usuário primeiro
    cy.criarContaAPI(usuario).then(() => {
      cy.visit('/cadastro')

      cy.get('input[name="name"]').type(usuario.name)
      cy.get('input[name="email"]').type(usuario.email).blur()
      cy.get('input[name="password"]').type(usuario.senha)
      cy.get('input[name="passwordConfirmation"]').type(usuario.senha)
      cy.get('button[type="submit"]').click()

      // Erro de email já em uso deve aparecer inline
      cy.get('.erro-inline', { timeout: 10000 }).should('be.visible')
    })
  })
})
