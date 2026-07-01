 import type { MindMapResult } from '../types/content';

// Mock de Mapa Mental para o Modo Demo (US-025)
export const MOCK_MINDMAP: MindMapResult = {
  title: 'Mapa Mental — Comunicação Empresarial Moderna',
  root: {
    id: 'root',
    topic: 'Comunicação Empresarial',
    children: [
      {
        id: 'doc',
        topic: 'Documentos',
        children: [
          { id: 'doc-1', topic: 'Carta Comercial' },
          { id: 'doc-2', topic: 'Memorando' },
          { id: 'doc-3', topic: 'Ofício' },
          { id: 'doc-4', topic: 'E-mail Profissional' },
        ],
      },
      {
        id: 'lang',
        topic: 'Linguagem',
        children: [
          { id: 'lang-1', topic: 'Clareza e Objetividade' },
          { id: 'lang-2', topic: 'Adequação ao Público' },
          { id: 'lang-3', topic: 'Correção Gramatical' },
          { id: 'lang-4', topic: 'Evitar Jargões' },
        ],
      },
      {
        id: 'struct',
        topic: 'Estrutura Textual',
        children: [
          { id: 'struct-1', topic: 'Tópico Frasal' },
          { id: 'struct-2', topic: 'Desenvolvimento' },
          { id: 'struct-3', topic: 'Conclusão' },
        ],
      },
      {
        id: 'boas',
        topic: 'Boas Práticas',
        children: [
          { id: 'boas-1', topic: 'Revisar antes de enviar' },
          { id: 'boas-2', topic: 'Tom adequado ao contexto' },
          { id: 'boas-3', topic: 'Parágrafos bem definidos' },
        ],
      },
    ],
  },
};
