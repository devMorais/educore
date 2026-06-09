/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

// Smoke test de ponta a ponta contra o ambiente de HOMOLOGAÇÃO.
//
// Dois blocos:
//   1) Infra  → checagens rápidas e baratas (rodam sempre).
//   2) Pipeline real → upload de PDF real + processamento + geração de conteúdo
//      pela IA (Gemini + cadeia de fallback). É LENTO e consome quota de IA,
//      então só roda quando passado o flag de ambiente REAL_E2E.
//
// Rodar tudo (inclui o pipeline real):
//   npx cypress run --spec cypress/e2e/smoke-e2e-homolog.cy.ts --env REAL_E2E=1
// Rodar só a infra:
//   npx cypress run --spec cypress/e2e/smoke-e2e-homolog.cy.ts

const AI  = () => Cypress.env('aiUrl') as string
const API = () => Cypress.env('apiUrl') as string

describe('Smoke E2E · Infra de homologação', () => {
  it('AI Service (Railway) responde em /health', () => {
    cy.request(`${AI()}/health`).its('status').should('eq', 200)
  })

  it('Laravel API responde em /api/health', () => {
    cy.request(`${API()}/health`).its('status').should('eq', 200)
  })

  it('Frontend carrega a home (Angular servindo)', () => {
    cy.visit('/')
    cy.get('body').should('be.visible')
    cy.title().should('not.be.empty')
  })

  it('Endpoints admin exigem autenticação (401)', () => {
    ;['stats', 'activity', 'users'].forEach((ep) => {
      cy.request({
        url: `${API()}/admin/${ep}`,
        headers: { Accept: 'application/json' },
        failOnStatusCode: false,
      }).its('status').should('eq', 401)
    })
  })
})

// ── Pipeline real (opt-in via REAL_E2E) ──────────────────────────────────────
const rodarReal = Boolean(Cypress.env('REAL_E2E'))

;(rodarReal ? describe : describe.skip)(
  'Smoke E2E · Pipeline real (upload → processamento → geração)',
  () => {
    const usuario = gerarUsuario('smoke')
    let token: string

    before(() => {
      cy.criarContaAPI(usuario).then((t) => {
        token = t
      })
    })

    it('Upload de PDF real → processa → gera Quiz com conteúdo válido', () => {
      // Autentica e abre a tela de upload
      cy.visit('/upload', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', token)
        },
      })
      cy.url().should('include', '/upload')

      // 1) Envia um PDF REAL (fixture com texto educacional)
      cy.get('input[type="file"]').selectFile(
        'cypress/fixtures/material-educacional.pdf',
        { force: true },
      )
      cy.get('.up-btn-primary').should('contain.text', 'Enviar').click()

      // 2) Aguarda o processamento concluir (LlamaParse + embeddings + Gemini).
      //    Quando concluído, a grade de ações aparece e os botões ficam habilitados.
      cy.get('.up-grid .up-action', { timeout: 180000 }).should('exist')
      cy.get('.up-action', { timeout: 180000 }).first().should('not.be.disabled')

      // 3) Gera o Quiz de verdade (Gemini como primário; se cair, fallback assume)
      cy.get('.up-action').contains('Quiz').click()

      // 4) Navega para o resultado e valida que veio conteúdo real
      cy.url({ timeout: 90000 }).should('include', '/resultado/quiz')

      cy.window().its('localStorage').then((ls) => {
        const bruto = ls.getItem('educore_result')
        expect(bruto, 'educore_result no localStorage').to.be.a('string')
        const dados = JSON.parse(bruto as string)
        expect(dados.type, 'tipo do resultado').to.eq('quiz')
        // O quiz real precisa conter ao menos uma questão
        expect(JSON.stringify(dados)).to.contain('question')
      })

      // A tela de quiz deve renderizar (pergunta visível)
      cy.get('body', { timeout: 20000 }).should('contain.text', '?')
    })
  },
)
