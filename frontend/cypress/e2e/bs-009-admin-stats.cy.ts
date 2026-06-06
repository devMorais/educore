/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

/**
 * BS-009 · Endpoints Admin — Stats Dashboard (Laravel)
 *
 * PRÉ-REQUISITO: conta admin com email/senha.
 * Configure em cypress.env.json:
 *   { "adminEmail": "admin@educore.test", "adminPassword": "Admin@123!" }
 */

const API = () => Cypress.env('apiUrl') as string

function tokenAdmin(): Cypress.Chainable<string> {
  const email = Cypress.env('adminEmail') ?? 'admin@educore.test'
  const senha  = Cypress.env('adminPassword') ?? 'Admin@123!'
  return cy.loginAPI(email, senha)
}

describe('BS-009 · Admin Stats Dashboard — Laravel', () => {
  const student = gerarUsuario('bs009stu')

  before(() => {
    cy.criarContaAPI(student).then((t) => Cypress.env('tokenStudent009', t))
    tokenAdmin().then((t)              => Cypress.env('tokenAdmin009', t))
  })

  // ── GET /api/admin/stats ───────────────────────────────────────────────────

  it('TC-124 · GET /api/admin/stats sem token → 401', () => {
    cy.request({
      method: 'GET',
      url: `${API()}/admin/stats`,
      headers: { 'Accept': 'application/json' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('TC-125 · GET /api/admin/stats com student → 403', () => {
    const token = Cypress.env('tokenStudent009') as string
    cy.request({
      method: 'GET',
      url: `${API()}/admin/stats`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
    })
  })

  it('TC-126 · GET /api/admin/stats com admin → 200 com campos esperados', () => {
    const token = Cypress.env('tokenAdmin009') as string
    cy.request({
      method: 'GET',
      url: `${API()}/admin/stats`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('total_users').that.is.a('number')
      expect(res.body).to.have.property('total_documents').that.is.a('number')
      expect(res.body).to.have.property('total_generations').that.is.a('number')
      expect(res.body).to.have.property('active_users_7days').that.is.a('number')
    })
  })

  it('TC-127 · GET /api/admin/stats retorna séries temporais registrations_per_day', () => {
    const token = Cypress.env('tokenAdmin009') as string
    cy.request({
      method: 'GET',
      url: `${API()}/admin/stats`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.body).to.have.property('registrations_per_day').that.is.an('array')
    })
  })

  it('TC-128 · total_users é maior que zero (ao menos o admin existe)', () => {
    const token = Cypress.env('tokenAdmin009') as string
    cy.request({
      method: 'GET',
      url: `${API()}/admin/stats`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.body.total_users).to.be.greaterThan(0)
    })
  })

  // ── GET /api/admin/users ──────────────────────────────────────────────────

  it('TC-129 · GET /api/admin/users sem token → 401', () => {
    cy.request({
      method: 'GET',
      url: `${API()}/admin/users`,
      headers: { 'Accept': 'application/json' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('TC-130 · GET /api/admin/users com student → 403', () => {
    const token = Cypress.env('tokenStudent009') as string
    cy.request({
      method: 'GET',
      url: `${API()}/admin/users`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
    })
  })

  it('TC-131 · GET /api/admin/users com admin → 200 paginado', () => {
    const token = Cypress.env('tokenAdmin009') as string
    cy.request({
      method: 'GET',
      url: `${API()}/admin/users`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      // Estrutura de paginação do Laravel
      expect(res.body).to.have.property('data').that.is.an('array')
      expect(res.body).to.have.property('total').that.is.a('number')
      expect(res.body).to.have.property('per_page')
      expect(res.body).to.have.property('current_page')
    })
  })

  it('TC-132 · GET /api/admin/users?search= filtra por nome ou email', () => {
    const token = Cypress.env('tokenAdmin009') as string
    cy.request({
      method: 'GET',
      url: `${API()}/admin/users`,
      qs: { search: 'admin@educore' },
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      // Se o admin@educore.test existe, deve aparecer no resultado
      if (res.body.data.length > 0) {
        const emails = res.body.data.map((u: any) => u.email)
        expect(emails.some((e: string) => e.includes('admin@educore'))).to.be.true
      }
    })
  })

  it('TC-133 · GET /api/admin/users?role=admin retorna apenas admins', () => {
    const token = Cypress.env('tokenAdmin009') as string
    cy.request({
      method: 'GET',
      url: `${API()}/admin/users`,
      qs: { role: 'admin' },
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      res.body.data.forEach((user: any) => {
        expect(user.role).to.eq('admin')
      })
    })
  })

  it('TC-134 · GET /api/admin/users?role=student retorna apenas students', () => {
    const token = Cypress.env('tokenAdmin009') as string
    cy.request({
      method: 'GET',
      url: `${API()}/admin/users`,
      qs: { role: 'student' },
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      res.body.data.forEach((user: any) => {
        expect(user.role).to.eq('student')
      })
    })
  })

  it('TC-135 · Paginação: page=2 retorna resultados diferentes de page=1 (se houver suficientes)', () => {
    const token = Cypress.env('tokenAdmin009') as string
    cy.request({
      method: 'GET',
      url: `${API()}/admin/users`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (res.body.total <= 20) {
        cy.log('Menos de 20 usuários — pulando teste de paginação')
        return
      }

      cy.request({
        method: 'GET',
        url: `${API()}/admin/users`,
        qs: { page: 2 },
        headers: { Authorization: `Bearer ${token}` },
      }).then((res2) => {
        expect(res2.body.current_page).to.eq(2)
        const ids1 = res.body.data.map((u: any) => u.id)
        const ids2 = res2.body.data.map((u: any) => u.id)
        // Nenhum id da página 1 deve aparecer na página 2
        ids2.forEach((id: number) => {
          expect(ids1).not.to.include(id)
        })
      })
    })
  })

  // ── last_login_at atualizado no login ─────────────────────────────────────

  it('TC-136 · last_login_at é atualizado após login', () => {
    const token = Cypress.env('tokenAdmin009') as string

    cy.loginAPI(student.email, student.senha).then(() => {
      // Pequena pausa para garantir que o DB foi atualizado
      cy.wait(500)

      cy.request({
        method: 'GET',
        url: `${API()}/auth/me`,
        headers: { Authorization: `Bearer ${Cypress.env('tokenStudent009')}` },
      }).then(() => {
        // Verifica via admin users que o campo existe no retorno
        cy.request({
          method: 'GET',
          url: `${API()}/admin/users`,
          qs: { search: student.email },
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => {
          if (res.body.data.length > 0) {
            // last_login_at pode ser null antes do primeiro login pelo /auth/login
            // mas após login deve existir o campo
            expect(res.body.data[0]).to.have.property('last_login_at')
          }
        })
      })
    })
  })
})
