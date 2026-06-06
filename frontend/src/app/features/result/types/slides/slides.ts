import { Component, computed, inject, signal, HostListener } from '@angular/core';
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
  private store  = inject(ResultStore);
  private router = inject(Router);
  private aiService = inject(AiService);
  private toast = inject(ToastService);

  data       = computed(() => this.store.data()?.result as SlidesResult | undefined);
  documentId = computed(() => this.store.data()?.documentId ?? null);

  // ── navegação (US-015) ────────────────────────────────────────────────────
  activeIndex     = signal(0);
  showNotes       = signal(false);
  downloadingPptx = signal(false);

  activeSlide = computed<SlideContent | null>(
    () => this.data()?.slides[this.activeIndex()] ?? null,
  );

  slideCount = computed(() => this.data()?.slides.length ?? 0);

  goToSlide(i: number) {
    const max = this.slideCount() - 1;
    this.activeIndex.set(Math.max(0, Math.min(i, max)));
    this.showNotes.set(false);
  }

  prevSlide() { this.goToSlide(this.activeIndex() - 1); }
  nextSlide() { this.goToSlide(this.activeIndex() + 1); }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (!this.data()) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.prevSlide();
    }
  }

  // ── download PPTX (US-016) ────────────────────────────────────────────────
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
        this.toast.sucesso(`"${filename}" baixado com sucesso!`, 'Download concluído');
      },
      error: err => {
        this.downloadingPptx.set(false);
        const msg = err?.error?.detail ?? err?.message ?? 'Erro ao gerar o arquivo PowerPoint.';
        this.toast.erro(msg, 'Erro no download');
      },
    });
  }

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/upload']);
  }
}
