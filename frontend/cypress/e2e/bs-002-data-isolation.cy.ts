/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

const AI = () => Cypress.env('aiUrl') as string

describe('BS-002 · Isolamento de Dados por Usuário', () => {
  const usuarioA = gerarUsuario('bs002a')
  const usuarioB = gerarUsuario('bs002b')

  before(() => {
    // Cria duas contas independentes
    cy.criarContaAPI(usuarioA).then((t) => Cypress.env('tokenA', t))
    cy.criarContaAPI(usuarioB).then((t) => Cypress.env('tokenB', t))
  })

  it('TC-06 · Lista retorna apenas os documentos do próprio usuário', () => {
    const tokenA = Cypress.env('tokenA') as string
    const tokenB = Cypress.env('tokenB') as string

    cy.request({
      method: 'GET',
      url: `${AI()}/documents/`,
      headers: { Authorization: `Bearer ${tokenA}` },
    }).then((resA) => {
      expect(resA.status).to.eq(200)
      const idsA = resA.body.map((d: any) => d.id)

      cy.request({
        method: 'GET',
        url: `${AI()}/documents/`,
        headers: { Authorization: `Bearer ${tokenB}` },
      }).then((resB) => {
        expect(resB.status).to.eq(200)
        const idsB = resB.body.map((d: any) => d.id)

        // Os IDs das listas não devem se cruzar
        const intersecao = idsA.filter((id: number) => idsB.includes(id))
        expect(intersecao, 'documentos não devem ser compartilhados entre usuários').to.have.length(0)
      })
    })
  })

  it('TC-07 · Acesso a /status de doc alheio → 404 (não 403)', () => {
    const tokenA = Cypress.env('tokenA') as string
    const tokenB = Cypress.env('tokenB') as string

    // Pega um doc do Usuário A (se existir)
    cy.request({
      method: 'GET',
      url: `${AI()}/documents/`,
      headers: { Authorization: `Bearer ${tokenA}` },
    }).then((res) => {
      if (res.body.length === 0) {
        cy.log('Usuário A sem documentos — pulando verificação de ownership de status')
        return
      }
      const docId = res.body[0].id

      cy.request({
        method: 'GET',
        url: `${AI()}/documents/${docId}/status`,
        headers: { Authorization: `Bearer ${tokenB}` },
        failOnStatusCode: false,
      }).then((resB) => {
        expect(resB.status).to.eq(404)
        // Não deve revelar que o doc existe com 403
        expect(resB.status).not.to.eq(403)
      })
    })
  })

  it('TC-08 · Geração em doc alheio → 403', () => {
    const tokenA = Cypress.env('tokenA') as string
    const tokenB = Cypress.env('tokenB') as string

    cy.request({
      method: 'GET',
      url: `${AI()}/documents/`,
      headers: { Authorization: `Bearer ${tokenA}` },
    }).then((res) => {
      if (res.body.length === 0) {
        cy.log('Usuário A sem documentos — pulando teste de geração')
        return
      }
      const docId = res.body[0].id

      cy.request({
        method: 'POST',
        url: `${AI()}/documents/${docId}/generate`,
        headers: {
          Authorization: `Bearer ${tokenB}`,
          'Content-Type': 'application/json',
        },
        body: { document_id: docId, type: 'quiz' },
        failOnStatusCode: false,
      }).then((resB) => {
        expect(resB.status).to.eq(403)
      })
    })
  })

  it('TC-09 · DELETE em doc alheio → 404', () => {
    const tokenA = Cypress.env('tokenA') as string
    const tokenB = Cypress.env('tokenB') as string

    cy.request({
      method: 'GET',
      url: `${AI()}/documents/`,
      headers: { Authorization: `Bearer ${tokenA}` },
    }).then((res) => {
      if (res.body.length === 0) {
        cy.log('Usuário A sem documentos — pulando teste de delete alheio')
        return
      }
      const docId = res.body[0].id

      cy.request({
        method: 'DELETE',
        url: `${AI()}/documents/${docId}`,
        headers: { Authorization: `Bearer ${tokenB}` },
        failOnStatusCode: false,
      }).then((resB) => {
        expect(resB.status).to.eq(404)
      })
    })
  })
})
