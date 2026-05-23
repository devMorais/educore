import { Component, signal, computed, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AiService } from '../../core/services/ai';
import { MindmapNode } from './mindmap-node/mindmap-node';

import type {
  QuizQuestion,
  QuizResult,
  SummaryResult,
  SlidesResult,
  MindMapResult,
  FlashcardsResult,
  AccessibilityResult,
  ContentResult,
} from '../../core/models/content.models';

interface StoredResult {
  result: ContentResult;
  type: string;
  documentId?: number;
}

@Component({
  selector: 'app-result',
  imports: [MindmapNode],
  templateUrl: './result.html',
  styleUrl: './result.scss',
})
export class Result implements OnInit {
  private router = inject(Router);
  private aiService = inject(AiService);
  private platformId = inject(PLATFORM_ID);

  type = signal<string>('');
  data = signal<ContentResult | null>(null);
  documentId = signal<number | null>(null);
  downloadingPptx = signal(false);

  // ---- quiz state ----
  currentIndex = signal(0);
  selectedAnswer = signal<string | null>(null);
  answered = signal(false);
  score = signal(0);
  finished = signal(false);

  // ---- flashcards state ----
  cardFlipped = signal(false);
  cardIndex = signal(0);

  // ---- pcd tabs ----
  pcdTab = signal<'simplified' | 'audio' | 'vocabulary' | 'libras'>('simplified');

  // ---- computed ----
  quizData = computed(() => (this.type() === 'quiz' ? (this.data() as QuizResult) : null));
  summaryData = computed(() => (this.type() === 'summary' ? (this.data() as SummaryResult) : null));
  slidesData = computed(() => (this.type() === 'slides' ? (this.data() as SlidesResult) : null));
  mindmapData = computed(() => (this.type() === 'mindmap' ? (this.data() as MindMapResult) : null));
  flashcardsData = computed(() =>
    this.type() === 'flashcards' ? (this.data() as FlashcardsResult) : null,
  );
  pcdData = computed(() => (this.type() === 'pcd' ? (this.data() as AccessibilityResult) : null));

  questions = computed<QuizQuestion[]>(() => this.quizData()?.questions ?? []);
  currentQuestion = computed<QuizQuestion | null>(
    () => this.questions()[this.currentIndex()] ?? null,
  );
  progressPercent = computed(() => {
    const total = this.questions().length;
    return total ? Math.round((this.currentIndex() / total) * 100) : 0;
  });

  summaryParagraphs = computed<string[]>(() => {
    const s = this.summaryData()?.summary ?? '';
    return s.split('\n\n').filter(p => p.trim().length > 0);
  });

  currentCard = computed(() => this.flashcardsData()?.cards[this.cardIndex()] ?? null);

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const navState = nav?.extras?.state as StoredResult | undefined;

    let stored: StoredResult | null = null;
    if (navState?.result && navState?.type) {
      stored = navState;
    } else if (isPlatformBrowser(this.platformId)) {
      const raw = localStorage.getItem('educore_result');
      if (raw) stored = JSON.parse(raw);
    }

    if (stored) {
      this.data.set(stored.result);
      this.type.set(stored.type);
      this.documentId.set(stored.documentId ?? null);
      // Keep result persisted for F5 refresh
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('educore_result', JSON.stringify(stored));
      }
    }
  }

  ngOnInit() { }

  // ---- quiz ----
  selectAnswer(option: string) {
    if (this.answered()) return;
    this.selectedAnswer.set(option);
    this.answered.set(true);
    if (option === this.currentQuestion()?.correct_answer) {
      this.score.update(s => s + 1);
    }
  }

  isCorrect(option: string): boolean {
    return option === this.currentQuestion()?.correct_answer;
  }

  nextQuestion() {
    if (this.currentIndex() + 1 >= this.questions().length) {
      this.finished.set(true);
      return;
    }
    this.currentIndex.update(i => i + 1);
    this.selectedAnswer.set(null);
    this.answered.set(false);
  }

  restartQuiz() {
    this.currentIndex.set(0);
    this.selectedAnswer.set(null);
    this.answered.set(false);
    this.score.set(0);
    this.finished.set(false);
  }

  // ---- slides ----
  downloadPptx() {
    const docId = this.documentId();
    if (!docId) return;
    this.downloadingPptx.set(true);
    this.aiService.downloadPptx(docId).subscribe({
      next: blob => {
        this.downloadingPptx.set(false);
        this.aiService.triggerDownload(blob, `apresentacao_educore_${docId}.pptx`);
      },
      error: () => {
        this.downloadingPptx.set(false);
      },
    });
  }

  // ---- flashcards ----
  flipCard() {
    this.cardFlipped.update(v => !v);
  }

  nextCard() {
    const total = this.flashcardsData()?.cards.length ?? 0;
    this.cardIndex.update(i => (i + 1) % total);
    this.cardFlipped.set(false);
  }

  prevCard() {
    const total = this.flashcardsData()?.cards.length ?? 0;
    this.cardIndex.update(i => (i - 1 + total) % total);
    this.cardFlipped.set(false);
  }

  // ---- pcd tabs ----
  setPcdTab(tab: 'simplified' | 'audio' | 'vocabulary' | 'libras') {
    this.pcdTab.set(tab);
  }

  copyText(text: string) {
    if (isPlatformBrowser(this.platformId)) {
      navigator.clipboard.writeText(text);
    }
  }

  // ---- navigation ----
  goToUpload() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('educore_result');
    }
    this.router.navigate(['/upload']);
  }
}
