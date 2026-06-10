import {
  Component, AfterViewInit, inject, OnDestroy, signal, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements AfterViewInit, OnDestroy {
  private sanitizer  = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);

  modalVideoAberto = signal(false);
  videoUrl = signal<SafeResourceUrl | null>(null);

  readonly estatisticas = [
    { label: 'PDFs Processados',   sufixo: '+', alvo: 5000,  atual: 0, icone: 'pi-file-pdf'    },
    { label: 'Conteúdos Gerados',  sufixo: '+', alvo: 18000, atual: 0, icone: 'pi-bolt'         },
    { label: 'Precisão da IA',     sufixo: '%', alvo: 99,    atual: 0, icone: 'pi-check-circle' },
    { label: 'Professores Ativos', sufixo: '+', alvo: 1200,  atual: 0, icone: 'pi-users'        },
  ];

  readonly contentCards = [
    { icon: 'pi-question-circle', label: 'Quiz',        desc: '30 perguntas inteligentes geradas automaticamente', cor: 'var(--azul)'      },
    { icon: 'pi-file-edit',       label: 'Resumo',       desc: 'Síntese clara dos pontos-chave do conteúdo',        cor: 'var(--violeta)'   },
    { icon: 'pi-desktop',         label: 'Slides',       desc: 'Apresentação premium exportável para PowerPoint',   cor: 'var(--roxo-claro)'},
    { icon: 'pi-sitemap',         label: 'Mapa Mental',  desc: 'Visualização interativa das conexões do conteúdo',  cor: 'var(--laranja)'   },
    { icon: 'pi-clone',           label: 'Flashcards',   desc: '20 cartões de estudo para memorização eficaz',      cor: 'var(--ambar)'     },
    { icon: 'pi-eye',             label: 'Conteúdo PCD', desc: 'Linguagem simplificada e acessível para todos',     cor: 'var(--verde)'     },
  ];

  readonly passos = [
    { numero: '01', titulo: 'Upload do PDF',   desc: 'Envie qualquer material didático — apostilas, artigos ou livros em PDF.',          icone: 'pi-cloud-upload' },
    { numero: '02', titulo: 'Gemini Processa', desc: 'O Gemini 2.5-Flash analisa o conteúdo e gera materiais pedagógicos em segundos.', icone: 'pi-bolt'         },
    { numero: '03', titulo: 'Baixe e Aplique', desc: 'Exporte para PowerPoint, Kahoot, SCORM e aplique direto com seus alunos.',        icone: 'pi-download'     },
  ];

  private observers: IntersectionObserver[] = [];

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.animate').forEach(el => animObserver.observe(el));
    this.observers.push(animObserver);

    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.iniciarContadores();
          statsObserver.disconnect();
        }
      });
    }, { threshold: 0.3 });

    const statsEl = document.querySelector('.stats-section');
    if (statsEl) statsObserver.observe(statsEl);
    this.observers.push(statsObserver);

    document.addEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.fecharVideo();
  };

  abrirVideo() {
    this.videoUrl.set(
      this.sanitizer.bypassSecurityTrustResourceUrl(
        'https://www.youtube.com/embed/m5eiRpmtpbQ?autoplay=1&rel=0&modestbranding=1'
      )
    );
    this.modalVideoAberto.set(true);
  }

  fecharVideo() {
    this.videoUrl.set(null);
    this.modalVideoAberto.set(false);
  }

  private iniciarContadores() {
    this.estatisticas.forEach((stat, index) => {
      const duracao = 2000;
      const inicio  = performance.now();
      const atualizar = (agora: number) => {
        const progresso = Math.min((agora - inicio) / duracao, 1);
        const easing    = 1 - Math.pow(1 - progresso, 3);
        this.estatisticas[index].atual = Math.floor(easing * stat.alvo);
        if (progresso < 1) requestAnimationFrame(atualizar);
        else this.estatisticas[index].atual = stat.alvo;
      };
      requestAnimationFrame(atualizar);
    });
  }

  ngOnDestroy() {
    this.observers.forEach(o => o.disconnect());
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('keydown', this.onKeyDown);
    }
  }
}