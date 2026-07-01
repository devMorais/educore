 import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ResultStore } from './result-store.service';
import {
  MOCK_QUIZ,
  MOCK_SUMMARY,
  MOCK_SLIDES,
  MOCK_MINDMAP,
  MOCK_FLASHCARDS,
  MOCK_PCD,
} from '../mock-data';
import type { GenerationType } from '../types/content';

// Mapa de mocks por tipo de geração
const MOCK_MAP = {
  quiz: MOCK_QUIZ,
  summary: MOCK_SUMMARY,
  slides: MOCK_SLIDES,
  mindmap: MOCK_MINDMAP,
  flashcards: MOCK_FLASHCARDS,
  pcd: MOCK_PCD,
} as const;

@Injectable({ providedIn: 'root' })
export class DemoService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private resultStore = inject(ResultStore);

  // sinal reativo — controla se o modo demo está ativo
  readonly isDemo = signal<boolean>(this.loadDemoState());

  /** Ativa o modo demo e redireciona para /painel */
  enter(): void {
    this.isDemo.set(true);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('educore_demo', 'true');
    }
    this.router.navigate(['/painel']);
  }

  /** Desativa o modo demo e limpa os dados */
  exit(): void {
    this.isDemo.set(false);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('educore_demo');
    }
    this.resultStore.clear();
    this.router.navigate(['/']);
  }

  /** Carrega o mock do tipo solicitado no ResultStore */
  loadMock(type: GenerationType): void {
    const result = MOCK_MAP[type];
    this.resultStore.set({
      result,
      type,
      documentId: undefined,
    });
  }

  /** Lê o estado do modo demo no sessionStorage */
  private loadDemoState(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return sessionStorage.getItem('educore_demo') === 'true';
  }
}
