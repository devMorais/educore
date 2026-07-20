import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { finalize } from 'rxjs';
import { ForumService } from '../../../core/services/forum.service';
import { Auth } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import type { ForumTopic, ForumReply } from '../../../core/types/forum';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [FormsModule, DatePipe, ButtonModule, DialogModule, InputTextModule, TextareaModule, PaginatorModule],
  templateUrl: './forum.html',
  styleUrl: './forum.scss',
})
export class Forum {
  private forumService = inject(ForumService);
  private auth = inject(Auth);
  private toast = inject(ToastService);

  usuarioAtual = this.auth.currentUser;

  // Controla qual "tela" está visível: lista de tópicos ou thread de um tópico
  visualizacao = signal<'lista' | 'thread'>('lista');

  // ── Lista de tópicos ──
  topicos = signal<ForumTopic[]>([]);
  totalTopicos = signal(0);
  paginaTopicos = signal(0); // zero-based, padrão do p-paginator
  porPaginaTopicos = signal(10);
  busca = signal('');
  carregandoTopicos = signal(true);
  erroTopicos = signal<string | null>(null);

  // ── Criação de tópico ──
  dialogNovoTopicoVisivel = signal(false);
  novoTitulo = signal('');
  novoCorpo = signal('');
  criandoTopico = signal(false);

  // ── Thread (tópico selecionado + respostas) ──
  topicoSelecionado = signal<ForumTopic | null>(null);
  respostas = signal<ForumReply[]>([]);
  totalRespostas = signal(0);
  paginaRespostas = signal(0);
  porPaginaRespostas = signal(10);
  carregandoRespostas = signal(true);
  erroRespostas = signal<string | null>(null);

  novaResposta = signal('');
  enviandoResposta = signal(false);

  tituloValido = computed(() => this.novoTitulo().trim().length > 0);
  corpoValido = computed(() => this.novoCorpo().trim().length > 0);

  constructor() {
    this.carregarTopicos();
  }

  // ───────────────────── Tópicos ─────────────────────

  carregarTopicos(): void {
    this.carregandoTopicos.set(true);
    this.erroTopicos.set(null);

    this.forumService
      .listTopics({
        search: this.busca() || undefined,
        page: this.paginaTopicos() + 1,
        per_page: this.porPaginaTopicos(),
      })
      .pipe(finalize(() => this.carregandoTopicos.set(false)))
      .subscribe({
        next: (res) => {
          this.topicos.set(res.data);
          this.totalTopicos.set(res.total);
        },
        error: (err) => {
          console.warn('Erro ao carregar tópicos:', err);
          this.erroTopicos.set('Não foi possível carregar os tópicos do fórum.');
        },
      });
  }

  aoMudarPaginaTopicos(evento: PaginatorState): void {
    this.paginaTopicos.set(evento.page ?? 0);
    this.porPaginaTopicos.set(evento.rows ?? 10);
    this.carregarTopicos();
  }

  buscar(): void {
    this.paginaTopicos.set(0);
    this.carregarTopicos();
  }

  abrirDialogNovoTopico(): void {
    this.novoTitulo.set('');
    this.novoCorpo.set('');
    this.dialogNovoTopicoVisivel.set(true);
  }

  criarTopico(): void {
    if (!this.tituloValido() || !this.corpoValido() || this.criandoTopico()) {
      return;
    }

    this.criandoTopico.set(true);
    this.forumService
      .createTopic(this.novoTitulo().trim(), this.novoCorpo().trim())
      .pipe(finalize(() => this.criandoTopico.set(false)))
      .subscribe({
        next: () => {
          this.dialogNovoTopicoVisivel.set(false);
          this.toast.sucesso('Tópico criado com sucesso!');
          this.paginaTopicos.set(0);
          this.carregarTopicos();
        },
        error: (err) => {
          console.warn('Erro ao criar tópico:', err);
          this.toast.erro('Não foi possível criar o tópico.');
        },
      });
  }

  podeDeletar(autorId: number | undefined): boolean {
    const usuario = this.usuarioAtual();
    return !!usuario && (usuario.id === autorId || usuario.role === 'admin');
  }

  deletarTopico(topico: ForumTopic, evento: Event): void {
    evento.stopPropagation();
    if (!confirm(`Excluir o tópico "${topico.title}"?`)) {
      return;
    }

    this.forumService.deleteTopic(topico.id).subscribe({
      next: () => {
        this.toast.sucesso('Tópico excluído.');
        this.carregarTopicos();
      },
      error: (err) => {
        console.warn('Erro ao excluir tópico:', err);
        this.toast.erro('Não foi possível excluir o tópico.');
      },
    });
  }

  // ───────────────────── Thread ─────────────────────

  abrirTopico(topico: ForumTopic): void {
    this.topicoSelecionado.set(topico);
    this.paginaRespostas.set(0);
    this.visualizacao.set('thread');
    this.carregarRespostas();
  }

  voltarParaLista(): void {
    this.visualizacao.set('lista');
    this.topicoSelecionado.set(null);
    this.respostas.set([]);
    // Recarrega a lista — replies_count/last_reply_at podem ter mudado
    // enquanto o usuário estava na thread (nova resposta, exclusão etc.).
    this.carregarTopicos();
  }

  carregarRespostas(): void {
    const topico = this.topicoSelecionado();
    if (!topico) return;

    this.carregandoRespostas.set(true);
    this.erroRespostas.set(null);

    this.forumService
      .listReplies(topico.id, this.paginaRespostas() + 1, this.porPaginaRespostas())
      .pipe(finalize(() => this.carregandoRespostas.set(false)))
      .subscribe({
        next: (res) => {
          this.respostas.set(res.data);
          this.totalRespostas.set(res.total);
        },
        error: (err) => {
          console.warn('Erro ao carregar respostas:', err);
          this.erroRespostas.set('Não foi possível carregar as respostas.');
        },
      });
  }

  aoMudarPaginaRespostas(evento: PaginatorState): void {
    this.paginaRespostas.set(evento.page ?? 0);
    this.porPaginaRespostas.set(evento.rows ?? 10);
    this.carregarRespostas();
  }

  enviarResposta(): void {
    const topico = this.topicoSelecionado();
    const corpo = this.novaResposta().trim();
    if (!topico || !corpo || this.enviandoResposta()) {
      return;
    }

    this.enviandoResposta.set(true);
    this.forumService
      .createReply(topico.id, corpo)
      .pipe(finalize(() => this.enviandoResposta.set(false)))
      .subscribe({
        next: () => {
          this.novaResposta.set('');
          this.paginaRespostas.set(0);
          this.carregarRespostas();
        },
        error: (err) => {
          console.warn('Erro ao enviar resposta:', err);
          this.toast.erro('Não foi possível enviar a resposta.');
        },
      });
  }

  deletarResposta(resposta: ForumReply): void {
    const topico = this.topicoSelecionado();
    if (!topico || !confirm('Excluir esta resposta?')) {
      return;
    }

    this.forumService.deleteReply(topico.id, resposta.id).subscribe({
      next: () => {
        this.toast.sucesso('Resposta excluída.');
        this.carregarRespostas();
      },
      error: (err) => {
        console.warn('Erro ao excluir resposta:', err);
        this.toast.erro('Não foi possível excluir a resposta.');
      },
    });
  }

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