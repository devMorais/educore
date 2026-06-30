import {
  Component, inject, signal, computed, OnInit, OnDestroy,
  PLATFORM_ID, HostListener
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { NotificationService } from '../../../../../core/services/notification.service';
import type { NotificationItem } from '../../../../../core/types/notification';


@Component({
  selector: 'app-notification-bell',
  imports: [],
  templateUrl: './notification-bell.molecule.html',
  styleUrl: './notification-bell.molecule.scss',
})
export class NotificationBell implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private platformId = inject(PLATFORM_ID);

  // Lista de notificações carregadas
  notificacoes = signal<NotificationItem[]>([]);

  // Contagem de não lidas (badge do sino)
  naoLidas = signal(0);

  // Controla a abertura do overlay
  overlayAberto = signal(false);

  // Loading da lista
  carregando = signal(false);

  // Verifica se há notificações não lidas para exibir o badge
  temNaoLidas = computed(() => this.naoLidas() > 0);

  private pollingSub: Subscription | null = null;

  ngOnInit() {
    this.carregarContagem();

    // Polling a cada 30 segundos para atualizar a contagem
    if (isPlatformBrowser(this.platformId)) {
      this.pollingSub = interval(30000).subscribe(() => {
        this.carregarContagem();
      });
    }
  }

  ngOnDestroy() {
    this.pollingSub?.unsubscribe();
  }

  // Carrega apenas a contagem de não lidas (usado no polling)
  private carregarContagem() {
    this.notificationService.contarNaoLidas().subscribe({
      next: res => this.naoLidas.set(res.count),
      error: () => {},
    });
  }

  // Carrega a lista completa de notificações
  private carregarLista() {
    this.carregando.set(true);
    this.notificationService.listar().subscribe({
      next: lista => {
        this.notificacoes.set(lista);
        this.carregando.set(false);
      },
      error: () => {
        this.notificacoes.set([]);
        this.carregando.set(false);
      },
    });
  }

  // Abre/fecha o overlay e carrega a lista ao abrir
  toggleOverlay(event: Event) {
    event.stopPropagation();
    const abrindo = !this.overlayAberto();
    this.overlayAberto.set(abrindo);
    if (abrindo) {
      this.carregarLista();
    }
  }

  // Fecha o overlay ao clicar fora
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-bell')) {
      this.overlayAberto.set(false);
    }
  }

  // Marca uma notificação como lida e fecha o overlay
  clicarNotificacao(notificacao: NotificationItem) {
    if (!notificacao.read) {
      this.notificationService.marcarComoLida(notificacao.id).subscribe({
        next: () => {
          this.notificacoes.update(lista =>
            lista.map(n => n.id === notificacao.id ? { ...n, read: true } : n)
          );
          this.naoLidas.update(c => Math.max(0, c - 1));
        },
      });
    }
    this.overlayAberto.set(false);
  }

  // Marca todas as notificações como lidas
  marcarTodasComoLidas(event: Event) {
    event.stopPropagation();
    this.notificationService.marcarTodasComoLidas().subscribe({
      next: () => {
        this.notificacoes.update(lista =>
          lista.map(n => ({ ...n, read: true }))
        );
        this.naoLidas.set(0);
      },
    });
  }

  // Retorna o ícone PrimeIcons de acordo com o tipo de notificação
  iconePorTipo(tipo: string): string {
    const mapa: Record<string, string> = {
      success: 'pi-check-circle',
      error:   'pi-times-circle',
      warning: 'pi-exclamation-triangle',
      info:    'pi-info-circle',
      system:  'pi-cog',
    };
    return mapa[tipo] ?? 'pi-bell';
  }

  // Trunca o corpo da notificação para não quebrar o layout
  truncar(texto: string, max: number = 80): string {
    if (texto.length <= max) return texto;
    return texto.slice(0, max).trim() + '...';
  }

  // Calcula o tempo relativo ("há 5 min", "há 2h", etc.)
  tempoRelativo(dataIso: string): string {
    const agora = new Date().getTime();
    const data = new Date(dataIso).getTime();
    const diffMs = agora - data;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'agora mesmo';
    if (diffMin < 60) return `há ${diffMin} min`;

    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `há ${diffH}h`;

    const diffDias = Math.floor(diffH / 24);
    if (diffDias < 7) return `há ${diffDias}d`;

    return new Date(dataIso).toLocaleDateString('pt-BR');
  }
}
