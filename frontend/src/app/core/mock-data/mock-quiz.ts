 import type { QuizResult } from '../models/content.models';

// Mock de Quiz para o Modo Demo (US-025)
export const MOCK_QUIZ: QuizResult = {
  title: 'Quiz — Comunicação Empresarial Moderna',
  total_questions: 5,
  questions: [
    {
      question: 'Qual é o principal objetivo da comunicação empresarial moderna?',
      options: [
        'A) Transmitir informações de forma clara e objetiva',
        'B) Usar termos técnicos complexos para impressionar',
        'C) Comunicar apenas por escrito',
        'D) Evitar o contato direto com clientes',
      ],
      correct_answer: 'A) Transmitir informações de forma clara e objetiva',
      explanation: 'A comunicação empresarial moderna prioriza clareza e objetividade para garantir que a mensagem seja compreendida por todos os envolvidos.',
      difficulty: 'easy',
      type: 'multiple_choice',
      topic: 'Comunicação Empresarial',
    },
    {
      question: 'O que caracteriza uma correspondência empresarial de qualidade?',
      options: [
        'A) Uso excessivo de jargões',
        'B) Textos longos e detalhados',
        'C) Clareza, objetividade e linguagem adequada ao público',
        'D) Ausência de saudações formais',
      ],
      correct_answer: 'C) Clareza, objetividade e linguagem adequada ao público',
      explanation: 'Uma boa correspondência empresarial deve ser clara, objetiva e usar linguagem adequada ao perfil do destinatário.',
      difficulty: 'medium',
      type: 'multiple_choice',
      topic: 'Correspondência Empresarial',
    },
    {
      question: 'Qual documento é usado para comunicações internas formais em uma empresa?',
      options: [
        'A) Carta comercial',
        'B) Memorando',
        'C) Ofício',
        'D) Relatório técnico',
      ],
      correct_answer: 'B) Memorando',
      explanation: 'O memorando é um documento de comunicação interna, mais ágil e menos formal que o ofício, usado para troca de informações entre setores.',
      difficulty: 'easy',
      type: 'multiple_choice',
      topic: 'Documentos Empresariais',
    },
    {
      question: 'O que é o tópico frasal em um parágrafo?',
      options: [
        'A) A última frase do parágrafo',
        'B) A frase que apresenta a ideia central do parágrafo',
        'C) Um exemplo ilustrativo',
        'D) A conclusão do texto',
      ],
      correct_answer: 'B) A frase que apresenta a ideia central do parágrafo',
      explanation: 'O tópico frasal é a sentença que sintetiza a ideia principal do parágrafo, orientando o leitor sobre o que será desenvolvido.',
      difficulty: 'medium',
      type: 'multiple_choice',
      topic: 'Redação Empresarial',
    },
    {
      question: 'Qual é a estrutura básica de um ofício?',
      options: [
        'A) Introdução, desenvolvimento e conclusão livres',
        'B) Cabeçalho, número, data, destinatário, assunto, corpo e assinatura',
        'C) Apenas corpo e assinatura',
        'D) Data, remetente e mensagem',
      ],
      correct_answer: 'B) Cabeçalho, número, data, destinatário, assunto, corpo e assinatura',
      explanation: 'O ofício segue estrutura padronizada com cabeçalho institucional, numeração, data, destinatário, assunto, corpo do texto e assinatura do responsável.',
      difficulty: 'hard',
      type: 'multiple_choice',
      topic: 'Documentos Oficiais',
    },
  ],
};
