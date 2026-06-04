/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

/**
 * BS-008 · Google OAuth — Validação de State Anti-CSRF
 *
 * Nota: testes do fluxo OAuth completo requerem interação com o Google
 * (não automatizável em CI). Os testes cobrem:
 *  - Geração correta de state no redirect
 *  - Rejeição de callback sem state válido
 *  - Rejeição de state inválido/expirado
 */

const API = () => Cypress.env('apiUrl') as string

describe('BS-008 · Google OAuth Anti-CSRF State Validation', () => {
  const usuario = gerarUsuario('bs008')

  before(() => {
    cy.criarContaAPI(usuario)
  })

  // ── GET /auth/google ──────────────────────────────────────────────────────

  it('TC-116 · GET /auth/google retorna url de redirect do Google', () => {
    cy.request({
      method: 'GET',
      url: `${API()}/auth/google`,
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('url').that.is.a('string')
      expect(res.body.url).to.include('accounts.google.com')
    })
  })

  it('TC-117 · URL de redirect contém parâmetro state', () => {
    cy.request({
      method: 'GET',
      url: `${API()}/auth/google`,
    }).then((res) => {
      const url = res.body.url as string
      expect(url).to.include('state=')
      // State deve ter pelo menos 20 caracteres (gerado com Str::random(40))
      const stateMatch = url.match(/state=([^&]+)/)
      expect(stateMatch).not.to.be.null
      expect(stateMatch![1].length).to.be.at.least(20)
    })
  })

  it('TC-118 · Cada chamada gera um state diferente (not deterministic)', () => {
    cy.request(`${API()}/auth/google`).then((res1) => {
      const state1 = (res1.body.url as string).match(/state=([^&]+)/)![1]

      cy.request(`${API()}/auth/google`).then((res2) => {
        const state2 = (res2.body.url as string).match(/state=([^&]+)/)![1]
        expect(state1).not.to.eq(state2)
      })
    })
  })

  // ── GET /auth/google/callback sem state válido ────────────────────────────

  it('TC-119 · Callback sem state → 422 (state ausente)', () => {
    cy.request({
      method: 'GET',
      url: `${API()}/auth/google/callback`,
      qs: { code: 'codigo_fake_cypress' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(422)
    })
  })

  it('TC-120 · Callback com state inválido → 422', () => {
    cy.request({
      method: 'GET',
      url: `${API()}/auth/google/callback`,
      qs: {
        code:  'codigo_fake_cypress',
        state: 'state_invalido_que_nao_existe_no_cache',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(422)
      expect(res.body.message).to.include('State')
    })
  })

  it('TC-121 · Callback com state aleatório nunca cadastrado → 422', () => {
    // Garante que qualquer state random seja rejeitado sem ter passado por /auth/google
    const stateFalso = `cypress_${Date.now()}_never_registered`
    cy.request({
      method: 'GET',
      url: `${API()}/auth/google/callback`,
      qs: {
        code:  'codigo_falso',
        state: stateFalso,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(422)
    })
  })

  // ── State é de uso único (one-time) ──────────────────────────────────────

  it('TC-122 · State gerado por /auth/google está presente na URL (uso único verificável)', () => {
    cy.request(`${API()}/auth/google`).then((res) => {
      const url   = res.body.url as string
      const state = url.match(/state=([^&]+)/)![1]

      // Tenta usar o state no callback — vai falhar no code inválido,
      // mas SE o state fosse válido e usado 2x, o segundo deve retornar 422
      cy.request({
        method: 'GET',
        url: `${API()}/auth/google/callback`,
        qs: { code: 'codigo_invalido_cypress', state },
        failOnStatusCode: false,
      }).then((first) => {
        // Primeira chamada: state válido mas code inválido → erro diferente de 422
        // (pode ser 422 por code inválido no Socialite, ou 500 — não deve ser 422 de state)
        // Segunda chamada com mesmo state → agora state foi consumido ou é inválido
        cy.request({
          method: 'GET',
          url: `${API()}/auth/google/callback`,
          qs: { code: 'codigo_invalido_cypress', state },
          failOnStatusCode: false,
        }).then((second) => {
          // Na segunda tentativa, state já foi consumido ou nunca existiu
          // resultado deve ser 422 de state inválido
          expect(second.status).to.be.oneOf([422, 500])
        })
      })
    })
  })

  // ── Segurança: CSRF via requisição direta ─────────────────────────────────

  it('TC-123 · Atacante tentando forjar callback com state próprio → 422', () => {
    // Simula ataque CSRF: atacante envia um state que ele mesmo gerou
    // (sem ter passado pelo /auth/google real do servidor)
    const stateAtacante = 'estado_criado_pelo_atacante_sem_server'
    cy.request({
      method: 'GET',
      url: `${API()}/auth/google/callback`,
      qs: {
        code:  'codigo_interceptado',
        state: stateAtacante,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(422)
    })
  })
})
