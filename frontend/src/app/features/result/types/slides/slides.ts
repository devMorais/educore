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

  // Índice do slide atual
  slideAtual = signal(0);

  // Controla se as notas estão expandidas
  notasExpandidas = signal(false);

  // Controla se a sugestão visual está expandida
  sugestaoExpandida = signal(false);

  // Loading do download PPTX
  downloadingPptx = signal(false);

  // Slide atual computado
  currentSlide = computed<SlideContent | null>(
    () => this.data()?.slides[this.slideAtual()] ?? null,
  );

  // Total de slides
  totalSlides = computed(() => this.data()?.slides.length ?? 0);

  // Cor de destaque baseada no accent_color do slide
  corDestaque = computed(() => {
    const cor = this.currentSlide()?.accent_color;
    if (cor === 'green')  return '#38a169';
    if (cor === 'orange') return '#f97316';
    if (cor === 'purple') return '#7c3aed';
    return '#356df1';
  });

  // Cor de destaque para cada slide na thumbnail strip
  corDestaqueSlide(slide: SlideContent): string {
    if (slide.accent_color === 'green')  return '#38a169';
    if (slide.accent_color === 'orange') return '#f97316';
    if (slide.accent_color === 'purple') return '#7c3aed';
    return '#356df1';
  }

  // Navega para um slide específico
  irParaSlide(index: number) {
    const total = this.totalSlides();
    if (index < 0 || index >= total) return;
    this.slideAtual.set(index);
    this.notasExpandidas.set(false);
    this.sugestaoExpandida.set(false);
  }

  // Navega para o slide anterior
  anterior() {
    this.irParaSlide(this.slideAtual() - 1);
  }

  // Navega para o próximo slide
  proximo() {
    this.irParaSlide(this.slideAtual() + 1);
  }

  // Navegação por teclado (setas)
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

  // Alterna notas do apresentador
  toggleNotas() {
    this.notasExpandidas.set(!this.notasExpandidas());
  }

  // Alterna sugestão visual
  toggleSugestao() {
    this.sugestaoExpandida.set(!this.sugestaoExpandida());
  }

  // Download do PPTX
  downloadPptx() {
    const docId = this.documentId();
    if (!docId) return;
    this.downloadingPptx.set(true);
    this.aiService.downloadPptx(docId).subscribe({
      next: blob => {
        this.downloadingPptx.set(false);
        this.aiService.triggerDownload(blob, `apresentacao_educore_${docId}.pptx`);
        this.toast.sucesso('Apresentação exportada com sucesso!', 'Download PPTX');
      },
      error: () => {
        this.downloadingPptx.set(false);
        this.toast.erro('Erro ao exportar PPTX. Tente novamente.', 'Erro');
      },
    });
  }

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/upload']);
  }
}