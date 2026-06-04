/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

/**
 * BS-006 · Sistema de Roles (admin, professor, student)
 *
 * PRÉ-REQUISITO: conta admin com email/senha deve existir no banco.
 * Configure em cypress.env.json (não commitado):
 *   { "adminEmail": "admin@educore.test", "adminPassword": "Admin@123!" }
 * Ou rode: php artisan db:seed --class=AdminSeeder
 */

const API = () => Cypress.env('apiUrl') as string

function tokenAdmin(): Cypress.Chainable<string> {
  const email = Cypress.env('adminEmail') ?? 'admin@educore.test'
  const senha  = Cypress.env('adminPassword') ?? 'Admin@123!'
  return cy.loginAPI(email, senha)
}

describe('BS-006 · Sistema de Roles', () => {
  const professor = gerarUsuario('bs006pro')
  const student   = gerarUsuario('bs006stu')

  before(() => {
    cy.criarContaAPI(professor).then((t) => Cypress.env('tokenProfessor', t))
    cy.criarContaAPI(student).then((t)   => Cypress.env('tokenStudent', t))
    tokenAdmin().then((t)                => Cypress.env('tokenAdmin', t))
  })

  // ── Role padrão ────────────────────────────────────────────────────────────

  it('TC-92 · Novo usuário recebe role "student" por padrão', () => {
    const token = Cypress.env('tokenStudent') as string
    cy.request({
      method: 'GET',
      url: `${API()}/auth/me`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.role).to.eq('student')
    })
  })

  it('TC-93 · Campo role está presente na resposta de /auth/me', () => {
    const token = Cypress.env('tokenStudent') as string
    cy.request({
      method: 'GET',
      url: `${API()}/auth/me`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.body).to.have.property('role')
      expect(['admin', 'professor', 'student']).to.include(res.body.role)
    })
  })

  it('TC-94 · Campo role está presente na resposta de /auth/verify', () => {
    const token = Cypress.env('tokenStudent') as string
    cy.request({
      method: 'GET',
      url: `${API()}/auth/verify`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('role').that.is.a('string')
    })
  })

  it('TC-95 · Admin tem role "admin" no /auth/me', () => {
    const token = Cypress.env('tokenAdmin') as string
    cy.request({
      method: 'GET',
      url: `${API()}/auth/me`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.body.role).to.eq('admin')
    })
  })

  // ── Proteção de rotas admin ────────────────────────────────────────────────

  it('TC-96 · /api/admin/* sem token → 401', () => {
    cy.request({
      method: 'GET',
      url: `${API()}/admin/stats`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('TC-97 · /api/admin/* com role student → 403', () => {
    const token = Cypress.env('tokenStudent') as string
    cy.request({
      method: 'GET',
      url: `${API()}/admin/stats`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
    })
  })

  it('TC-98 · /api/admin/* com role professor → 403', () => {
    const token = Cypress.env('tokenProfessor') as string
    cy.request({
      method: 'GET',
      url: `${API()}/admin/stats`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
    })
  })

  it('TC-99 · /api/admin/* com role admin → 200', () => {
    const token = Cypress.env('tokenAdmin') as string
    cy.request({
      method: 'GET',
      url: `${API()}/admin/stats`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
    })
  })

  // ── PATCH role via admin ───────────────────────────────────────────────────

  it('TC-100 · Admin pode atualizar role de outro usuário', () => {
    const tokenAdmin = Cypress.env('tokenAdmin') as string

    // Pega o id do usuário student
    cy.request({
      method: 'GET',
      url: `${API()}/auth/me`,
      headers: { Authorization: `Bearer ${Cypress.env('tokenStudent')}` },
    }).then((res) => {
      const userId = res.body.id

      cy.request({
        method: 'PATCH',
        url: `${API()}/admin/users/${userId}/role`,
        headers: { Authorization: `Bearer ${tokenAdmin}` },
        body: { role: 'professor' },
      }).then((patch) => {
        expect(patch.status).to.eq(200)
        expect(patch.body.user.role).to.eq('professor')
      })
    })
  })

  it('TC-101 · PATCH role com valor inválido → 422', () => {
    const tokenAdmin = Cypress.env('tokenAdmin') as string

    cy.request({
      method: 'GET',
      url: `${API()}/auth/me`,
      headers: { Authorization: `Bearer ${Cypress.env('tokenStudent')}` },
    }).then((res) => {
      const userId = res.body.id

      cy.request({
        method: 'PATCH',
        url: `${API()}/admin/users/${userId}/role`,
        headers: { Authorization: `Bearer ${tokenAdmin}` },
        body: { role: 'superusuario_invalido' },
        failOnStatusCode: false,
      }).then((patch) => {
        expect(patch.status).to.eq(422)
      })
    })
  })

  it('TC-102 · Non-admin não pode fazer PATCH de role → 403', () => {
    const tokenStudent = Cypress.env('tokenStudent') as string

    cy.request({
      method: 'PATCH',
      url: `${API()}/admin/users/1/role`,
      headers: { Authorization: `Bearer ${tokenStudent}` },
      body: { role: 'admin' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
    })
  })

  // ── PATCH status (bloquear/desbloquear) ───────────────────────────────────

  it('TC-103 · Admin pode bloquear um usuário (status false)', () => {
    const tokenAdmin = Cypress.env('tokenAdmin') as string

    cy.request({
      method: 'GET',
      url: `${API()}/auth/me`,
      headers: { Authorization: `Bearer ${Cypress.env('tokenProfessor')}` },
    }).then((res) => {
      const userId = res.body.id

      cy.request({
        method: 'PATCH',
        url: `${API()}/admin/users/${userId}/status`,
        headers: { Authorization: `Bearer ${tokenAdmin}` },
        body: { active: false },
      }).then((patch) => {
        expect(patch.status).to.eq(200)
        expect(patch.body.message).to.include('bloqueado')
      })
    })
  })

  it('TC-104 · Admin pode desbloquear um usuário (status true)', () => {
    const tokenAdmin = Cypress.env('tokenAdmin') as string

    cy.request({
      method: 'GET',
      url: `${API()}/auth/me`,
      headers: { Authorization: `Bearer ${Cypress.env('tokenProfessor')}` },
    }).then((res) => {
      const userId = res.body.id

      cy.request({
        method: 'PATCH',
        url: `${API()}/admin/users/${userId}/status`,
        headers: { Authorization: `Bearer ${tokenAdmin}` },
        body: { active: true },
      }).then((patch) => {
        expect(patch.status).to.eq(200)
        expect(patch.body.message).to.include('desbloqueado')
      })
    })
  })
})
