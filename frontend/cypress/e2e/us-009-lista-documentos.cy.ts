/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

const AI = () => Cypress.env('aiUrl') as string

describe('US-009 · Lista de Documentos Anteriores', () => {
  const usuario = gerarUsuario('us009')

  const docsConcluidos = [
    { id: 1, filename: 'matematica.pdf',  status: 'completed', progress_percent: 100, created_at: '2026-06-01T10:00:00Z' },
    { id: 2, filename: 'historia.pdf',    status: 'completed', progress_percent: 100, created_at: '2026-06-02T14:30:00Z' },
    { id: 3, filename: 'ciencias.pdf',    status: 'processing', progress_percent: 45, created_at: '2026-06-03T08:00:00Z' },
  ]

  const docFalhou = { id: 4, filename: 'falhou.pdf', status: 'failed', progress_percent: 0, created_at: '2026-05-30T12:00:00Z' }

  before(() => {
    cy.criarContaAPI(usuario)
  })

  beforeEach(() => {
    cy.loginUI(usuario.email, usuario.senha)
    cy.url().should('include', '/upload')
  })

  // ── Seção Documentos Recentes ─────────────────────────────────────────────

  it('TC-63 · Seção "Documentos Recentes" é exibida na página de upload', () => {
    cy.intercept('GET', `${AI()}/documents/`, { body: docsConcluidos }).as('listDocs')

    cy.visit('/upload')
    cy.wait('@listDocs')

    cy.get('.up-recent').should('exist')
    cy.get('.up-recent__title').should('contain.text', 'Documentos Recentes')
  })

  it('TC-64 · Estado vazio exibido quando não há documentos', () => {
    cy.intercept('GET', `${AI()}/documents/`, { body: [] }).as('listVazia')

    cy.visit('/upload')
    cy.wait('@listVazia')

    cy.get('.up-recent__empty', { timeout: 5000 }).should('be.visible')
    cy.get('.up-recent__empty').should('contain.text', 'nenhum PDF')
  })

  // ── Loading skeleton ──────────────────────────────────────────────────────

  it('TC-65 · Skeleton de loading é exibido enquanto lista carrega', () => {
    cy.intercept('GET', `${AI()}/documents/`, (req) => {
      req.reply({ delay: 1000, body: docsConcluidos })
    }).as('listDelay')

    cy.visit('/upload')

    // Durante o carregamento, skeleton deve existir
    cy.get('.up-doc-card--skeleton', { timeout: 2000 }).should('exist')
    cy.wait('@listDelay')

    // Após carregar, skeleton desaparece
    cy.get('.up-doc-card--skeleton').should('not.exist')
  })

  // ── Cards de documentos ───────────────────────────────────────────────────

  it('TC-66 · Lista exibe nome e data de cada documento', () => {
    cy.intercept('GET', `${AI()}/documents/`, { body: docsConcluidos }).as('listDocs')
    cy.intercept('GET', `${AI()}/documents/*/generations`, { body: [] })

    cy.visit('/upload')
    cy.wait('@listDocs')

    cy.get('.up-doc-card').should('have.length.at.least', 1)
    cy.get('.up-doc-card__name').first().should('contain.text', '.pdf')
    cy.get('.up-doc-card__date').first().should('exist')
  })

  it('TC-67 · Badge "Concluído" aparece para documentos com status completed', () => {
    cy.intercept('GET', `${AI()}/documents/`, { body: docsConcluidos }).as('listDocs')
    cy.intercept('GET', `${AI()}/documents/*/generations`, { body: [] })

    cy.visit('/upload')
    cy.wait('@listDocs')

    cy.get('.up-badge.is-done', { timeout: 5000 })
      .first()
      .should('contain.text', 'Concluído')
  })

  it('TC-68 · Badge "Processando" com spinner para status processing', () => {
    cy.intercept('GET', `${AI()}/documents/`, { body: docsConcluidos }).as('listDocs')
    cy.intercept('GET', `${AI()}/documents/*/generations`, { body: [] })

    cy.visit('/upload')
    cy.wait('@listDocs')

    cy.get('.up-badge.is-processing', { timeout: 5000 }).should('exist')
    cy.get('.up-badge.is-processing .pi-spinner').should('exist')
  })

  it('TC-69 · Badge "Falhou" aparece para documentos com status failed', () => {
    cy.intercept('GET', `${AI()}/documents/`, { body: [docFalhou] }).as('listFailed')

    cy.visit('/upload')
    cy.wait('@listFailed')

    cy.get('.up-badge.is-failed', { timeout: 5000 }).should('contain.text', 'Falhou')
  })

  // ── Ícones de tipos gerados ───────────────────────────────────────────────

  it('TC-70 · Ícones de tipos gerados aparecem em documentos concluídos', () => {
    cy.intercept('GET', `${AI()}/documents/`, {
      body: [docsConcluidos[0]],
    }).as('listUm')

    cy.intercept('GET', `${AI()}/documents/1/generations`, {
      body: [
        { id: 1, type: 'quiz',    created_at: '2026-06-01T11:00:00Z' },
        { id: 2, type: 'summary', created_at: '2026-06-01T11:05:00Z' },
      ],
    }).as('gens1')

    cy.visit('/upload')
    cy.wait('@listUm')
    cy.wait('@gens1')

    cy.get('.up-doc-card__gens', { timeout: 5000 }).should('exist')
    cy.get('.up-doc-card__gen').should('have.length.at.least', 2)
  })

  // ── Seleção de documento ──────────────────────────────────────────────────

  it('TC-71 · Clicar em documento concluído ativa a geração de conteúdo', () => {
    cy.intercept('GET', `${AI()}/documents/`, {
      body: [docsConcluidos[0]],
    }).as('listClick')
    cy.intercept('GET', `${AI()}/documents/1/generations`, { body: [] }).as('gens')

    cy.visit('/upload')
    cy.wait('@listClick')

    cy.get('.up-doc-card.is-clickable', { timeout: 5000 }).first().click()

    // Painel de ações deve aparecer
    cy.get('.up-grid', { timeout: 5000 }).should('be.visible')
  })

  it('TC-72 · Clicar em documento "processing" não ativa geração', () => {
    const docProcessando = docsConcluidos[2] // status: processing
    cy.intercept('GET', `${AI()}/documents/`, { body: [docProcessando] }).as('listProc')

    cy.visit('/upload')
    cy.wait('@listProc')

    cy.get('.up-doc-card').first().click({ force: true })

    // Grade de ações NÃO deve aparecer
    cy.get('.up-grid').should('not.exist')
  })

  // ── Botão Reenviar ────────────────────────────────────────────────────────

  it('TC-73 · Botão "Reenviar" aparece apenas para documentos falhados', () => {
    cy.intercept('GET', `${AI()}/documents/`, {
      body: [docsConcluidos[0], docFalhou],
    }).as('listMista')

    cy.visit('/upload')
    cy.wait('@listMista')

    cy.get('.up-doc-card__retry', { timeout: 5000 }).should('have.length', 1)
  })

  it('TC-74 · Clicar em Reenviar não propaga o clique para o card (não ativa geração)', () => {
    cy.intercept('GET', `${AI()}/documents/`, { body: [docFalhou] }).as('listFailed2')

    cy.visit('/upload')
    cy.wait('@listFailed2')

    cy.get('.up-doc-card__retry', { timeout: 5000 }).click()

    // Grade de ações NÃO deve aparecer (documento falhou)
    cy.get('.up-grid').should('not.exist')
  })

  // ── Máximo de 10 documentos ───────────────────────────────────────────────

  it('TC-75 · Lista exibe no máximo 10 documentos mesmo que API retorne mais', () => {
    const muitosDocs = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      filename: `doc_${i + 1}.pdf`,
      status: 'completed',
      progress_percent: 100,
      created_at: new Date(2026, 5, i + 1).toISOString(),
    }))

    cy.intercept('GET', `${AI()}/documents/`, { body: muitosDocs }).as('listMuitos')
    cy.intercept('GET', `${AI()}/documents/*/generations`, { body: [] })

    cy.visit('/upload')
    cy.wait('@listMuitos')

    cy.get('.up-doc-card:not(.up-doc-card--skeleton)', { timeout: 5000 })
      .should('have.length.at.most', 10)
  })

  // ── API: listagem de documentos ───────────────────────────────────────────

  it('TC-76 · GET /documents/ sem token → 401', () => {
    cy.request({
      method: 'GET',
      url: `${AI()}/documents/`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('TC-77 · GET /documents/ com token retorna array', () => {
    const token = Cypress.env('tokenUS009') as string
    if (!token) return // pula se token não disponível

    cy.request({
      method: 'GET',
      url: `${AI()}/documents/`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.be.an('array')
    })
  })
})
