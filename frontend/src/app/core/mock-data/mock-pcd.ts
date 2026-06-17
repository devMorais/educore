import type { AccessibilityResult } from '../models/content.models';

// Mock de PCD (Acessibilidade) para o Modo Demo (US-025)
export const MOCK_PCD: AccessibilityResult = {
  title: 'PCD — Comunicação Empresarial Moderna',
  simplified_text: `A comunicação empresarial é a forma como as pessoas trocam informações no trabalho.

É importante escrever de forma clara e simples. Assim, todos entendem a mensagem.

Existem diferentes tipos de documentos usados no trabalho. O memorando serve para avisos internos. O ofício serve para comunicações com órgãos do governo. A carta comercial serve para contatos com outras empresas.

Para escrever bem, use frases curtas. Evite palavras difíceis. Revise o texto antes de enviar.`,
  audio_script: `Olá! Vamos falar sobre comunicação empresarial.

No trabalho, precisamos trocar informações com colegas, clientes e parceiros. Para isso, usamos documentos escritos.

Os principais documentos são: o memorando, usado dentro da empresa; o ofício, usado para falar com órgãos públicos; e a carta comercial, usada para falar com outras empresas.

Para se comunicar bem, escreva de forma clara e simples. Use frases curtas e palavras conhecidas. Sempre revise o texto antes de enviar.

Boa comunicação melhora o trabalho de todos!`,
  visual_alternatives: [
    'Ícone de envelope representando correspondência empresarial',
    'Diagrama simples mostrando fluxo de comunicação entre pessoas',
    'Tabela comparativa dos tipos de documentos com ícones coloridos',
    'Checklist visual com boas práticas de redação',
  ],
  key_vocabulary: [
    {
      term: 'Memorando',
      definition: 'Bilhete formal usado para avisar colegas dentro da empresa.',
    },
    {
      term: 'Ofício',
      definition: 'Documento oficial usado para falar com órgãos do governo.',
    },
    {
      term: 'Correspondência',
      definition: 'Qualquer mensagem escrita trocada entre pessoas ou empresas.',
    },
    {
      term: 'Tópico frasal',
      definition: 'A frase principal de um parágrafo que resume o assunto.',
    },
    {
      term: 'Linguagem formal',
      definition: 'Forma de escrever ou falar usada em situações profissionais e oficiais.',
    },
  ],
  wcag_metadata: {
    reading_level: 'Básico (A2)',
    estimated_duration: '3 minutos',
    complexity_score: 2,
  },
  libras_suggestions: [
    'Usar intérprete de Libras para apresentação do conteúdo',
    'Disponibilizar vídeo com tradução em Libras dos documentos principais',
    'Incluir glossário em Libras para termos técnicos empresariais',
    'Criar legendas descritivas para todos os elementos visuais',
  ],
}; 
