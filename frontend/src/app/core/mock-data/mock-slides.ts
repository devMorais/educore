 import type { SlidesResult } from '../types/content';

// Mock de Slides para o Modo Demo (US-025)
export const MOCK_SLIDES: SlidesResult = {
  title: 'Slides — Comunicação Empresarial Moderna',
  total_slides: 5,
  slides: [
    {
      title: 'Comunicação Empresarial Moderna',
      content: [
        'Transforme sua forma de comunicar no ambiente corporativo',
        'Clareza, objetividade e profissionalismo',
        'Powered by EduCore + Gemini 2.5-Flash',
      ],
      layout: 'cover',
      notes: 'Slide de abertura — apresentar o tema e os objetivos da aula.',
      visual_suggestion: 'Imagem de profissionais em reunião com elementos gráficos modernos.',
      accent_color: 'purple',
    },
    {
      title: 'O que é Comunicação Empresarial?',
      content: [
        'Conjunto de práticas para transmitir informações no ambiente corporativo',
        'Abrange comunicação escrita, oral e digital',
        'Fundamental para o sucesso organizacional',
        'Envolve diferentes públicos: equipes, clientes e parceiros',
      ],
      layout: 'content_bullets',
      notes: 'Explicar a importância da comunicação no contexto empresarial atual.',
      visual_suggestion: 'Diagrama mostrando fluxo de comunicação entre departamentos.',
      accent_color: 'blue',
    },
    {
      title: 'Tipos de Documentos Empresariais',
      content: [
        'Carta Comercial — comunicação externa formal',
        'Memorando — comunicação interna ágil',
        'Ofício — comunicação oficial com órgãos públicos',
        'E-mail Profissional — comunicação digital moderna',
      ],
      layout: 'content_bullets',
      notes: 'Destacar as diferenças entre cada tipo de documento e quando usar cada um.',
      visual_suggestion: 'Ícones representando cada tipo de documento com exemplos visuais.',
      accent_color: 'green',
    },
    {
      title: 'Boas Práticas na Redação',
      content: [
        'Use linguagem clara e objetiva',
        'Evite jargões e gerundismos desnecessários',
        'Revise a gramática antes de enviar',
        'Adapte o tom ao público-alvo',
        'Estruture o texto em parágrafos bem definidos',
      ],
      layout: 'content_bullets',
      notes: 'Apresentar exemplos práticos de textos antes e depois da revisão.',
      visual_suggestion: 'Comparativo visual entre texto mal escrito e bem escrito.',
      accent_color: 'orange',
    },
    {
      title: 'Próximos Passos',
      content: [
        'Pratique a redação de memorandos e ofícios',
        'Revise seus e-mails antes de enviar',
        'Consulte o Manual de Redação Oficial',
        'Use o EduCore para gerar materiais de estudo em segundos!',
      ],
      layout: 'closing',
      notes: 'Encerrar com uma chamada para ação e indicar recursos adicionais.',
      visual_suggestion: 'Imagem motivacional com call-to-action para praticar.',
      accent_color: 'purple',
    },
  ],
};
