import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ResultStore } from '../../../../core/services/result-store';
import { ToastService } from '../../../../core/services/toast';
import type { SummaryResult } from '../../../../core/models/content.models';

@Component({
  selector: 'app-summary',
  imports: [],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private store = inject(ResultStore);
  private router = inject(Router);
  private toast = inject(ToastService);

  data = computed(() => this.store.data()?.result as SummaryResult | undefined);

  paragraphs = computed<string[]>(() => {
    const s = this.data()?.summary ?? '';
    return s.split('\n\n').filter(p => p.trim().length > 0);
  });

  copiando = signal(false);

  async copiarResumo() {
    const data = this.data();
    if (!data) return;

    const texto = [
      data.title,
      '',
      data.summary,
      '',
      'Pontos-Chave:',
      ...data.key_points.map(p => `• ${p}`),
    ].join('\n');

    try {
      this.copiando.set(true);
      await navigator.clipboard.writeText(texto);
      this.toast.sucesso('Resumo copiado para a área de transferência!', 'Copiado!');
    } catch {
      this.toast.erro('Não foi possível copiar o resumo.', 'Erro');
    } finally {
      this.copiando.set(false);
    }
  }

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/upload']);
  }
}
