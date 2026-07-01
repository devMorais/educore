import { Component, inject, signal, ElementRef, viewChild, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, switchMap, startWith, catchError, of, finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ChatService, ChatMessage } from '../../../core/services/chat';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, DatePipe, ButtonModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  private chatService = inject(ChatService);
  private auth = inject(Auth);
  private destroyRef = inject(DestroyRef);

  // Referência do container de mensagens, usada para o scroll automático
  private scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  messages = signal<ChatMessage[]>([]);
  novaMensagem = signal('');
  carregando = signal(true);
  enviando = signal(false);
  erro = signal<string | null>(null);

  usuarioAtual = this.auth.currentUser;

  private ultimaQuantidade = 0;

  constructor() {
    // Polling a cada 3s (MVP sem WebSocket) — busca imediatamente e repete
    interval(3000)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.chatService.getMessages().pipe(
            catchError((err) => {
              // Esperado enquanto o endpoint do backend ainda não existe
              console.warn('Erro ao buscar mensagens do chat:', err);
              this.erro.set('Não foi possível carregar as mensagens. Tentando novamente...');
              return of<ChatMessage[]>([]);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((mensagens) => {
        this.carregando.set(false);
        if (mensagens.length > 0) {
          this.erro.set(null);
        }

        const quantidadeAnterior = this.ultimaQuantidade;
        this.messages.set(mensagens);
        this.ultimaQuantidade = mensagens.length;

        // Rola para a última mensagem só quando há mensagens novas
        if (mensagens.length !== quantidadeAnterior) {
          setTimeout(() => this.rolarParaUltimaMensagem(), 0);
        }
      });
  }

  // Verifica se a mensagem é do usuário logado (para alinhar à direita)
  ehMensagemPropria(mensagem: ChatMessage): boolean {
    return mensagem.user?.id === this.usuarioAtual()?.id;
  }

  enviarMensagem(): void {
    const conteudo = this.novaMensagem().trim();
    if (!conteudo || this.enviando()) {
      return;
    }

    this.enviando.set(true);
    this.chatService
      .sendMessage(conteudo)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (mensagemCriada) => {
          this.messages.update((atual) => [...atual, mensagemCriada]);
          this.ultimaQuantidade = this.messages().length;
          this.novaMensagem.set('');
          this.erro.set(null);
          setTimeout(() => this.rolarParaUltimaMensagem(), 0);
        },
        error: (err) => {
          console.warn('Erro ao enviar mensagem:', err);
          this.erro.set('Não foi possível enviar a mensagem. Tente novamente.');
        },
      });
  }

  // Permite enviar com Enter (Shift+Enter quebra linha)
  aoTeclar(evento: KeyboardEvent): void {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault();
      this.enviarMensagem();
    }
  }

  private rolarParaUltimaMensagem(): void {
    const container = this.scrollContainer()?.nativeElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // Gera iniciais do nome para o avatar fallback
  iniciais(nome: string): string {
    return (
      nome
        ?.split(' ')
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join('') ?? '?'
    );
  }
}