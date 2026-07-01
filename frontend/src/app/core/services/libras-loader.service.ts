 import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { LibrasVideo, LibrasProviderConfig } from '../types/content';
import type { VLibrasGlobal, HandTalkConstructor, HandTalkInstance } from '../types/libras';

// Declarações globais para os SDKs de terceiros (US-027)
declare global {
  interface Window {
    VLibras?: VLibrasGlobal;
    HT?: HandTalkConstructor;
  }
}

/**
 * LibrasLoaderService (US-027)
 * Carrega 1x o script do provedor LIBRAS (VLibras ou Hand Talk)
 * com base no config vindo do backend (BS-015).
 * SSR-safe: nunca toca window/document no servidor.
 */
@Injectable({ providedIn: 'root' })
export class LibrasLoaderService {
  private platformId = inject(PLATFORM_ID);

  // Controla se o script já foi injetado (idempotência)
  private carregado = false;
  private provedor: 'vlibras' | 'handtalk' | null = null;

  /**
   * Carrega o provedor com base no primeiro item de libras_videos.
   * Se a lista estiver vazia ou undefined, não faz nada.
   */
  carregarProvedor(videos: LibrasVideo[] | undefined): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!videos || videos.length === 0) return;
    if (this.carregado) return;

    const video = videos[0];
    this.provedor = video.provider;

    if (video.provider === 'vlibras') {
      this.carregarVLibras(video.config);
    } else if (video.provider === 'handtalk') {
      this.carregarHandTalk(video.config);
    }
  }

  /**
   * Dispara a tradução de um texto pelo provedor ativo.
   * vlibras: seleciona o texto no elemento e abre o widget.
   * handtalk: usa a API do SDK Hugo.
   */
  traduzir(text: string, elementoRef?: HTMLElement): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.provedor === 'vlibras') {
      this.traduzirVLibras(text, elementoRef);
    } else if (this.provedor === 'handtalk') {
      this.traduzirHandTalk(text);
    }
  }

  // ── VLibras ────────────────────────────────────────────────────────────────

  private carregarVLibras(config: LibrasProviderConfig): void {
    // Cria o markup padrão do widget VLibras no body
    if (!document.querySelector('[vw]')) {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('vw', '');
      wrapper.classList.add('enabled');
      wrapper.innerHTML = `
        <div vw-access-button class="active"></div>
        <div vw-plugin-wrapper>
          <div class="vw-plugin-top-wrapper"></div>
        </div>
      `;
      document.body.appendChild(wrapper);
    }

    // Injeta o script do VLibras
    const pluginUrl = config.plugin_url ?? 'https://vlibras.gov.br/app/vlibras-plugin.js';
    const appUrl    = config.app_url    ?? 'https://vlibras.gov.br/app';

    const script = document.createElement('script');
    script.src = pluginUrl;
    script.onload = () => {
      if (window.VLibras) {
        new window.VLibras.Widget(appUrl);
      }
    };
    document.head.appendChild(script);
    this.carregado = true;
  }

  private traduzirVLibras(text: string, elementoRef?: HTMLElement): void {
    // Tenta selecionar o texto no elemento para o widget capturar
    const el = elementoRef ?? document.body;
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } catch {
      // Fallback silencioso — o usuário pode selecionar manualmente
    }

    // Tenta abrir/ativar o widget VLibras programaticamente
    const btn = document.querySelector('[vw-access-button]') as HTMLElement | null;
    if (btn) btn.click();
  }

  // ── Hand Talk ──────────────────────────────────────────────────────────────

  private htInstance: HandTalkInstance | null = null;

  private carregarHandTalk(config: LibrasProviderConfig): void {
    const pluginUrl = config.plugin_url ?? 'https://api.handtalk.me/plugin/latest/handtalk.min.js';
    const token     = config.token ?? '';

    const script = document.createElement('script');
    script.src = pluginUrl;
    script.onload = () => {
      if (window.HT) {
        this.htInstance = new window.HT({
          token,
          align: 'right',
          side: 'right',
        });
      }
    };
    document.head.appendChild(script);
    this.carregado = true;
  }

  private traduzirHandTalk(text: string): void {
    if (this.htInstance && typeof this.htInstance.translate === 'function') {
      // Limita a 1000 chars conforme especificado no backend
      this.htInstance.translate(text.slice(0, 1000));
    }
  }

  /**
   * Limpa o estado ao sair da tela PCD (evita listeners órfãos).
   * Chamado no ngOnDestroy do componente.
   */
  limpar(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Remove seleção ativa
    window.getSelection()?.removeAllRanges();
  }
}
