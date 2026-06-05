import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ResultStore } from '../../../../core/services/result-store';
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

  data = computed(() => this.store.data()?.result as QuizResult | undefined);

  // Estado do quiz
  currentIndex = signal(0);
  selectedAnswer = signal<string | null>(null);
  answered = signal(false);
  score = signal(0);
  finished = signal(false);

  // Controla se a explicação está expandida
  explicacaoExpandida = signal(false);

  questions = computed<QuizQuestion[]>(() => this.data()?.questions ?? []);

  currentQuestion = computed<QuizQuestion | null>(
    () => this.questions()[this.currentIndex()] ?? null,
  );

  // Progresso baseado na questão atual
  progressPercent = computed(() => {
    const total = this.questions().length;
    return total ? Math.round((this.currentIndex() / total) * 100) : 0;
  });

  // Classificação final baseada no score
  classificacao = computed(() => {
    const total = this.questions().length;
    if (!total) return { label: '', icon: 'pi-star', cor: '#356df1' };
    const pct = (this.score() / total) * 100;
    if (pct >= 90) return { label: 'Excelente!',      icon: 'pi-star-fill',  cor: '#f5a623' };
    if (pct >= 70) return { label: 'Muito bom!',      icon: 'pi-thumbs-up',  cor: '#43d477' };
    if (pct >= 50) return { label: 'Bom esforço!',    icon: 'pi-check',      cor: '#356df1' };
    if (pct >= 30) return { label: 'Continue tentando!', icon: 'pi-refresh', cor: '#f97316' };
    return           { label: 'Precisa revisar!',     icon: 'pi-times',      cor: '#e74c3c' };
  });

  // Rótulo do badge de dificuldade
  labelDificuldade(diff?: Difficulty): string {
    if (diff === 'easy')   return 'Fácil';
    if (diff === 'medium') return 'Médio';
    if (diff === 'hard')   return 'Difícil';
    return '';
  }

  // Classe CSS do badge de dificuldade
  classeDificuldade(diff?: Difficulty): string {
    if (diff === 'easy')   return 'badge--easy';
    if (diff === 'medium') return 'badge--medium';
    if (diff === 'hard')   return 'badge--hard';
    return '';
  }

  selectAnswer(option: string) {
    if (this.answered()) return;
    this.selectedAnswer.set(option);
    this.answered.set(true);
    this.explicacaoExpandida.set(false);
    if (option === this.currentQuestion()?.correct_answer) {
      this.score.update(s => s + 1);
    }
  }

  isCorrect(option: string): boolean {
    return option === this.currentQuestion()?.correct_answer;
  }

  // Alterna a visibilidade da explicação
  toggleExplicacao() {
    this.explicacaoExpandida.set(!this.explicacaoExpandida());
  }

  nextQuestion() {
    if (this.currentIndex() + 1 >= this.questions().length) {
      this.finished.set(true);
      return;
    }
    this.currentIndex.update(i => i + 1);
    this.selectedAnswer.set(null);
    this.answered.set(false);
    this.explicacaoExpandida.set(false);
  }

  restartQuiz() {
    this.currentIndex.set(0);
    this.selectedAnswer.set(null);
    this.answered.set(false);
    this.score.set(0);
    this.finished.set(false);
    this.explicacaoExpandida.set(false);
  }

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/upload']);
  }
}