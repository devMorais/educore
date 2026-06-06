/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

const API = () => Cypress.env('apiUrl') as string

describe('BS-004 · Endpoint de Verificação de Token — Laravel', () => {
  const usuario = gerarUsuario('bs004')

  before(() => {
    cy.criarContaAPI(usuario).then((t) => Cypress.env('tokenBS004', t))
  })

  it('TC-14 · Token válido → 200 com campos esperados', () => {
    const token = Cypress.env('tokenBS004') as string
    cy.request({
      method: 'GET',
      url: `${API()}/auth/verify`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('user_id').that.is.a('number')
      expect(res.body).to.have.property('email').that.is.a('string')
      expect(res.body).to.have.property('role').that.is.a('string')
    })
  })

  it('TC-15 · Resposta NÃO contém campos sensíveis', () => {
    const token = Cypress.env('tokenBS004') as string
    cy.request({
      method: 'GET',
      url: `${API()}/auth/verify`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.body).not.to.have.property('password')
      expect(res.body).not.to.have.property('password_hash')
      expect(res.body).not.to.have.property('remember_token')
    })
  })

  it('TC-16 · Sem token → 401', () => {
    cy.request({
      method: 'GET',
      url: `${API()}/auth/verify`,
      headers: { 'Accept': 'application/json' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('TC-17 · Token inválido → 401', () => {
    cy.request({
      method: 'GET',
      url: `${API()}/auth/verify`,
      headers: { Authorization: 'Bearer invalido_cypress_test', 'Accept': 'application/json' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('TC-18 · Campo email retornado é o mesmo do usuário criado', () => {
    const token = Cypress.env('tokenBS004') as string
    cy.request({
      method: 'GET',
      url: `${API()}/auth/verify`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.body.email).to.eq(usuario.email)
    })
  })
})
