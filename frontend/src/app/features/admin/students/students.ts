import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import type { AdminUser, PaginatedUsers, UserFilters } from '../../../core/types/admin';

@Component({
  selector: 'app-students',
  imports: [FormsModule, CommonModule],
  templateUrl: './students.html',
  styleUrl: './students.scss',
})
export class Students implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private toast        = inject(ToastService);
  private destroy$     = new Subject<void>();
  private busca$       = new Subject<string>();

  // Estado da lista
  alunos        = signal<AdminUser[]>([]);
  carregando    = signal(false);
  totalAlunos   = signal(0);
  totalPaginas  = signal(0);

  // Filtros
  termoBusca   = signal('');
  filtroStatus = signal('');
  paginaAtual  = signal(1);
  readonly porPagina = 20;

  // Sidebar de criação
  sidebarAberta = signal(false);
  salvandoNovo  = signal(false);
  novoNome      = signal('');
  novoEmail     = signal('');
  novaSenha     = signal('');

  // Confirmação de bloqueio
  alunoBloqueando     = signal<AdminUser | null>(null);
  confirmacaoAberta   = signal(false);

  // Loading por ação
  salvandoBloqueio = signal<number | null>(null);

  // Opções de status para o filtro
  readonly opcoesStatus = [
    { valor: '',          label: 'Todos os status' },
    { valor: 'ativo',     label: 'Ativos'          },
    { valor: 'bloqueado', label: 'Bloqueados'      },
  ];

  ngOnInit() {
    // Debounce de 300ms na busca
    this.busca$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.paginaAtual.set(1);
      this.carregarAlunos();
    });

    this.carregarAlunos();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Carrega a lista de alunos (role=student)
  carregarAlunos() {
    this.carregando.set(true);
    const filtros: UserFilters = {
      search:   this.termoBusca() || undefined,
      role:     'student',
      page:     this.paginaAtual(),
      per_page: this.porPagina,
    };

    this.adminService.listUsers(filtros).subscribe({
      next: (res: PaginatedUsers) => {
        // Aplica filtro de status no frontend se necessário
        let lista = res.data;
        if (this.filtroStatus() === 'ativo') {
          lista = lista.filter(a => a.status !== 'blocked');
        } else if (this.filtroStatus() === 'bloqueado') {
          lista = lista.filter(a => a.status === 'blocked');
        }
        this.alunos.set(lista);
        this.totalAlunos.set(res.total);
        this.totalPaginas.set(res.last_page);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.toast.erro('Erro ao carregar alunos.', 'Erro');
      },
    });
  }

  // Dispara a busca com debounce
  onBusca(valor: string) {
    this.termoBusca.set(valor);
    this.busca$.next(valor);
  }

  // Muda o filtro de status
  onFiltroStatus(valor: string) {
    this.filtroStatus.set(valor);
    this.paginaAtual.set(1);
    this.carregarAlunos();
  }

  // Navega para uma página
  irParaPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaAtual.set(pagina);
    this.carregarAlunos();
  }

  // Verifica se o aluno está bloqueado (D-09: campo status, separado de email_verified_at)
  isBloqueado(aluno: AdminUser): boolean {
    return aluno.status === 'blocked';
  }

  // Abre a sidebar de novo aluno
  abrirSidebar() {
    this.novoNome.set('');
    this.novoEmail.set('');
    this.novaSenha.set('');
    this.sidebarAberta.set(true);
  }

  // Fecha a sidebar
  fecharSidebar() {
    this.sidebarAberta.set(false);
  }

  // Cria um novo aluno via API
  criarAluno() {
    if (!this.novoNome() || !this.novoEmail() || !this.novaSenha()) {
      this.toast.aviso('Preencha todos os campos.', 'Atenção');
      return;
    }

    this.salvandoNovo.set(true);
    this.adminService.createStudent({
      name:     this.novoNome(),
      email:    this.novoEmail(),
      password: this.novaSenha(),
    }).subscribe({
      next: () => {
        this.salvandoNovo.set(false);
        this.fecharSidebar();
        this.toast.sucesso('Aluno criado com sucesso!', 'Criado');
        this.carregarAlunos();
      },
      error: (err: { error?: { message?: string } }) => {
        this.salvandoNovo.set(false);
        const msg = err?.error?.message ?? 'Erro ao criar aluno.';
        this.toast.erro(msg, 'Erro');
      },
    });
  }

  // Abre confirmação de bloqueio/desbloqueio
  confirmarBloqueio(aluno: AdminUser) {
    this.alunoBloqueando.set(aluno);
    this.confirmacaoAberta.set(true);
  }

  // Cancela o bloqueio
  cancelarBloqueio() {
    this.confirmacaoAberta.set(false);
    this.alunoBloqueando.set(null);
  }

  // Executa o bloqueio/desbloqueio
  executarBloqueio() {
    const aluno = this.alunoBloqueando();
    if (!aluno) return;

    const ativar = this.isBloqueado(aluno);
    this.salvandoBloqueio.set(aluno.id);
    this.confirmacaoAberta.set(false);

    this.adminService.toggleBlock(aluno.id, ativar).subscribe({
      next: (res) => {
        this.salvandoBloqueio.set(null);
        this.alunoBloqueando.set(null);
        this.alunos.update(lista =>
          lista.map(a => a.id === res.user.id ? res.user : a)
        );
        const acao = this.isBloqueado(res.user) ? 'bloqueado' : 'desbloqueado';
        this.toast.sucesso(`${res.user.name} foi ${acao}.`, 'Sucesso');
      },
      error: () => {
        this.salvandoBloqueio.set(null);
        this.toast.erro('Erro ao atualizar status do aluno.', 'Erro');
      },
    });
  }

  // Formata a data para pt-BR
  formatarData(data?: string): string {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }

  // Retorna as iniciais do nome
  iniciais(nome: string): string {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  // Gera array de páginas para paginação
  paginas(): number[] {
    const total = this.totalPaginas();
    const atual = this.paginaAtual();
    const pages: number[] = [];
    const inicio = Math.max(1, atual - 2);
    const fim    = Math.min(total, atual + 2);
    for (let i = inicio; i <= fim; i++) pages.push(i);
    return pages;
  }
}