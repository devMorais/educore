import {
  Component, computed, inject, signal,
  PLATFORM_ID, OnDestroy, OnInit, ElementRef, ViewChildren, QueryList
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ResultStore } from '../../../../core/services/result-store.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LibrasLoaderService } from '../../../../core/services/libras-loader.service';
import type { AccessibilityResult, LibrasVideo } from '../../../../core/types/content';

// Abas disponíveis
type PcdTab = 'simplified' | 'audio' | 'vocabulary' | 'libras';

// Status da reprodução de áudio
type AudioStatus = 'parado' | 'reproduzindo' | 'pausado';

// Agrupamento de cards LIBRAS por source
interface LibrasGrupo {
  label: string;
  icon: string;
  items: LibrasVideo[];
}

@Component({
  selector: 'app-pcd',
  imports: [],
  templateUrl: './pcd.html',
  styleUrl: './pcd.scss',
})
export class Pcd implements OnInit, OnDestroy {
  private store        = inject(ResultStore);
  private router       = inject(Router);
  private toast        = inject(ToastService);
  private platformId   = inject(PLATFORM_ID);
  readonly librasLoader = inject(LibrasLoaderService);

  data = computed(() => this.store.data()?.result as AccessibilityResult | undefined);

  // Aba ativa
  pcdTab = signal<PcdTab>('simplified');

  // Estado do áudio
  audioStatus = signal<AudioStatus>('parado');
  velocidade  = signal<number>(1);

  // Estado de carregamento do script LIBRAS
  librasCarregando = signal(false);

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

  // Computed: agrupa libras_videos por source
  librasGrupos = computed<LibrasGrupo[]>(() => {
    const videos = this.data()?.libras_videos ?? [];
    if (!videos.length) return [];

    const mapaLabels: Record<string, { label: string; icon: string }> = {
      title:      { label: 'Título',      icon: 'pi-bookmark'   },
      vocabulary: { label: 'Vocabulário', icon: 'pi-book'        },
      moment:     { label: 'Momentos',    icon: 'pi-star'        },
    };

    const grupos: Record<string, LibrasVideo[]> = {};
    for (const v of videos) {
      const key = v.source ?? 'moment';
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(v);
    }

    return Object.entries(grupos).map(([key, items]) => ({
      label: mapaLabels[key]?.label ?? key,
      icon:  mapaLabels[key]?.icon  ?? 'pi-star',
      items,
    }));
  });

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Carrega o provedor LIBRAS se houver libras_videos
    const videos = this.data()?.libras_videos;
    if (videos?.length) {
      this.librasCarregando.set(true);
      // Aguarda um tick para o DOM estar pronto
      setTimeout(() => {
        this.librasLoader.carregarProvedor(videos);
        this.librasCarregando.set(false);
      }, 500);
    }
  }

  // Muda a aba ativa e para o áudio se estiver tocando
  setPcdTab(tab: PcdTab) {
    this.pcdTab.set(tab);
    if (tab !== 'audio') this.pararAudio();
  }

  // Dispara a tradução LIBRAS de um item
  traduzir(item: LibrasVideo, textoEl: HTMLElement) {
    this.librasLoader.traduzir(item.text, textoEl);
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

    window.speechSynthesis.cancel();

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

  pausar() {
    if (!isPlatformBrowser(this.platformId)) return;
    window.speechSynthesis.pause();
    this.audioStatus.set('pausado');
  }

  retomar() {
    if (!isPlatformBrowser(this.platformId)) return;
    window.speechSynthesis.resume();
    this.audioStatus.set('reproduzindo');
  }

  pararAudio() {
    if (!isPlatformBrowser(this.platformId)) return;
    window.speechSynthesis.cancel();
    this.audioStatus.set('parado');
    this.utterance = null;
  }

  alterarVelocidade(vel: number) {
    this.velocidade.set(vel);
    if (this.audioStatus() === 'reproduzindo') this.reproduzir();
  }

  copyText(text: string) {
    if (isPlatformBrowser(this.platformId)) {
      navigator.clipboard.writeText(text).then(() => {
        this.toast.sucesso('Texto copiado!', 'Copiado');
      });
    }
  }

  corComplexidade(score: number): string {
    if (score <= 3) return 'var(--verde)';
    if (score <= 6) return 'var(--ambar)';
    return 'var(--erro)';
  }

  ngOnDestroy() {
    this.pararAudio();
    this.librasLoader.limpar();
  }

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/painel']);
  }
}