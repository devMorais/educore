import type { Difficulty } from './difficulty.type';
import type { QuestionType } from './question-type.type';

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty?: Difficulty;
  type?: QuestionType;
  topic?: string;
}
