/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

/**
 * BS-007 · Expiração de Tokens Sanctum (24h) + Refresh Token
 */

const API = () => Cypress.env('apiUrl') as string

describe('BS-007 · Token Refresh + Expiração 24h', () => {
  const usuario = gerarUsuario('bs007')

  before(() => {
    cy.criarContaAPI(usuario)
  })

  // ── expires_at no register ────────────────────────────────────────────────

  it('TC-105 · POST /auth/register retorna expires_at em ISO8601', () => {
    const novo = gerarUsuario('bs007reg')
    cy.request({
      method: 'POST',
      url: `${API()}/auth/register`,
      body: {
        name: novo.name,
        email: novo.email,
        password: novo.senha,
        password_confirmation: novo.senha,
      },
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201])
      expect(res.body).to.have.property('expires_at')
      // Valida formato ISO8601
      const dt = new Date(res.body.expires_at)
      expect(dt.toString()).not.to.eq('Invalid Date')
    })
  })

  // ── expires_at no login ───────────────────────────────────────────────────

  it('TC-106 · POST /auth/login retorna expires_at em ISO8601', () => {
    cy.request({
      method: 'POST',
      url: `${API()}/auth/login`,
      body: { email: usuario.email, password: usuario.senha },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('expires_at')
      const dt = new Date(res.body.expires_at)
      expect(dt.toString()).not.to.eq('Invalid Date')
    })
  })

  it('TC-107 · expires_at está aproximadamente 24h no futuro', () => {
    cy.request({
      method: 'POST',
      url: `${API()}/auth/login`,
      body: { email: usuario.email, password: usuario.senha },
    }).then((res) => {
      const expiresAt = new Date(res.body.expires_at).getTime()
      const agora     = Date.now()
      const diffHoras = (expiresAt - agora) / 1000 / 3600

      // Entre 23h e 25h (tolerância de ±1h)
      expect(diffHoras).to.be.greaterThan(23)
      expect(diffHoras).to.be.lessThan(25)
    })
  })

  // ── POST /auth/refresh ────────────────────────────────────────────────────

  it('TC-108 · POST /auth/refresh sem token → 401', () => {
    cy.request({
      method: 'POST',
      url: `${API()}/auth/refresh`,
      headers: { 'Accept': 'application/json' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('TC-109 · POST /auth/refresh com token inválido → 401', () => {
    cy.request({
      method: 'POST',
      url: `${API()}/auth/refresh`,
      headers: { Authorization: 'Bearer token_falso_cypress', 'Accept': 'application/json' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('TC-110 · POST /auth/refresh com token válido → novo access_token + expires_at', () => {
    cy.loginAPI(usuario.email, usuario.senha).then((tokenOriginal) => {
      cy.request({
        method: 'POST',
        url: `${API()}/auth/refresh`,
        headers: { Authorization: `Bearer ${tokenOriginal}` },
      }).then((res) => {
        expect(res.status).to.eq(200)
        expect(res.body).to.have.property('access_token').that.is.a('string')
        expect(res.body).to.have.property('expires_at')
        expect(res.body).to.have.property('token_type', 'Bearer')
      })
    })
  })

  it('TC-111 · Novo token do refresh é diferente do token original', () => {
    cy.loginAPI(usuario.email, usuario.senha).then((tokenOriginal) => {
      cy.request({
        method: 'POST',
        url: `${API()}/auth/refresh`,
        headers: { Authorization: `Bearer ${tokenOriginal}` },
      }).then((res) => {
        const novoToken = res.body.access_token
        expect(novoToken).not.to.eq(tokenOriginal)
      })
    })
  })

  it('TC-112 · Novo token do refresh é válido para acessar /auth/me', () => {
    cy.loginAPI(usuario.email, usuario.senha).then((tokenOriginal) => {
      cy.request({
        method: 'POST',
        url: `${API()}/auth/refresh`,
        headers: { Authorization: `Bearer ${tokenOriginal}` },
      }).then((res) => {
        const novoToken = res.body.access_token

        cy.request({
          method: 'GET',
          url: `${API()}/auth/me`,
          headers: { Authorization: `Bearer ${novoToken}` },
        }).then((me) => {
          expect(me.status).to.eq(200)
          expect(me.body.email).to.eq(usuario.email)
        })
      })
    })
  })

  it('TC-113 · Token original é revogado após o refresh', () => {
    cy.loginAPI(usuario.email, usuario.senha).then((tokenOriginal) => {
      cy.request({
        method: 'POST',
        url: `${API()}/auth/refresh`,
        headers: { Authorization: `Bearer ${tokenOriginal}` },
      }).then(() => {
        // Token original não deve mais funcionar
        cy.request({
          method: 'GET',
          url: `${API()}/auth/me`,
          headers: { Authorization: `Bearer ${tokenOriginal}`, 'Accept': 'application/json' },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(401)
        })
      })
    })
  })

  it('TC-114 · refresh retorna expires_at ~24h no futuro', () => {
    cy.loginAPI(usuario.email, usuario.senha).then((token) => {
      cy.request({
        method: 'POST',
        url: `${API()}/auth/refresh`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        const expiresAt = new Date(res.body.expires_at).getTime()
        const diffHoras = (expiresAt - Date.now()) / 1000 / 3600
        expect(diffHoras).to.be.greaterThan(23)
        expect(diffHoras).to.be.lessThan(25)
      })
    })
  })

  // ── Interceptor frontend (comportamento) ─────────────────────────────────

  it('TC-115 · UI: após 401 simulado, interceptor tenta /refresh antes de redirecionar', () => {
    cy.loginUI(usuario.email, usuario.senha)
    cy.url().should('include', '/upload')

    // Salva o token atual
    cy.getToken().then((token) => {
      // Substitui o token por um inválido para simular expiração
      cy.window().then((win) => win.localStorage.setItem('token', 'expirado_simulado'))

      // Intercepta o refresh — retorna 401 para forçar logout
      cy.intercept('POST', `**/auth/refresh`, {
        statusCode: 401,
        body: { message: 'Token expired' },
      }).as('refreshFail')

      cy.visit('/upload')
      cy.wait('@refreshFail')

      // Deve redirecionar para login
      cy.url({ timeout: 8000 }).should('include', '/login')
    })
  })
})
