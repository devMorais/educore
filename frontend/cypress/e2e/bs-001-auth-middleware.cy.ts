/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

const AI = () => Cypress.env('aiUrl') as string

describe('BS-001 · Middleware de Autenticação JWT no AI Service', () => {
  const usuario = gerarUsuario('bs001')

  before(() => {
    // Cria conta e guarda token para os testes com token válido
    cy.criarContaAPI(usuario).then((token) => {
      Cypress.env('bs001_token', token)
    })
  })

  it('TC-01 · /health é público — sem token retorna 200', () => {
    cy.request(`${AI()}/health`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.status).to.eq('ok')
      expect(res.body.service).to.include('EduCore')
    })
  })

  it('TC-02 · Sem token → 401 em endpoint protegido', () => {
    cy.request({
      method: 'GET',
      url: `${AI()}/documents/`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('TC-03 · Token inválido → 401', () => {
    cy.request({
      method: 'GET',
      url: `${AI()}/documents/`,
      headers: { Authorization: 'Bearer token_invalido_cypress' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('TC-04 · Token válido → 200 com lista de documentos', () => {
    const token = Cypress.env('bs001_token') as string
    cy.request({
      method: 'GET',
      url: `${AI()}/documents/`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.be.an('array')
    })
  })

  it('TC-05 · Todos os endpoints protegidos exigem token', () => {
    const endpoints = [
      { method: 'GET',  path: '/documents/' },
      { method: 'POST', path: '/documents/upload' },
      { method: 'GET',  path: '/documents/999/status' },
      { method: 'POST', path: '/documents/999/generate' },
      { method: 'DELETE', path: '/documents/999' },
    ]
    endpoints.forEach(({ method, path }) => {
      cy.request({
        method,
        url: `${AI()}${path}`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status, `${method} ${path} sem token`).to.eq(401)
      })
    })
  })
})
