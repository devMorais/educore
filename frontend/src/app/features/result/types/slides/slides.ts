import { Component, computed, inject, signal, HostListener, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ResultStore } from '../../../../core/services/result-store';
import { AiService } from '../../../../core/services/ai';
import { ToastService } from '../../../../core/services/toast';
import type { SlidesResult, SlideContent } from '../../../../core/models/content.models';

@Component({
  selector: 'app-slides',
  imports: [],
  templateUrl: './slides.html',
  styleUrl: './slides.scss',
})
export class Slides {
  private store      = inject(ResultStore);
  private router     = inject(Router);
  private aiService  = inject(AiService);
  private toast      = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  data       = computed(() => this.store.data()?.result as SlidesResult | undefined);
  documentId = computed(() => this.store.data()?.documentId ?? null);

  // ── navegação (US-015) ────────────────────────────────────────────────────
  slideAtual       = signal(0);
  notasExpandidas  = signal(false);
  sugestaoExpandida = signal(false);
  downloadingPptx  = signal(false);

  currentSlide = computed<SlideContent | null>(
    () => this.data()?.slides[this.slideAtual()] ?? null,
  );

  totalSlides = computed(() => this.data()?.slides.length ?? 0);

  corDestaque = computed(() => {
    const cor = this.currentSlide()?.accent_color;
    if (cor === 'green')  return '#38a169';
    if (cor === 'orange') return '#f97316';
    if (cor === 'purple') return '#7c3aed';
    return '#356df1';
  });

  corDestaqueSlide(slide: SlideContent): string {
    if (slide.accent_color === 'green')  return '#38a169';
    if (slide.accent_color === 'orange') return '#f97316';
    if (slide.accent_color === 'purple') return '#7c3aed';
    return '#356df1';
  }

  irParaSlide(index: number) {
    const total = this.totalSlides();
    if (index < 0 || index >= total) return;
    this.slideAtual.set(index);
    this.notasExpandidas.set(false);
    this.sugestaoExpandida.set(false);
  }

  anterior() { this.irParaSlide(this.slideAtual() - 1); }
  proximo()  { this.irParaSlide(this.slideAtual() + 1); }

  toggleNotas()    { this.notasExpandidas.set(!this.notasExpandidas()); }
  toggleSugestao() { this.sugestaoExpandida.set(!this.sugestaoExpandida()); }

  // navegação por teclado — SSR-safe
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!isPlatformBrowser(this.platformId)) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.proximo();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.anterior();
    }
  }

  // ── download PPTX (US-016) com filename sanitizado ───────────────────────
  downloadPptx() {
    const docId = this.documentId();
    if (!docId) return;
    this.downloadingPptx.set(true);

    const rawTitle = this.data()?.title ?? 'apresentacao';
    const filename = rawTitle
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
      + '.pptx';

    this.aiService.downloadPptx(docId).subscribe({
      next: blob => {
        this.downloadingPptx.set(false);
        this.aiService.triggerDownload(blob, filename);
        this.toast.sucesso(`"${filename}" exportado com sucesso!`, 'Download PPTX');
      },
      error: err => {
        this.downloadingPptx.set(false);
        const msg = err?.error?.detail ?? 'Erro ao exportar a apresentação. Tente novamente.';
        this.toast.erro(msg, 'Erro no download');
      },
    });
  }

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/upload']);
  }
}
