import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ResultStore } from '../../../../core/services/result-store';
import { AiService } from '../../../../core/services/ai';
import { ToastService } from '../../../../core/services/toast';
import type { QuizResult, QuizQuestion, Difficulty } from '../../../../core/models/content.models';

@Component({
  selector: 'app-quiz',
  imports: [],
  templateUrl: './quiz.html',
  styleUrl: './quiz.scss',
})
export class Quiz {
  private store = inject(ResultStore);
  private router = inject(Router);
  private aiService = inject(AiService);
  private toast = inject(ToastService);

  data = computed(() => this.store.data()?.result as QuizResult | undefined);
  documentId = computed(() => this.store.data()?.documentId ?? null);

  // ── filtro de dificuldade (US-012) ────────────────────────────────────────
  selectedDifficulty = signal<Difficulty | 'all'>('all');
  quizStarted = signal(false);

  readonly difficultyChips: { key: Difficulty | 'all'; label: string }[] = [
    { key: 'all',    label: 'Todas'  },
    { key: 'easy',   label: 'Fácil'  },
    { key: 'medium', label: 'Médio'  },
    { key: 'hard',   label: 'Difícil' },
  ];

  readonly difficultyLabels: Record<Difficulty, string> = {
    easy:   'Fácil',
    medium: 'Médio',
    hard:   'Difícil',
  };

  readonly difficultyColors: Record<Difficulty, string> = {
    easy:   'badge--easy',
    medium: 'badge--medium',
    hard:   'badge--hard',
  };

  filteredQuestions = computed<QuizQuestion[]>(() => {
    const all = this.data()?.questions ?? [];
    const d = this.selectedDifficulty();
    return d === 'all' ? all : all.filter(q => q.difficulty === d);
  });

  countByDifficulty(d: Difficulty): number {
    return (this.data()?.questions ?? []).filter(q => q.difficulty === d).length;
  }

  startQuiz() {
    if (this.filteredQuestions().length === 0) {
      this.toast.aviso('Nenhuma questão disponível para este filtro.');
      return;
    }
    this.currentIndex.set(0);
    this.selectedAnswer.set(null);
    this.answered.set(false);
    this.score.set(0);
    this.finished.set(false);
    this.showExplanation.set(false);
    this.quizStarted.set(true);
  }

  // ── estado do quiz (US-011) ───────────────────────────────────────────────
  currentIndex    = signal(0);
  selectedAnswer  = signal<string | null>(null);
  answered        = signal(false);
  score           = signal(0);
  finished        = signal(false);
  showExplanation = signal(false);

  currentQuestion = computed<QuizQuestion | null>(
    () => this.filteredQuestions()[this.currentIndex()] ?? null,
  );

  progressPercent = computed(() => {
    const total = this.filteredQuestions().length;
    return total ? Math.round((this.currentIndex() / total) * 100) : 0;
  });

  scorePercent = computed(() => {
    const total = this.filteredQuestions().length;
    return total ? Math.round((this.score() / total) * 100) : 0;
  });

  classification = computed<{ label: string; emoji: string; cls: string }>(() => {
    const total = this.filteredQuestions().length;
    if (total === 0) return { label: 'Sem questões', emoji: '📭', cls: '' };
    const pct = this.score() / total;
    if (pct >= 0.9) return { label: 'Excelente!',          emoji: '🏆', cls: 'class--gold'   };
    if (pct >= 0.7) return { label: 'Muito bom!',          emoji: '🌟', cls: 'class--blue'   };
    if (pct >= 0.5) return { label: 'Bom!',                emoji: '👍', cls: 'class--green'  };
    return             { label: 'Continue praticando!', emoji: '📚', cls: 'class--neutral' };
  });

  selectAnswer(option: string) {
    if (this.answered()) return;
    this.selectedAnswer.set(option);
    this.answered.set(true);
    this.showExplanation.set(false);
    if (option === this.currentQuestion()?.correct_answer) {
      this.score.update(s => s + 1);
    }
  }

  isCorrect(option: string): boolean {
    return option === this.currentQuestion()?.correct_answer;
  }

  toggleExplanation() {
    this.showExplanation.update(v => !v);
  }

  nextQuestion() {
    if (this.currentIndex() + 1 >= this.filteredQuestions().length) {
      this.finished.set(true);
      return;
    }
    this.currentIndex.update(i => i + 1);
    this.selectedAnswer.set(null);
    this.answered.set(false);
    this.showExplanation.set(false);
  }

  restartQuiz() {
    this.currentIndex.set(0);
    this.selectedAnswer.set(null);
    this.answered.set(false);
    this.score.set(0);
    this.finished.set(false);
    this.showExplanation.set(false);
    this.quizStarted.set(false);
  }

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/upload']);
  }

  // ── exportação (US-013) ───────────────────────────────────────────────────
  loadingExport = signal<'kahoot' | 'socrative' | 'scorm' | null>(null);

  exportQuiz(platform: 'kahoot' | 'socrative' | 'scorm') {
    const docId = this.documentId();
    if (!docId) return;
    this.loadingExport.set(platform);

    const ext = platform === 'scorm' ? 'zip' : 'json';
    const obs =
      platform === 'kahoot'    ? this.aiService.exportKahoot(docId)    :
      platform === 'socrative' ? this.aiService.exportSocrative(docId) :
                                 this.aiService.exportScorm(docId);

    obs.subscribe({
      next: blob => {
        this.loadingExport.set(null);
        this.aiService.triggerDownload(blob, `quiz_${platform}_${docId}.${ext}`);
        this.toast.sucesso(`Quiz exportado para ${platform.toUpperCase()} com sucesso!`);
      },
      error: () => {
        this.loadingExport.set(null);
        this.toast.erro(`Erro ao exportar para ${platform.toUpperCase()}. Tente novamente.`);
      },
    });
  }
}
