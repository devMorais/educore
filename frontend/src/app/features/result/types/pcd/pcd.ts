import {
  Component, computed, inject, signal,
  PLATFORM_ID, OnDestroy
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ResultStore } from '../../../../core/services/result-store';
import { ToastService } from '../../../../core/services/toast';
import type { AccessibilityResult } from '../../../../core/models/content.models';

// Abas disponíveis
type PcdTab = 'simplified' | 'audio' | 'vocabulary' | 'libras';

// Status da reprodução de áudio
type AudioStatus = 'parado' | 'reproduzindo' | 'pausado';

@Component({
  selector: 'app-pcd',
  imports: [],
  templateUrl: './pcd.html',
  styleUrl: './pcd.scss',
})
export class Pcd implements OnDestroy {
  private store      = inject(ResultStore);
  private router     = inject(Router);
  private toast      = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  data = computed(() => this.store.data()?.result as AccessibilityResult | undefined);

  // Aba ativa
  pcdTab = signal<PcdTab>('simplified');

  // Estado do áudio
  audioStatus   = signal<AudioStatus>('parado');
  velocidade    = signal<number>(1);

  // Instância do SpeechSynthesis
  private utterance: SpeechSynthesisUtterance | null = null;

  // Opções de velocidade disponíveis
  readonly opcoesVelocidade = [
    { label: '0.5x', valor: 0.5 },
    { label: '1x',   valor: 1   },
    { label: '1.5x', valor: 1.5 },
    { label: '2x',   valor: 2   },
  ];

  // Abas de navegação
  readonly abas: { id: PcdTab; label: string; icon: string }[] = [
    { id: 'simplified', label: 'Texto Simplificado', icon: 'pi-file-edit'    },
    { id: 'audio',      label: 'Áudio',              icon: 'pi-volume-up'    },
    { id: 'vocabulary', label: 'Vocabulário',         icon: 'pi-book'         },
    { id: 'libras',     label: 'LIBRAS',              icon: 'pi-hand-pointer' },
  ];

  // Muda a aba ativa e para o áudio se estiver tocando
  setPcdTab(tab: PcdTab) {
    this.pcdTab.set(tab);
    if (tab !== 'audio') this.pararAudio();
  }

  // Reproduz o texto via Web Speech API
  reproduzir() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!('speechSynthesis' in window)) {
      this.toast.aviso('Seu navegador não suporta síntese de voz.', 'Não suportado');
      return;
    }

    const texto = this.data()?.audio_script ?? this.data()?.simplified_text ?? '';
    if (!texto) return;

    // Para qualquer fala anterior
    window.speechSynthesis.cancel();

    // Cria nova utterance
    this.utterance = new SpeechSynthesisUtterance(texto);
    this.utterance.lang  = 'pt-BR';
    this.utterance.rate  = this.velocidade();
    this.utterance.pitch = 1;

    this.utterance.onstart = () => this.audioStatus.set('reproduzindo');
    this.utterance.onend   = () => this.audioStatus.set('parado');
    this.utterance.onerror = () => this.audioStatus.set('parado');

    window.speechSynthesis.speak(this.utterance);
    this.audioStatus.set('reproduzindo');
  }

  // Pausa a reprodução
  pausar() {
    if (!isPlatformBrowser(this.platformId)) return;
    window.speechSynthesis.pause();
    this.audioStatus.set('pausado');
  }

  // Retoma a reprodução pausada
  retomar() {
    if (!isPlatformBrowser(this.platformId)) return;
    window.speechSynthesis.resume();
    this.audioStatus.set('reproduzindo');
  }

  // Para completamente a reprodução
  pararAudio() {
    if (!isPlatformBrowser(this.platformId)) return;
    window.speechSynthesis.cancel();
    this.audioStatus.set('parado');
    this.utterance = null;
  }

  // Altera a velocidade e reinicia se estiver reproduzindo
  alterarVelocidade(vel: number) {
    this.velocidade.set(vel);
    if (this.audioStatus() === 'reproduzindo') {
      this.reproduzir();
    }
  }

  // Copia texto para a área de transferência
  copyText(text: string) {
    if (isPlatformBrowser(this.platformId)) {
      navigator.clipboard.writeText(text).then(() => {
        this.toast.sucesso('Texto copiado!', 'Copiado');
      });
    }
  }

  // Retorna a cor do score de complexidade WCAG
  corComplexidade(score: number): string {
    if (score <= 3)  return '#22c55e'; // fácil
    if (score <= 6)  return '#f59e0b'; // médio
    return '#ef4444';                   // difícil
  }

  // Limpa o áudio ao destruir o componente
  ngOnDestroy() {
    this.pararAudio();
  }

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/upload']);
  }
}