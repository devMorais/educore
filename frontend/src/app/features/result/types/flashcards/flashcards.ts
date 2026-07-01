import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ResultStore } from '../../../../core/services/result-store.service';
import type { FlashcardsResult, Flashcard } from '../../../../core/types/content';

@Component({
  selector: 'app-flashcards',
  imports: [],
  templateUrl: './flashcards.html',
  styleUrl: './flashcards.scss',
})
export class Flashcards {
  private store  = inject(ResultStore);
  private router = inject(Router);

  data = computed(() => this.store.data()?.result as FlashcardsResult | undefined);

  // Índice e flip do card atual
  cardIndex   = signal(0);
  cardFlipped = signal(false);

  // Cards embaralhados ou na ordem original
  cardsOrdem = signal<Flashcard[]>([]);

  // Conjuntos de ids dos cards marcados
  jaSeiSet     = signal<Set<number>>(new Set());
  revisarSet   = signal<Set<number>>(new Set());

  // Card atual baseado na ordem
  currentCard = computed<Flashcard | null>(() => this.cardsOrdem()[this.cardIndex()] ?? null);

  // Total de cards
  total = computed(() => this.cardsOrdem().length);

  // Progresso baseado nos cards já respondidos (já sei + revisar)
  respondidos = computed(() => this.jaSeiSet().size + this.revisarSet().size);

  progressPercent = computed(() => {
    const t = this.total();
    return t ? Math.round((this.respondidos() / t) * 100) : 0;
  });

  // Verifica se o card atual já foi marcado
  cardAtualJaSei = computed(() => {
    const card = this.currentCard();
    if (!card) return false;
    return this.jaSeiSet().has(this.cardIndex());
  });

  cardAtualRevisar = computed(() => {
    const card = this.currentCard();
    if (!card) return false;
    return this.revisarSet().has(this.cardIndex());
  });

  // Inicializa os cards quando os dados chegam
  ngOnInit() {
    const cards = this.data()?.cards ?? [];
    this.cardsOrdem.set([...cards]);
  }

  // Vira o card
  flipCard() {
    this.cardFlipped.update(v => !v);
  }

  // Próximo card
  nextCard() {
    const t = this.total();
    if (!t) return;
    this.cardIndex.update(i => (i + 1) % t);
    this.cardFlipped.set(false);
  }

  // Card anterior
  prevCard() {
    const t = this.total();
    if (!t) return;
    this.cardIndex.update(i => (i - 1 + t) % t);
    this.cardFlipped.set(false);
  }

  // Embaralha os cards usando Fisher-Yates
  embaralhar() {
    const cards = [...this.cardsOrdem()];
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    this.cardsOrdem.set(cards);
    this.cardIndex.set(0);
    this.cardFlipped.set(false);
    this.jaSeiSet.set(new Set());
    this.revisarSet.set(new Set());
  }

  // Marca o card atual como "Já sei"
  marcarJaSei() {
    const novo = new Set(this.jaSeiSet());
    novo.add(this.cardIndex());
    // Remove de revisar se estava lá
    const rev = new Set(this.revisarSet());
    rev.delete(this.cardIndex());
    this.jaSeiSet.set(novo);
    this.revisarSet.set(rev);
    this.nextCard();
  }

  // Marca o card atual como "Revisar depois"
  marcarRevisar() {
    const novo = new Set(this.revisarSet());
    novo.add(this.cardIndex());
    // Remove de já sei se estava lá
    const sei = new Set(this.jaSeiSet());
    sei.delete(this.cardIndex());
    this.revisarSet.set(novo);
    this.jaSeiSet.set(sei);
    this.nextCard();
  }

  // Reinicia o estudo
  reiniciar() {
    const cards = this.data()?.cards ?? [];
    this.cardsOrdem.set([...cards]);
    this.cardIndex.set(0);
    this.cardFlipped.set(false);
    this.jaSeiSet.set(new Set());
    this.revisarSet.set(new Set());
  }

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/painel']);
  }
}