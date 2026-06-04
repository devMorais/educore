/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

/**
 * BS-010 · Admin Endpoints no AI Service — Stats e Gestão
 *
 * PRÉ-REQUISITO: conta admin com email/senha.
 * Configure em cypress.env.json:
 *   { "adminEmail": "admin@educore.test", "adminPassword": "Admin@123!" }
 */

const AI  = () => Cypress.env('aiUrl')  as string
const API = () => Cypress.env('apiUrl') as string

function tokenAdmin(): Cypress.Chainable<string> {
  const email = Cypress.env('adminEmail') ?? 'admin@educore.test'
  const senha  = Cypress.env('adminPassword') ?? 'Admin@123!'
  return cy.loginAPI(email, senha)
}

describe('BS-010 · Admin Endpoints no AI Service', () => {
  const student = gerarUsuario('bs010stu')

  before(() => {
    cy.criarContaAPI(student).then((t) => Cypress.env('tokenStudent010', t))
    tokenAdmin().then((t)              => Cypress.env('tokenAdmin010', t))
  })

  // ── GET /admin/stats ──────────────────────────────────────────────────────

  it('TC-137 · GET /admin/stats sem token → 401', () => {
    cy.request({
      method: 'GET',
      url: `${AI()}/admin/stats`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('TC-138 · GET /admin/stats com token não-admin (student) → 403', () => {
    const token = Cypress.env('tokenStudent010') as string
    cy.request({
      method: 'GET',
      url: `${AI()}/admin/stats`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
    })
  })

  it('TC-139 · GET /admin/stats com admin → 200 com campos esperados', () => {
    const token = Cypress.env('tokenAdmin010') as string
    cy.request({
      method: 'GET',
      url: `${AI()}/admin/stats`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('total_documents').that.is.a('number')
      expect(res.body).to.have.property('total_generations').that.is.a('number')
      expect(res.body).to.have.property('by_status').that.is.an('array')
      expect(res.body).to.have.property('by_type').that.is.an('array')
    })
  })

  it('TC-140 · GET /admin/stats retorna séries temporais uploads_per_day', () => {
    const token = Cypress.env('tokenAdmin010') as string
    cy.request({
      method: 'GET',
      url: `${AI()}/admin/stats`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.body).to.have.property('uploads_per_day').that.is.an('array')
      expect(res.body).to.have.property('generations_per_day').that.is.an('array')
    })
  })

  it('TC-141 · GET /admin/stats retorna top_document_types e avg_processing_time', () => {
    const token = Cypress.env('tokenAdmin010') as string
    cy.request({
      method: 'GET',
      url: `${AI()}/admin/stats`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.body).to.have.property('top_document_types').that.is.an('array')
      expect(res.body).to.have.property('avg_processing_time').that.is.a('number')
    })
  })

  it('TC-142 · by_status contém objetos com campos status e count', () => {
    const token = Cypress.env('tokenAdmin010') as string
    cy.request({
      method: 'GET',
      url: `${AI()}/admin/stats`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      res.body.by_status.forEach((item: any) => {
        expect(item).to.have.property('status').that.is.a('string')
        expect(item).to.have.property('count').that.is.a('number')
      })
    })
  })

  it('TC-143 · uploads_per_day contém objetos com date e count', () => {
    const token = Cypress.env('tokenAdmin010') as string
    cy.request({
      method: 'GET',
      url: `${AI()}/admin/stats`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (res.body.uploads_per_day.length > 0) {
        const item = res.body.uploads_per_day[0]
        expect(item).to.have.property('date')
        expect(item).to.have.property('count').that.is.a('number')
      }
    })
  })

  // ── GET /admin/documents ──────────────────────────────────────────────────

  it('TC-144 · GET /admin/documents sem token → 401', () => {
    cy.request({
      method: 'GET',
      url: `${AI()}/admin/documents`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('TC-145 · GET /admin/documents com student → 403', () => {
    const token = Cypress.env('tokenStudent010') as string
    cy.request({
      method: 'GET',
      url: `${AI()}/admin/documents`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
    })
  })

  it('TC-146 · GET /admin/documents com admin → 200 paginado', () => {
    const token = Cypress.env('tokenAdmin010') as string
    cy.request({
      method: 'GET',
      url: `${AI()}/admin/documents`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('data').that.is.an('array')
      expect(res.body).to.have.property('total').that.is.a('number')
      expect(res.body).to.have.property('page')
      expect(res.body).to.have.property('per_page')
      expect(res.body).to.have.property('last_page')
    })
  })

  it('TC-147 · GET /admin/documents retorna documentos de TODOS os usuários', () => {
    const tokenAdmin   = Cypress.env('tokenAdmin010') as string
    const tokenStudent = Cypress.env('tokenStudent010') as string

    // Pega documentos do student
    cy.request({
      method: 'GET',
      url: `${AI()}/documents/`,
      headers: { Authorization: `Bearer ${tokenStudent}` },
    }).then((studentDocs) => {
      // Pega todos os documentos via admin
      cy.request({
        method: 'GET',
        url: `${AI()}/admin/documents`,
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      }).then((adminDocs) => {
        // Admin vê >= quantos documentos o student vê
        expect(adminDocs.body.total).to.be.at.least(studentDocs.body.length)
      })
    })
  })

  it('TC-148 · GET /admin/documents cada item tem campos id, filename, user_id, status', () => {
    const token = Cypress.env('tokenAdmin010') as string
    cy.request({
      method: 'GET',
      url: `${AI()}/admin/documents`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (res.body.data.length > 0) {
        const doc = res.body.data[0]
        expect(doc).to.have.property('id')
        expect(doc).to.have.property('filename')
        expect(doc).to.have.property('user_id')
        expect(doc).to.have.property('status')
      }
    })
  })

  it('TC-149 · GET /admin/documents?page=1 retorna primeira página', () => {
    const token = Cypress.env('tokenAdmin010') as string
    cy.request({
      method: 'GET',
      url: `${AI()}/admin/documents`,
      qs: { page: 1 },
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.body.page).to.eq(1)
    })
  })

  it('TC-150 · GET /admin/documents respeita per_page', () => {
    const token = Cypress.env('tokenAdmin010') as string
    cy.request({
      method: 'GET',
      url: `${AI()}/admin/documents`,
      qs: { per_page: 5 },
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.body.data.length).to.be.at.most(5)
    })
  })

  // ── Consistência entre Laravel e AI Service ───────────────────────────────

  it('TC-151 · Stats do AI Service são acessíveis pelo token Laravel (mesmo token)', () => {
    // O mesmo Bearer token do Laravel funciona no AI Service
    const token = Cypress.env('tokenAdmin010') as string

    cy.request({
      method: 'GET',
      url: `${AI()}/admin/stats`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((aiRes) => {
      cy.request({
        method: 'GET',
        url: `${API()}/admin/stats`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((laravelRes) => {
        // Ambos devem retornar 200 com o mesmo token
        expect(aiRes.status).to.eq(200)
        expect(laravelRes.status).to.eq(200)
      })
    })
  })

  it('TC-152 · total_documents no AI Service == total_documents retornado pelo Laravel', () => {
    const token = Cypress.env('tokenAdmin010') as string

    cy.request({
      method: 'GET',
      url: `${AI()}/admin/stats`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((aiRes) => {
      cy.request({
        method: 'GET',
        url: `${API()}/admin/stats`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((laravelRes) => {
        // O Laravel busca o total_documents do AI Service — devem ser iguais
        expect(laravelRes.body.total_documents).to.eq(aiRes.body.total_documents)
      })
    })
  })
})
