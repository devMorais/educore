import type { QuizResult } from './quiz-result.type';
import type { SummaryResult } from './summary-result.type';
import type { SlidesResult } from './slides-result.type';
import type { MindMapResult } from './mindmap-result.type';
import type { FlashcardsResult } from './flashcards-result.type';
import type { AccessibilityResult } from './accessibility-result.type';

export type ContentResult =
  | QuizResult
  | SummaryResult
  | SlidesResult
  | MindMapResult
  | FlashcardsResult
  | AccessibilityResult;
