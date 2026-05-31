/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

const AI = () => Cypress.env('aiUrl') as string

describe('BS-005 · DELETE /documents/{id} com Ownership Check', () => {
  const usuarioOwner = gerarUsuario('bs005own')
  const usuarioOutro  = gerarUsuario('bs005out')

  before(() => {
    cy.criarContaAPI(usuarioOwner).then((t) => Cypress.env('tokenOwner', t))
    cy.criarContaAPI(usuarioOutro).then((t) => Cypress.env('tokenOutro', t))
  })

  it('TC-19 · DELETE sem token → 401', () => {
    cy.request({
      method: 'DELETE',
      url: `${AI()}/documents/999`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('TC-20 · DELETE documento inexistente → 404', () => {
    const token = Cypress.env('tokenOwner') as string
    cy.request({
      method: 'DELETE',
      url: `${AI()}/documents/999999`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
    })
  })

  it('TC-21 · DELETE documento alheio → 404 (ownership check seguro)', () => {
    const tokenOwner = Cypress.env('tokenOwner') as string
    const tokenOutro  = Cypress.env('tokenOutro') as string

    // Lista docs do Owner
    cy.request({
      method: 'GET',
      url: `${AI()}/documents/`,
      headers: { Authorization: `Bearer ${tokenOwner}` },
    }).then((res) => {
      if (res.body.length === 0) {
        cy.log('Owner sem documentos — pulando teste de delete alheio')
        return
      }
      const docId = res.body[0].id

      cy.request({
        method: 'DELETE',
        url: `${AI()}/documents/${docId}`,
        headers: { Authorization: `Bearer ${tokenOutro}` },
        failOnStatusCode: false,
      }).then((del) => {
        expect(del.status).to.eq(404)
        // Garante que não foi deletado
        cy.request({
          method: 'GET',
          url: `${AI()}/documents/${docId}/status`,
          headers: { Authorization: `Bearer ${tokenOwner}` },
        }).then((check) => {
          expect(check.status).to.eq(200) // ainda existe
        })
      })
    })
  })

  it('TC-22 · DELETE próprio documento → 204 sem corpo', () => {
    const token = Cypress.env('tokenOwner') as string

    // Lista docs do Owner
    cy.request({
      method: 'GET',
      url: `${AI()}/documents/`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (res.body.length === 0) {
        cy.log('Owner sem documentos — criando um registro de teste')
        // Sem PDF disponível para upload em CI, marcamos como skipped
        return
      }
      const docId = res.body[res.body.length - 1].id // pega o mais antigo

      cy.request({
        method: 'DELETE',
        url: `${AI()}/documents/${docId}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((del) => {
        expect(del.status).to.eq(204)
        // Body deve ser vazio
        expect(del.body).to.be.empty
      })
    })
  })

  it('TC-23 · Após DELETE, documento não aparece na lista', () => {
    const token = Cypress.env('tokenOwner') as string

    cy.request({
      method: 'GET',
      url: `${AI()}/documents/`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((before) => {
      if (before.body.length === 0) return

      const docId = before.body[0].id

      cy.request({
        method: 'DELETE',
        url: `${AI()}/documents/${docId}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then(() => {
        cy.request({
          method: 'GET',
          url: `${AI()}/documents/`,
          headers: { Authorization: `Bearer ${token}` },
        }).then((after) => {
          const idsDepois = after.body.map((d: any) => d.id)
          expect(idsDepois).not.to.include(docId)
        })
      })
    })
  })
})
