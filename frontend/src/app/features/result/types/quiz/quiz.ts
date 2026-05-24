import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ResultStore } from '../../../../core/services/result-store';
import type { QuizResult, QuizQuestion } from '../../../../core/models/content.models';

@Component({
  selector: 'app-quiz',
  imports: [],
  templateUrl: './quiz.html',
  styleUrl: './quiz.scss',
})
export class Quiz {
  private store = inject(ResultStore);
  private router = inject(Router);

  data = computed(() => this.store.data()?.result as QuizResult | undefined);

  // ---- estado do quiz (agora mora aqui, isolado) ----
  currentIndex = signal(0);
  selectedAnswer = signal<string | null>(null);
  answered = signal(false);
  score = signal(0);
  finished = signal(false);

  questions = computed<QuizQuestion[]>(() => this.data()?.questions ?? []);
  currentQuestion = computed<QuizQuestion | null>(
    () => this.questions()[this.currentIndex()] ?? null,
  );
  progressPercent = computed(() => {
    const total = this.questions().length;
    return total ? Math.round((this.currentIndex() / total) * 100) : 0;
  });

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

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/upload']);
  }
}