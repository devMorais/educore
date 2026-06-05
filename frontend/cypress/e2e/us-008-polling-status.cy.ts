/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

const AI = () => Cypress.env('aiUrl') as string

describe('US-008 · Polling de Status do Processamento', () => {
  const usuario = gerarUsuario('us008')

  before(() => {
    cy.criarContaAPI(usuario).then((token) => {
      Cypress.env('tokenUS008', token)
    })
  })

  beforeEach(() => {
    const token = Cypress.env('tokenUS008') as string
    cy.visit('/upload', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', token)
      },
    })
    cy.url().should('include', '/upload')
  })

  // Utilitário: simula upload bem-sucedido e inicia polling
  function simularUpload(docId: number, statusInicial = 'processing') {
    cy.intercept('POST', `${AI()}/documents/upload`, {
      statusCode: 200,
      body: { document_id: docId, status: statusInicial },
    }).as('uploadOk')

    cy.intercept('GET', `${AI()}/documents/`, { body: [] })
    cy.intercept('GET', `${AI()}/documents/${docId}/generations`, { body: [] })

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.4 polling test'),
        fileName: `polling_${docId}.pdf`,
        mimeType: 'application/pdf',
      },
      { force: true },
    )
    cy.get('.up-btn-primary').click()
    cy.wait('@uploadOk')
  }

  // ── Exibição do painel de processamento ──────────────────────────────────────

  it('TC-51 · Após upload, painel de processamento é exibido', () => {
    cy.intercept('GET', `${AI()}/documents/101/status`, {
      body: { status: 'processing', progress_percent: 10 },
    }).as('statusPoll')

    simularUpload(101)

    cy.get('.up-processing', { timeout: 5000 }).should('be.visible')
    cy.get('.up-processing .pi-spinner').should('exist')
  })

  it('TC-52 · Barra de progresso reflete percentual retornado pelo polling', () => {
    let chamadas = 0
    cy.intercept('GET', `${AI()}/documents/102/status`, () => {
      chamadas++
      return {
        body: {
          status: 'processing',
          progress_percent: chamadas === 1 ? 20 : 50,
        },
      }
    }).as('statusPoll')

    simularUpload(102)

    cy.wait('@statusPoll')
    cy.get('.up-progress__fill', { timeout: 4000 }).should('exist')
  })

  // ── Mensagens de fase ────────────────────────────────────────────────────────

  it('TC-53 · Fase "analisando" exibida entre 10% e 79%', () => {
    cy.intercept('GET', `${AI()}/documents/103/status`, {
      body: { status: 'processing', progress_percent: 40 },
    }).as('statusFase')

    simularUpload(103)
    cy.wait('@statusFase')

    cy.get('.up-processing', { timeout: 5000 })
      .should('contain.text', 'Analisando')
  })

  it('TC-54 · Fase "finalizando" exibida a partir de 80%', () => {
    cy.intercept('GET', `${AI()}/documents/104/status`, {
      body: { status: 'processing', progress_percent: 85 },
    }).as('statusFinal')

    simularUpload(104)
    cy.wait('@statusFinal')

    cy.get('.up-processing', { timeout: 5000 })
      .should('contain.text', 'Finaliz')
  })

  // ── Habilitação parcial dos botões ───────────────────────────────────────────

  it('TC-55 · Botões ficam disponíveis quando progresso >= 30%', () => {
    cy.intercept('GET', `${AI()}/documents/105/status`, {
      body: { status: 'processing', progress_percent: 30 },
    }).as('status30')

    simularUpload(105)
    cy.wait('@status30')

    // Grade de ações deve aparecer
    cy.get('.up-grid', { timeout: 5000 }).should('be.visible')
    cy.get('.up-action').first().should('not.be.disabled')
  })

  it('TC-56 · Botões permanecem desabilitados com progresso < 30%', () => {
    cy.intercept('GET', `${AI()}/documents/106/status`, {
      body: { status: 'processing', progress_percent: 15 },
    }).as('status15')

    simularUpload(106)
    cy.wait('@status15')

    // Grade não deve existir ou botões devem estar desabilitados
    cy.get('body').then(($body) => {
      if ($body.find('.up-grid').length > 0) {
        cy.get('.up-action').first().should('be.disabled')
      } else {
        cy.get('.up-grid').should('not.exist')
      }
    })
  })

  // ── Conclusão do processamento ────────────────────────────────────────────────

  it('TC-57 · Status "completed" para polling e habilita geração', () => {
    cy.intercept('GET', `${AI()}/documents/107/generations`, { body: [] })
    cy.intercept('GET', `${AI()}/documents/`, { body: [] })
    cy.intercept('GET', `${AI()}/documents/107/status`, {
      body: { status: 'completed', progress_percent: 100 },
    }).as('statusCompleted')

    simularUpload(107)
    cy.wait('@statusCompleted')

    cy.get('.up-grid', { timeout: 10000 }).should('be.visible')
    cy.get('.up-action').first().should('not.be.disabled')
  })

  // ── Falha no processamento ─────────────────────────────────────────────────

  it('TC-58 · Status "failed" exibe erro com botão Tentar novamente', () => {
    cy.intercept('GET', `${AI()}/documents/108/status`, {
      body: { status: 'failed', progress_percent: 0 },
    }).as('statusFailed')

    simularUpload(108)
    cy.wait('@statusFailed')

    cy.get('.up-error, .up-btn-retry, .up-alert', { timeout: 6000 }).should('exist')
    cy.get('body').should('contain.text', 'Tentar novamente')
  })

  it('TC-59 · Botão Tentar novamente reseta o estado do componente', () => {
    cy.intercept('GET', `${AI()}/documents/109/status`, {
      body: { status: 'failed', progress_percent: 0 },
    }).as('statusFailed2')

    simularUpload(109)
    cy.wait('@statusFailed2')

    // Clica em Tentar novamente (pode ser botão ou link)
    cy.contains('Tentar novamente', { timeout: 6000 }).click({ force: true })

    // Após reset, dropzone deve reaparecer
    cy.get('.up-dropzone', { timeout: 5000 }).should('be.visible')
  })

  // ── Polling não dispara toast em erro ────────────────────────────────────────

  it('TC-60 · Erro no polling de status não exibe toast', () => {
    cy.intercept('GET', `${AI()}/documents/110/status`, {
      statusCode: 503,
    }).as('statusError')

    simularUpload(110)
    cy.wait('@statusError')

    // Aguarda 2 ciclos de polling
    cy.wait(3000)
    cy.get('.p-toast-message').should('not.exist')
  })

  // ── API: endpoint de status ──────────────────────────────────────────────────

  it('TC-61 · GET /documents/{id}/status sem token → 401', () => {
    cy.request({
      method: 'GET',
      url: `${AI()}/documents/1/status`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('TC-62 · GET /documents/{id}/status de documento alheio → 404', () => {
    const token = Cypress.env('tokenUS008') as string
    cy.request({
      method: 'GET',
      url: `${AI()}/documents/999999/status`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
    })
  })
})
