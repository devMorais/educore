import type { Flashcard } from './flashcard.type';

export interface FlashcardsResult {
  title: string;
  cards: Flashcard[];
  total_cards: number;
}
