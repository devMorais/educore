import {
  Component, computed, inject, signal,
  ElementRef, ViewChild, AfterViewInit, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { ResultStore } from '../../../../core/services/result-store';
import { ToastService } from '../../../../core/services/toast';
import type { MindMapResult, MindMapNode } from '../../../../core/models/content.models';

@Component({
  selector: 'app-mindmap',
  imports: [NgTemplateOutlet],
  templateUrl: './mindmap.html',
  styleUrl: './mindmap.scss',
})
export class Mindmap implements AfterViewInit {
  @ViewChild('mapaRef') mapaRef!: ElementRef<HTMLDivElement>;
  @ViewChild('containerRef') containerRef!: ElementRef<HTMLDivElement>;

  private store      = inject(ResultStore);
  private router     = inject(Router);
  private toast      = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  data = computed(() => this.store.data()?.result as MindMapResult | undefined);

  // Zoom e pan
  zoom       = signal(1);
  panX       = signal(0);
  panY       = signal(0);
  arrastando = signal(false);

  // Nós colapsados (set de ids)
  colapsados = signal<Set<string>>(new Set());

  // Exportando imagem
  exportando = signal(false);

  // Controle de arraste
  private lastX = 0;
  private lastY = 0;

  // Cores por nível
  readonly cores = [
    '#356df1', // nível 0 — raiz
    '#7c3aed', // nível 1
    '#059669', // nível 2
    '#d97706', // nível 3
    '#dc2626', // nível 4+
  ];

  corNivel(nivel: number): string {
    return this.cores[Math.min(nivel, this.cores.length - 1)];
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.configurarEventos();
    }
  }

  private configurarEventos() {
    const container = this.containerRef?.nativeElement;
    if (!container) return;

    // Scroll para zoom
    container.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      this.ajustarZoom(delta);
    }, { passive: false });

    // Touch para pan e zoom em mobile
    let lastTouchDist = 0;
    container.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      } else if (e.touches.length === 1) {
        this.lastX = e.touches[0].clientX;
        this.lastY = e.touches[0].clientY;
        this.arrastando.set(true);
      }
    });

    container.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = (dist - lastTouchDist) * 0.005;
        this.ajustarZoom(delta);
        lastTouchDist = dist;
      } else if (e.touches.length === 1 && this.arrastando()) {
        const dx = e.touches[0].clientX - this.lastX;
        const dy = e.touches[0].clientY - this.lastY;
        this.panX.update(x => x + dx);
        this.panY.update(y => y + dy);
        this.lastX = e.touches[0].clientX;
        this.lastY = e.touches[0].clientY;
      }
    }, { passive: false });

    container.addEventListener('touchend', () => {
      this.arrastando.set(false);
    });
  }

  // Ajusta o zoom dentro dos limites
  ajustarZoom(delta: number) {
    const novoZoom = Math.min(3, Math.max(0.3, this.zoom() + delta));
    this.zoom.set(Math.round(novoZoom * 10) / 10);
  }

  // Zoom in
  zoomIn() { this.ajustarZoom(0.2); }

  // Zoom out
  zoomOut() { this.ajustarZoom(-0.2); }

  // Centraliza o mapa
  centralizar() {
    this.zoom.set(1);
    this.panX.set(0);
    this.panY.set(0);
  }

  // Inicia o arraste com mouse
  iniciarArraste(event: MouseEvent) {
    if (this.zoom() <= 1) return;
    this.arrastando.set(true);
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  // Move durante o arraste
  moverArraste(event: MouseEvent) {
    if (!this.arrastando()) return;
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.panX.update(x => x + dx);
    this.panY.update(y => y + dy);
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  // Para o arraste
  pararArraste() {
    this.arrastando.set(false);
  }

  // Expande/colapsa um nó
  toggleNo(id: string) {
    const atual = new Set(this.colapsados());
    if (atual.has(id)) {
      atual.delete(id);
    } else {
      atual.add(id);
    }
    this.colapsados.set(atual);
  }

  // Verifica se um nó está colapsado
  estaColapsado(id: string): boolean {
    return this.colapsados().has(id);
  }

  // Exporta o mapa como PNG
  async exportarPng() {
    if (!isPlatformBrowser(this.platformId)) return;
    const mapa = this.mapaRef?.nativeElement;
    if (!mapa) return;

    this.exportando.set(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(mapa, {
        backgroundColor: '#f8f9fc',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `mapa_mental_educore.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      this.toast.sucesso('Mapa mental exportado como PNG!', 'Exportado!');
    } catch {
      this.toast.erro('Erro ao exportar imagem. Tente novamente.', 'Erro');
    } finally {
      this.exportando.set(false);
    }
  }

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/upload']);
  }
}