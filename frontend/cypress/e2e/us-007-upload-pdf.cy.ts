/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

const AI = () => Cypress.env('aiUrl') as string

describe('US-007 · Upload de PDF — Drag & Drop com Validação', () => {
  const usuario = gerarUsuario('us007')

  before(() => {
    cy.criarContaAPI(usuario).then((token) => {
      Cypress.env('tokenUS007', token)
    })
  })

  beforeEach(() => {
    const token = Cypress.env('tokenUS007') as string
    cy.visit('/upload', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', token)
      },
    })
    cy.url().should('include', '/upload')
  })

  // ── Área de dropzone ───────────────────────────────────────────────────────

  it('TC-40 · Dropzone exibe borda tracejada e ícone de upload', () => {
    cy.get('.up-dropzone').should('exist')
    cy.get('.up-dropzone i.pi-cloud-upload').should('be.visible')
    cy.get('.up-dropzone h3').should('contain.text', 'Arraste seu PDF aqui')
  })

  it('TC-41 · Dropzone recebe classe is-dragging ao arrastar arquivo sobre ela', () => {
    cy.get('.up-dropzone').trigger('dragover', {
      dataTransfer: { files: [] },
      bubbles: true,
    })
    cy.get('.up-dropzone').should('have.class', 'is-dragging')
  })

  it('TC-42 · Classe is-dragging é removida ao sair da área de drop', () => {
    cy.get('.up-dropzone')
      .trigger('dragover', { dataTransfer: { files: [] }, bubbles: true })
      .trigger('dragleave', { bubbles: true })
    cy.get('.up-dropzone').should('not.have.class', 'is-dragging')
  })

  // ── Validação de arquivo ────────────────────────────────────────────────────

  it('TC-43 · Selecionar arquivo não-PDF exibe mensagem de erro de tipo', () => {
    // Simula seleção de arquivo .txt via input
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('conteudo'), fileName: 'teste.txt', mimeType: 'text/plain' },
      { force: true },
    )
    cy.get('.up-alert').should('contain.text', 'PDF')
  })

  it('TC-44 · Selecionar PDF válido exibe nome, tamanho e ícone do arquivo', () => {
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.4 fake content'),
        fileName: 'material_didatico.pdf',
        mimeType: 'application/pdf',
      },
      { force: true },
    )
    cy.get('.up-dropzone__selected').should('be.visible')
    cy.get('.up-dropzone__pdf-icon').should('be.visible')
    cy.get('.up-dropzone__selected strong').should('contain.text', 'material_didatico.pdf')
    cy.get('.up-dropzone__selected small').should('exist')
  })

  it('TC-45 · Botão "Enviar para IA" aparece após selecionar PDF válido', () => {
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.4 test'),
        fileName: 'aula.pdf',
        mimeType: 'application/pdf',
      },
      { force: true },
    )
    cy.get('.up-btn-primary').should('be.visible').and('contain.text', 'Enviar para IA')
  })

  // ── Upload com progresso ────────────────────────────────────────────────────

  it('TC-46 · Durante upload, spinner e percentual são exibidos', () => {
    // Intercepta o upload e atrasa a resposta para capturar o estado de loading
    cy.intercept('POST', `${AI()}/documents/upload`, (req) => {
      req.reply({ delay: 2000, statusCode: 200, body: { document_id: 1, status: 'processing' } })
    }).as('uploadReq')

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.4 test content'),
        fileName: 'teste_upload.pdf',
        mimeType: 'application/pdf',
      },
      { force: true },
    )

    cy.get('.up-btn-primary').click()

    // Durante o upload — spinner ou texto de progresso deve aparecer
    cy.get('.up-btn-primary', { timeout: 3000 }).should('contain.text', 'Enviando')
    cy.get('.up-progress').should('exist')

    cy.wait('@uploadReq')
  })

  it('TC-47 · Barra de progresso existe e tem fill', () => {
    cy.intercept('POST', `${AI()}/documents/upload`, (req) => {
      req.reply({ delay: 1500, statusCode: 200, body: { document_id: 2, status: 'processing' } })
    }).as('uploadProg')

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.4 prog test'),
        fileName: 'prog.pdf',
        mimeType: 'application/pdf',
      },
      { force: true },
    )
    cy.get('.up-btn-primary').click()
    cy.get('.up-progress__fill').should('exist')
    cy.wait('@uploadProg')
  })

  // ── Deduplicação ─────────────────────────────────────────────────────────────

  it('TC-48 · PDF já enviado exibe toast de deduplicação', () => {
    cy.intercept('POST', `${AI()}/documents/upload`, {
      statusCode: 200,
      body: { document_id: 99, status: 'completed', deduplicated: true },
    }).as('uploadDup')

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.4 duplicated'),
        fileName: 'duplicado.pdf',
        mimeType: 'application/pdf',
      },
      { force: true },
    )
    // Intercepta listDocuments para não quebrar após dedup
    cy.intercept('GET', `${AI()}/documents/`, { body: [] }).as('listDocs')
    cy.intercept('GET', `${AI()}/documents/99/generations`, { body: [] }).as('listGens')

    cy.get('.up-btn-primary').click()
    cy.wait('@uploadDup')

    cy.get('p-toast .p-toast-message, .p-toast-summary', { timeout: 8000 })
      .should('contain.text', 'PDF já processado')
  })

  // ── Erro de upload ───────────────────────────────────────────────────────────

  it('TC-49 · Erro 413 (arquivo grande) exibe mensagem amigável', () => {
    cy.intercept('POST', `${AI()}/documents/upload`, {
      statusCode: 413,
      body: { detail: 'File too large' },
    }).as('upload413')

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.4 large'),
        fileName: 'grande.pdf',
        mimeType: 'application/pdf',
      },
      { force: true },
    )
    cy.get('.up-btn-primary').click()
    cy.wait('@upload413')

    cy.get('.up-alert', { timeout: 6000 }).should('contain.text', '100 MB')
  })

  // ── API: upload retorna document_id ─────────────────────────────────────────

  it('TC-50 · API /documents/upload sem token → 401', () => {
    const formData = new FormData()
    cy.request({
      method: 'POST',
      url: `${AI()}/documents/upload`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })
})
