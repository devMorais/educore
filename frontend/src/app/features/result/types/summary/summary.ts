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

  copying = signal(false);

  async copyToClipboard() {
    const text = [
      this.data()?.title ?? '',
      '',
      this.data()?.summary ?? '',
      '',
      'Pontos-Chave:',
      ...(this.data()?.key_points ?? []).map(p => `• ${p}`),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      this.copying.set(true);
      this.toast.sucesso('Resumo copiado para a área de transferência!', 'Copiado');
      setTimeout(() => this.copying.set(false), 2000);
    } catch {
      this.toast.erro('Não foi possível copiar. Tente selecionar o texto manualmente.');
    }
  }

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/upload']);
  }
}
