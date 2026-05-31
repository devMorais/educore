/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

describe('US-001 · Guard de Role para Área Admin', () => {
  const usuario = gerarUsuario('us001')

  before(() => {
    cy.criarContaAPI(usuario)
  })

  beforeEach(() => {
    cy.loginUI(usuario.email, usuario.senha)
  })

  it('TC-24 · Usuário comum em /admin → redirect para /login', () => {
    cy.visit('/admin')
    cy.url({ timeout: 8000 }).should('include', '/login')
    cy.url().should('not.include', '/admin')
  })

  it('TC-25 · Subrota /admin/usuarios bloqueada para usuário comum', () => {
    cy.visit('/admin/usuarios')
    cy.url({ timeout: 8000 }).should('include', '/login')
  })

  it('TC-26 · Usuário logado em /login → redirect para /upload (não para /admin)', () => {
    // Usuário comum já logado tentando acessar /login
    cy.visit('/login')
    cy.url({ timeout: 8000 }).should('include', '/upload')
  })

  it('TC-27 · Usuário deslogado em /admin → redirect para /login', () => {
    // Limpa sessão
    cy.window().then((win) => win.localStorage.clear())
    cy.visit('/admin')
    cy.url({ timeout: 8000 }).should('include', '/login')
  })

  it('TC-28 · Rota /upload acessível para usuário autenticado', () => {
    cy.visit('/upload')
    cy.url({ timeout: 8000 }).should('include', '/upload')
    cy.url().should('not.include', '/login')
  })
})
