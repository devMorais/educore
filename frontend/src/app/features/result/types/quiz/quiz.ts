import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ResultStore } from '../../../../core/services/result-store';
import { AiService } from '../../../../core/services/ai';
import { ToastService } from '../../../../core/services/toast';
import type { QuizResult, QuizQuestion, Difficulty } from '../../../../core/models/content.models';

type FiltroNivel = 'todas' | 'easy' | 'medium' | 'hard';
type FormatoExport = 'kahoot' | 'socrative' | 'scorm';

@Component({
  selector: 'app-quiz',
  imports: [],
  templateUrl: './quiz.html',
  styleUrl: './quiz.scss',
})
export class Quiz {
  private store     = inject(ResultStore);
  private router    = inject(Router);
  private aiService = inject(AiService);
  private toast     = inject(ToastService);

  data       = computed(() => this.store.data()?.result as QuizResult | undefined);
  documentId = computed(() => this.store.data()?.documentId ?? null);

  // ── estado do quiz ────────────────────────────────────────────────────────
  currentIndex        = signal(0);
  selectedAnswer      = signal<string | null>(null);
  answered            = signal(false);
  score               = signal(0);
  finished            = signal(false);
  explicacaoExpandida = signal(false);

  // ── filtro de dificuldade (US-012) ────────────────────────────────────────
  filtroAtivo  = signal<FiltroNivel>('todas');
  quizIniciado = signal(false);

  questions = computed<QuizQuestion[]>(() => this.data()?.questions ?? []);

  questoesFiltradas = computed<QuizQuestion[]>(() => {
    const f = this.filtroAtivo();
    const todas = this.questions();
    return f === 'todas' ? todas : todas.filter(q => q.difficulty === f);
  });

  currentQuestion = computed<QuizQuestion | null>(
    () => this.questoesFiltradas()[this.currentIndex()] ?? null,
  );

  progressPercent = computed(() => {
    const total = this.questoesFiltradas().length;
    return total ? Math.round((this.currentIndex() / total) * 100) : 0;
  });

  contadorNivel = computed(() => {
    const todas = this.questions();
    return {
      todas:  todas.length,
      easy:   todas.filter(q => q.difficulty === 'easy').length,
      medium: todas.filter(q => q.difficulty === 'medium').length,
      hard:   todas.filter(q => q.difficulty === 'hard').length,
    };
  });

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

  readonly chips: { valor: FiltroNivel; label: string; classe: string }[] = [
    { valor: 'todas',  label: 'Todas',   classe: 'chip--todas'  },
    { valor: 'easy',   label: 'Fácil',   classe: 'chip--easy'   },
    { valor: 'medium', label: 'Médio',   classe: 'chip--medium' },
    { valor: 'hard',   label: 'Difícil', classe: 'chip--hard'   },
  ];

  // ── exportação (US-013) ───────────────────────────────────────────────────
  exportandoKahoot    = signal(false);
  exportandoSocrative = signal(false);
  exportandoScorm     = signal(false);

  readonly botoesExport = [
    { formato: 'kahoot'    as FormatoExport, label: 'Kahoot',    icon: 'pi-play-circle',    cor: 'export--kahoot',    desc: 'Download JSON' },
    { formato: 'socrative' as FormatoExport, label: 'Socrative', icon: 'pi-chart-bar',      cor: 'export--socrative', desc: 'Download JSON' },
    { formato: 'scorm'     as FormatoExport, label: 'SCORM 1.2', icon: 'pi-graduation-cap', cor: 'export--scorm',     desc: 'Download ZIP'  },
  ];

  exportandoAlgum = computed(() =>
    this.exportandoKahoot() || this.exportandoSocrative() || this.exportandoScorm()
  );

  estaExportando(formato: FormatoExport): boolean {
    if (formato === 'kahoot')    return this.exportandoKahoot();
    if (formato === 'socrative') return this.exportandoSocrative();
    return this.exportandoScorm();
  }

  private pararLoading(formato: FormatoExport) {
    if (formato === 'kahoot')    this.exportandoKahoot.set(false);
    if (formato === 'socrative') this.exportandoSocrative.set(false);
    if (formato === 'scorm')     this.exportandoScorm.set(false);
  }

  exportar(formato: FormatoExport) {
    const docId = this.documentId();
    if (!docId) return;
    if (formato === 'kahoot')    this.exportandoKahoot.set(true);
    if (formato === 'socrative') this.exportandoSocrative.set(true);
    if (formato === 'scorm')     this.exportandoScorm.set(true);

    const ext = formato === 'scorm' ? '.zip' : '.json';
    const obs =
      formato === 'kahoot'    ? this.aiService.exportKahoot(docId) :
      formato === 'socrative' ? this.aiService.exportSocrative(docId) :
                                this.aiService.exportScorm(docId);

    obs.subscribe({
      next: blob => {
        this.pararLoading(formato);
        this.aiService.triggerDownload(blob, `educore_${formato}_${docId}${ext}`);
        this.toast.sucesso(`Quiz exportado com sucesso para ${formato.toUpperCase()}!`, 'Download iniciado');
      },
      error: (err: HttpErrorResponse) => {
        this.pararLoading(formato);
        this.toast.erro(err.error?.detail ?? `Erro ao exportar para ${formato}. Tente novamente.`, 'Erro na exportação');
      },
    });
  }

  // ── helpers ───────────────────────────────────────────────────────────────
  labelDificuldade(diff?: Difficulty): string {
    if (diff === 'easy')   return 'Fácil';
    if (diff === 'medium') return 'Médio';
    if (diff === 'hard')   return 'Difícil';
    return '';
  }

  classeDificuldade(diff?: Difficulty): string {
    if (diff === 'easy')   return 'badge--easy';
    if (diff === 'medium') return 'badge--medium';
    if (diff === 'hard')   return 'badge--hard';
    return '';
  }

  selecionarFiltro(filtro: FiltroNivel) { this.filtroAtivo.set(filtro); }

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

  isCorrect(option: string): boolean { return option === this.currentQuestion()?.correct_answer; }

  toggleExplicacao() { this.explicacaoExpandida.set(!this.explicacaoExpandida()); }

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
