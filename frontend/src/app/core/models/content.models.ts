export type SlideLayout =
  | 'cover'
  | 'objectives'
  | 'content_bullets'
  | 'two_column'
  | 'quote_highlight'
  | 'stats_numbers'
  | 'timeline'
  | 'section_divider'
  | 'summary'
  | 'assessment'
  | 'closing';

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GenerationType =
  | 'quiz'
  | 'summary'
  | 'slides'
  | 'mindmap'
  | 'flashcards'
  | 'pcd';

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty?: Difficulty;
  type?: QuestionType;
  topic?: string;
}

export interface QuizResult {
  title: string;
  questions: QuizQuestion[];
  total_questions: number;
}

export interface SummaryResult {
  title: string;
  summary: string;
  key_points: string[];
  word_count: number;
}

export interface SlideContent {
  title: string;
  content: string[];
  notes?: string;
  layout?: SlideLayout;
  visual_suggestion?: string;
  accent_color?: 'blue' | 'green' | 'orange' | 'purple';
}

export interface SlidesResult {
  title: string;
  slides: SlideContent[];
  total_slides: number;
}

export interface MindMapNode {
  id: string;
  topic: string;
  children?: MindMapNode[];
}

export interface MindMapResult {
  title: string;
  root: MindMapNode;
}

export interface Flashcard {
  front: string;
  back: string;
  topic?: string;
}

export interface FlashcardsResult {
  title: string;
  cards: Flashcard[];
  total_cards: number;
}

export interface WcagMetadata {
  reading_level: string;
  estimated_duration: string;
  complexity_score: number;
}

export interface AccessibilityResult {
  title: string;
  simplified_text: string;
  audio_script: string;
  visual_alternatives: string[];
  key_vocabulary: Array<{ term: string; definition: string }>;
  wcag_metadata: WcagMetadata;
  libras_suggestions: string[];
}

export type ContentResult =
  | QuizResult
  | SummaryResult
  | SlidesResult
  | MindMapResult
  | FlashcardsResult
  | AccessibilityResult;
