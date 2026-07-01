import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { Tema } from '../types/theme';

const STORAGE_KEY = 'educore_tema';
const CLASSE_TEMA_CLARO = 'tema-claro';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);

  readonly tema = signal<Tema>(this.carregarTema());

  constructor() {
    this.aplicar(this.tema());
  }

  alternar(): void {
    this.definir(this.tema() === 'escuro' ? 'claro' : 'escuro');
  }

  definir(tema: Tema): void {
    this.tema.set(tema);
    this.aplicar(tema);
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEY, tema);
    }
  }

  private aplicar(tema: Tema): void {
    if (!this.isBrowser()) return;
    document.documentElement.classList.toggle(CLASSE_TEMA_CLARO, tema === 'claro');
  }

  private carregarTema(): Tema {
    if (!this.isBrowser()) return 'escuro';
    const salvo = localStorage.getItem(STORAGE_KEY);
    return salvo === 'claro' ? 'claro' : 'escuro';
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
