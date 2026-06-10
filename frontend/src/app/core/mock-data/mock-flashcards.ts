 import type { FlashcardsResult } from '../models/content.models';

// Mock de Flashcards para o Modo Demo (US-025)
export const MOCK_FLASHCARDS: FlashcardsResult = {
  title: 'Flashcards — Comunicação Empresarial Moderna',
  total_cards: 6,
  cards: [
    {
      front: 'O que é um Memorando?',
      back: 'Documento de comunicação interna usado para troca de informações entre setores de uma empresa. É mais ágil e menos formal que o ofício.',
      topic: 'Documentos Empresariais',
    },
    {
      front: 'Qual a diferença entre Ofício e Carta Comercial?',
      back: 'O ofício é usado para comunicações com órgãos públicos e segue estrutura padronizada oficial. A carta comercial é usada para comunicações externas entre empresas privadas.',
      topic: 'Documentos Empresariais',
    },
    {
      front: 'O que é tópico frasal?',
      back: 'A frase que apresenta a ideia central de um parágrafo, orientando o leitor sobre o que será desenvolvido no restante do texto.',
      topic: 'Redação Empresarial',
    },
    {
      front: 'Quais são as características de uma boa comunicação empresarial?',
      back: 'Clareza, objetividade, correção gramatical, linguagem adequada ao público-alvo e estrutura bem definida.',
      topic: 'Comunicação Empresarial',
    },
    {
      front: 'O que é gerundismo e por que deve ser evitado?',
      back: 'É o uso excessivo de verbos no gerúndio, como "vou estar enviando". Deve ser evitado pois torna a linguagem pesada e pouco profissional.',
      topic: 'Linguagem Empresarial',
    },
    {
      front: 'Quais elementos compõem a estrutura básica de um ofício?',
      back: 'Cabeçalho, número, data, destinatário, assunto, corpo do texto e assinatura do responsável.',
      topic: 'Documentos Oficiais',
    },
  ],
};
