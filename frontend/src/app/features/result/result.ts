import { Component, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

@Component({
  selector: 'app-result',
  imports: [RouterLink],
  templateUrl: './result.html',
  styleUrl: './result.scss'
})
export class Result {
  type = signal<string>('');
  data = signal<any>(null);

  // ---- estado do quiz ----
  currentIndex = signal(0);
  selectedAnswer = signal<string | null>(null);
  answered = signal(false);
  score = signal(0);
  finished = signal(false);

  questions = computed<QuizQuestion[]>(() => this.data()?.questions ?? []);
  currentQuestion = computed<QuizQuestion | null>(
    () => this.questions()[this.currentIndex()] ?? null
  );
  progressPercent = computed(() => {
    const total = this.questions().length;
    return total ? Math.round((this.currentIndex() / total) * 100) : 0;
  });

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { result: any; type: string } | undefined;
    const result = state?.result ?? history.state?.result ?? null;
    const type = state?.type ?? history.state?.type ?? '';
    this.data.set(result);
    this.type.set(type);
  }

  // ---- resumo ----
  get summaryParagraphs(): string[] {
    const s = this.data()?.summary ?? '';
    return s.split('\n\n').filter((p: string) => p.trim().length > 0);
  }

  // ---- quiz: jogar ----
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
}