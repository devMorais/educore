import type { QuizQuestion } from './quiz-question.type';

export interface QuizResult {
  title: string;
  questions: QuizQuestion[];
  total_questions: number;
}
