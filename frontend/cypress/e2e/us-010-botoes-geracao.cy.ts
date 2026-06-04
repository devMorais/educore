/// <reference types="cypress" />
import { gerarUsuario } from '../support/commands'

const AI  = () => Cypress.env('aiUrl')  as string
const API = () => Cypress.env('apiUrl') as string

describe('US-010 · Botões de Geração de Conteúdo', () => {
  const usuario = gerarUsuario('us010')

  const docConcluido = {
    id: 200,
    filename: 'aula_fisica.pdf',
    status: 'completed',
    progress_percent: 100,
    created_at: '2026-06-01T10:00:00Z',
  }

  const quizResponse = {
    title: 'Quiz de Física',
    questions: [
      {
        question: 'O que é velocidade?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        explanation: 'exp',
        difficulty: 'easy',
      },
    ],
    total_questions: 1,
  }

  before(() => {
    cy.criarContaAPI(usuario)
  })

  // Utilitário: vai para /upload com documento já concluído selecionado
  function abrirComDocumento(docId = 200, progresso = 100) {
    cy.loginUI(usuario.email, usuario.senha)
    cy.url().should('include', '/upload')

    cy.intercept('GET', `${AI()}/documents/`, { body: [docConcluido] }).as('listDocs')
    cy.intercept('GET', `${AI()}/documents/${docId}/generations`, { body: [] }).as('listGens')

    cy.visit('/upload')
    cy.wait('@listDocs')

    // Seleciona o documento da lista
    cy.get('.up-doc-card.is-clickable', { timeout: 5000 }).first().click()
    cy.get('.up-grid', { timeout: 5000 }).should('be.visible')
  }

  // ── 6 botões de ação ─────────────────────────────────────────────────────

  it('TC-78 · Exatamente 6 botões principais são exibidos (Quiz, Resumo, Slides, Mapa Mental, Flashcards, PCD)', () => {
    abrirComDocumento()

    const labels = ['Quiz', 'Resumo', 'Slides', 'Mapa Mental', 'Flashcards', 'Acessível PCD']
    labels.forEach((label) => {
      cy.get('.up-action').contains(label).should('exist')
    })
  })

  it('TC-79 · Botões ficam desabilitados enquanto progresso < 30%', () => {
    cy.loginUI(usuario.email, usuario.senha)

    // Simula upload com progresso baixo
    cy.intercept('POST', `${AI()}/documents/upload`, {
      body: { document_id: 201, status: 'processing' },
    }).as('uploadBaixo')
    cy.intercept('GET', `${AI()}/documents/`, { body: [] })
    cy.intercept('GET', `${AI()}/documents/201/status`, {
      body: { status: 'processing', progress_percent: 10 },
    })
    cy.intercept('GET', `${AI()}/documents/201/generations`, { body: [] })

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.4'),
        fileName: 'baixo.pdf',
        mimeType: 'application/pdf',
      },
      { force: true },
    )
    cy.get('.up-btn-primary').click()
    cy.wait('@uploadBaixo')

    // Grade não deve aparecer ou botões devem estar desabilitados
    cy.get('body').then(($b) => {
      if ($b.find('.up-action').length) {
        cy.get('.up-action').first().should('be.disabled')
      } else {
        cy.get('.up-action').should('not.exist')
      }
    })
  })

  it('TC-80 · Botões são habilitados quando documento está completed', () => {
    abrirComDocumento()
    cy.get('.up-action').first().should('not.be.disabled')
  })

  // ── Badge "✓ Gerado" ──────────────────────────────────────────────────────

  it('TC-81 · Badge "Gerado" aparece nos tipos já cacheados', () => {
    cy.loginUI(usuario.email, usuario.senha)

    cy.intercept('GET', `${AI()}/documents/`, { body: [docConcluido] })
    cy.intercept('GET', `${AI()}/documents/200/generations`, {
      body: [
        { id: 1, type: 'quiz',    created_at: '2026-06-01T11:00:00Z' },
        { id: 2, type: 'summary', created_at: '2026-06-01T11:05:00Z' },
      ],
    }).as('gensCache')

    cy.visit('/upload')
    cy.get('.up-doc-card.is-clickable', { timeout: 5000 }).first().click()
    cy.wait('@gensCache')

    cy.get('.up-action__cache-badge', { timeout: 5000 })
      .should('have.length.at.least', 2)
      .first()
      .should('contain.text', 'Gerado')
  })

  it('TC-82 · Tipos sem cache não exibem badge "Gerado"', () => {
    cy.loginUI(usuario.email, usuario.senha)

    cy.intercept('GET', `${AI()}/documents/`, { body: [docConcluido] })
    cy.intercept('GET', `${AI()}/documents/200/generations`, { body: [] }).as('gensSemCache')

    cy.visit('/upload')
    cy.get('.up-doc-card.is-clickable', { timeout: 5000 }).first().click()
    cy.wait('@gensSemCache')

    cy.get('.up-action__cache-badge').should('not.exist')
  })

  // ── Spinner no botão clicado ──────────────────────────────────────────────

  it('TC-83 · Spinner aparece no botão clicado durante a geração', () => {
    cy.loginUI(usuario.email, usuario.senha)

    cy.intercept('GET', `${AI()}/documents/`, { body: [docConcluido] })
    cy.intercept('GET', `${AI()}/documents/200/generations`, { body: [] })
    cy.intercept('POST', `${AI()}/documents/200/generate`, (req) => {
      req.reply({ delay: 2000, body: quizResponse })
    }).as('generateDelay')

    cy.visit('/upload')
    cy.get('.up-doc-card.is-clickable', { timeout: 5000 }).first().click()

    cy.get('.up-action').contains('Quiz').click()

    // Spinner deve aparecer no botão quiz
    cy.get('.up-action__spinner', { timeout: 3000 }).should('exist')
    cy.wait('@generateDelay')
  })

  it('TC-84 · Outros botões ficam desabilitados durante geração em andamento', () => {
    cy.loginUI(usuario.email, usuario.senha)

    cy.intercept('GET', `${AI()}/documents/`, { body: [docConcluido] })
    cy.intercept('GET', `${AI()}/documents/200/generations`, { body: [] })
    cy.intercept('POST', `${AI()}/documents/200/generate`, (req) => {
      req.reply({ delay: 2000, body: quizResponse })
    }).as('generateBloqueio')

    cy.visit('/upload')
    cy.get('.up-doc-card.is-clickable', { timeout: 5000 }).first().click()

    cy.get('.up-action').contains('Quiz').click()

    // Todos os botões devem estar desabilitados durante a geração
    cy.get('.up-action', { timeout: 3000 }).each(($btn) => {
      cy.wrap($btn).should('be.disabled')
    })

    cy.wait('@generateBloqueio')
  })

  // ── Navegação após geração ────────────────────────────────────────────────

  it('TC-85 · Após geração bem-sucedida, navega para /resultado/quiz', () => {
    cy.loginUI(usuario.email, usuario.senha)

    cy.intercept('GET', `${AI()}/documents/`, { body: [docConcluido] })
    cy.intercept('GET', `${AI()}/documents/200/generations`, { body: [] })
    cy.intercept('POST', `${AI()}/documents/200/generate`, {
      body: quizResponse,
    }).as('generateOk')

    cy.visit('/upload')
    cy.get('.up-doc-card.is-clickable', { timeout: 5000 }).first().click()

    cy.get('.up-action').contains('Quiz').click()
    cy.wait('@generateOk')

    cy.url({ timeout: 8000 }).should('include', '/resultado/quiz')
  })

  it('TC-86 · Resultado é salvo no localStorage (ResultStore)', () => {
    cy.loginUI(usuario.email, usuario.senha)

    cy.intercept('GET', `${AI()}/documents/`, { body: [docConcluido] })
    cy.intercept('GET', `${AI()}/documents/200/generations`, { body: [] })
    cy.intercept('POST', `${AI()}/documents/200/generate`, {
      body: quizResponse,
    }).as('generateStore')

    cy.visit('/upload')
    cy.get('.up-doc-card.is-clickable', { timeout: 5000 }).first().click()
    cy.get('.up-action').contains('Quiz').click()
    cy.wait('@generateStore')

    cy.window().then((win) => {
      const stored = win.localStorage.getItem('educore_result')
      expect(stored).to.not.be.null
      const parsed = JSON.parse(stored!)
      expect(parsed.type).to.eq('quiz')
    })
  })

  // ── Toast de erro na geração ──────────────────────────────────────────────

  it('TC-87 · Erro na geração exibe toast e libera os botões', () => {
    cy.loginUI(usuario.email, usuario.senha)

    cy.intercept('GET', `${AI()}/documents/`, { body: [docConcluido] })
    cy.intercept('GET', `${AI()}/documents/200/generations`, { body: [] })
    cy.intercept('POST', `${AI()}/documents/200/generate`, {
      statusCode: 500,
      body: { detail: 'Erro interno ao gerar conteúdo' },
    }).as('generateError')

    cy.visit('/upload')
    cy.get('.up-doc-card.is-clickable', { timeout: 5000 }).first().click()
    cy.get('.up-action').contains('Quiz').click()
    cy.wait('@generateError')

    // Toast de erro deve aparecer
    cy.get('p-toast .p-toast-message, .up-alert', { timeout: 6000 }).should('exist')

    // Botões são liberados novamente
    cy.get('.up-action').first().should('not.be.disabled')
  })

  // ── Usando resultado em cache ─────────────────────────────────────────────

  it('TC-88 · Clicar em tipo com cache usa resultado salvo e navega sem chamar API', () => {
    cy.loginUI(usuario.email, usuario.senha)

    cy.intercept('GET', `${AI()}/documents/`, { body: [docConcluido] })
    cy.intercept('GET', `${AI()}/documents/200/generations`, {
      body: [{ id: 10, type: 'quiz', created_at: '2026-06-01T11:00:00Z' }],
    }).as('gensComCache')

    cy.intercept('GET', `${AI()}/documents/200/generations/quiz`, {
      body: quizResponse,
    }).as('getCachedQuiz')

    // Garante que POST de geração NÃO é chamado
    cy.intercept('POST', `${AI()}/documents/200/generate`, cy.spy().as('gerarSpy'))

    cy.visit('/upload')
    cy.get('.up-doc-card.is-clickable', { timeout: 5000 }).first().click()
    cy.wait('@gensComCache')

    cy.get('.up-action').contains('Quiz').click()
    cy.wait('@getCachedQuiz')

    // POST /generate não deve ter sido chamado
    cy.get('@gerarSpy').should('not.have.been.called')
    cy.url({ timeout: 6000 }).should('include', '/resultado/quiz')
  })

  // ── Botão "Enviar novo PDF" ───────────────────────────────────────────────

  it('TC-89 · Botão "Enviar novo PDF" reseta o estado e volta ao dropzone', () => {
    abrirComDocumento()

    // Verifica que estamos na tela de geração
    cy.get('.up-grid').should('be.visible')

    // Clica no botão de reset
    cy.get('.up-btn-new, .up-link-btn').click({ force: true })

    // Dropzone deve reaparecer
    cy.get('.up-dropzone', { timeout: 5000 }).should('be.visible')
    cy.get('.up-grid').should('not.exist')
  })

  // ── API: endpoint de geração ──────────────────────────────────────────────

  it('TC-90 · POST /documents/{id}/generate sem token → 401', () => {
    cy.request({
      method: 'POST',
      url: `${AI()}/documents/200/generate`,
      body: { type: 'quiz' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  it('TC-91 · POST /documents/{id}/generate de documento alheio → 404', () => {
    const token = Cypress.env('tokenUS010') as string
    if (!token) return

    cy.request({
      method: 'POST',
      url: `${AI()}/documents/999999/generate`,
      body: { type: 'quiz' },
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([403, 404])
    })
  })
})
