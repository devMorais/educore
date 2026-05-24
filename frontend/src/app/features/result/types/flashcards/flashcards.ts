import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ResultStore } from '../../../../core/services/result-store';
import type { FlashcardsResult } from '../../../../core/models/content.models';

@Component({
  selector: 'app-flashcards',
  imports: [],
  templateUrl: './flashcards.html',
  styleUrl: './flashcards.scss',
})
export class Flashcards {
  private store = inject(ResultStore);
  private router = inject(Router);

  data = computed(() => this.store.data()?.result as FlashcardsResult | undefined);

  // ---- estado dos flashcards ----
  cardIndex = signal(0);
  cardFlipped = signal(false);

  currentCard = computed(() => this.data()?.cards[this.cardIndex()] ?? null);

  flipCard() {
    this.cardFlipped.update(v => !v);
  }

  nextCard() {
    const total = this.data()?.cards.length ?? 0;
    if (!total) return;
    this.cardIndex.update(i => (i + 1) % total);
    this.cardFlipped.set(false);
  }

  prevCard() {
    const total = this.data()?.cards.length ?? 0;
    if (!total) return;
    this.cardIndex.update(i => (i - 1 + total) % total);
    this.cardFlipped.set(false);
  }

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/upload']);
  }
}