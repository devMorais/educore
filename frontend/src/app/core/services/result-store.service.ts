import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { StoredResult } from '../types/result-store';

const STORAGE_KEY = 'educore_result';

@Injectable({ providedIn: 'root' })
export class ResultStore {
  private platformId = inject(PLATFORM_ID);

  // estado central — quem mexe aqui reflete em todas as telas
  private _data = signal<StoredResult | null>(this.load());
  readonly data = this._data.asReadonly();

  /** Guarda o resultado gerado (chamado pelo upload) */
  set(stored: StoredResult) {
    this._data.set(stored);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  }

  /** Limpa tudo (chamado ao voltar pro upload) */
  clear() {
    this._data.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /** Lê do localStorage (usado no F5 / recarregar a página) */
  private load(): StoredResult | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}