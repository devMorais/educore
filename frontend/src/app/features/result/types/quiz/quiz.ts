import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ResultStore } from '../../../../core/services/result-store';
import type { QuizResult, QuizQuestion, Difficulty } from '../../../../core/models/content.models';

// Tipo para os filtros de dificuldade
type FiltroNivel = 'todas' | 'easy' | 'medium' | 'hard';

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
  explicacaoExpandida = signal(false);

  // Filtro de dificuldade — começa na tela inicial antes de começar
  filtroAtivo = signal<FiltroNivel>('todas');
  quizIniciado = signal(false);

  // Todas as questões do quiz
  questions = computed<QuizQuestion[]>(() => this.data()?.questions ?? []);

  // Questões filtradas pelo nível selecionado
  questoesFiltradas = computed<QuizQuestion[]>(() => {
    const filtro = this.filtroAtivo();
    const todas = this.questions();
    if (filtro === 'todas') return todas;
    return todas.filter(q => q.difficulty === filtro);
  });

  // Questão atual dentro do filtro
  currentQuestion = computed<QuizQuestion | null>(
    () => this.questoesFiltradas()[this.currentIndex()] ?? null,
  );

  // Progresso baseado nas questões filtradas
  progressPercent = computed(() => {
    const total = this.questoesFiltradas().length;
    return total ? Math.round((this.currentIndex() / total) * 100) : 0;
  });

  // Contadores por nível para exibir nos chips
  contadorNivel = computed(() => {
    const todas = this.questions();
    return {
      todas:  todas.length,
      easy:   todas.filter(q => q.difficulty === 'easy').length,
      medium: todas.filter(q => q.difficulty === 'medium').length,
      hard:   todas.filter(q => q.difficulty === 'hard').length,
    };
  });

  // Classificação final baseada no score
  classificacao = computed(() => {
    const total = this.questoesFiltradas().length;
    if (!total) return { label: '', icon: 'pi-star', cor: '#356df1' };
    const pct = (this.score() / total) * 100;
    if (pct >= 90) return { label: 'Excelente!',         icon: 'pi-star-fill', cor: '#f5a623' };
    if (pct >= 70) return { label: 'Muito bom!',         icon: 'pi-thumbs-up', cor: '#43d477' };
    if (pct >= 50) return { label: 'Bom esforço!',       icon: 'pi-check',     cor: '#356df1' };
    if (pct >= 30) return { label: 'Continue tentando!', icon: 'pi-refresh',   cor: '#f97316' };
    return           { label: 'Precisa revisar!',        icon: 'pi-times',     cor: '#e74c3c' };
  });

  // Chips de filtro disponíveis
  readonly chips: { valor: FiltroNivel; label: string; classe: string }[] = [
    { valor: 'todas',  label: 'Todas',   classe: 'chip--todas'  },
    { valor: 'easy',   label: 'Fácil',   classe: 'chip--easy'   },
    { valor: 'medium', label: 'Médio',   classe: 'chip--medium' },
    { valor: 'hard',   label: 'Difícil', classe: 'chip--hard'   },
  ];

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

  // Seleciona o filtro e reseta o quiz
  selecionarFiltro(filtro: FiltroNivel) {
    this.filtroAtivo.set(filtro);
  }

  // Inicia o quiz com o filtro selecionado
  iniciarQuiz() {
    this.currentIndex.set(0);
    this.selectedAnswer.set(null);
    this.answered.set(false);
    this.score.set(0);
    this.finished.set(false);
    this.explicacaoExpandida.set(false);
    this.quizIniciado.set(true);
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

  toggleExplicacao() {
    this.explicacaoExpandida.set(!this.explicacaoExpandida());
  }

  nextQuestion() {
    if (this.currentIndex() + 1 >= this.questoesFiltradas().length) {
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
    this.quizIniciado.set(false);
  }

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/upload']);
  }
}