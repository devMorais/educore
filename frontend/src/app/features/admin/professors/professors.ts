import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import type { AdminUser, PaginatedUsers, UserFilters } from '../../../core/types/admin';

@Component({
  selector: 'app-professors',
  imports: [FormsModule, CommonModule],
  templateUrl: './professors.html',
  styleUrl: './professors.scss',
})
export class Professors implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private toast        = inject(ToastService);
  private destroy$     = new Subject<void>();
  private busca$       = new Subject<string>();

  // Estado da lista
  professores    = signal<AdminUser[]>([]);
  carregando     = signal(false);
  totalProfessores = signal(0);
  totalPaginas   = signal(0);

  // Filtros
  termoBusca  = signal('');
  filtroStatus = signal('');
  paginaAtual = signal(1);
  readonly porPagina = 20;

  // Dialog de criação (sidebar)
  sidebarAberta   = signal(false);
  salvandoNovo    = signal(false);
  novoNome        = signal('');
  novoEmail       = signal('');
  novaSenha       = signal('');

  // Confirmação de bloqueio
  professorBloqueando = signal<AdminUser | null>(null);
  confirmacaoAberta   = signal(false);

  // Loading por ação
  salvandoBloqueio = signal<number | null>(null);

  // Opções de status para o filtro
  readonly opcoesStatus = [
    { valor: '',          label: 'Todos os status'  },
    { valor: 'ativo',     label: 'Ativos'           },
    { valor: 'bloqueado', label: 'Bloqueados'       },
  ];

  ngOnInit() {
    // Debounce de 300ms na busca
    this.busca$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.paginaAtual.set(1);
      this.carregarProfessores();
    });

    this.carregarProfessores();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Carrega a lista de professores (role=professor)
  carregarProfessores() {
    this.carregando.set(true);
    const filtros: UserFilters = {
      search:   this.termoBusca() || undefined,
      role:     'professor',
      page:     this.paginaAtual(),
      per_page: this.porPagina,
    };

    this.adminService.listUsers(filtros).subscribe({
      next: (res: PaginatedUsers) => {
        // Aplica filtro de status no frontend se necessário
        let lista = res.data;
        if (this.filtroStatus() === 'ativo') {
          lista = lista.filter(p => p.status !== 'blocked');
        } else if (this.filtroStatus() === 'bloqueado') {
          lista = lista.filter(p => p.status === 'blocked');
        }
        this.professores.set(lista);
        this.totalProfessores.set(res.total);
        this.totalPaginas.set(res.last_page);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.toast.erro('Erro ao carregar professores.', 'Erro');
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
    this.carregarProfessores();
  }

  // Navega para uma página
  irParaPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaAtual.set(pagina);
    this.carregarProfessores();
  }

  // Verifica se o professor está bloqueado (D-09: campo status, separado de email_verified_at)
  isBloqueado(professor: AdminUser): boolean {
    return professor.status === 'blocked';
  }

  // Abre a sidebar de novo professor
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

  // Cria um novo professor via API
  criarProfessor() {
    if (!this.novoNome() || !this.novoEmail() || !this.novaSenha()) {
      this.toast.aviso('Preencha todos os campos.', 'Atenção');
      return;
    }

    this.salvandoNovo.set(true);
    this.adminService.createProfessor({
      name:     this.novoNome(),
      email:    this.novoEmail(),
      password: this.novaSenha(),
    }).subscribe({
      next: () => {
        this.salvandoNovo.set(false);
        this.fecharSidebar();
        this.toast.sucesso('Professor criado com sucesso!', 'Criado');
        this.carregarProfessores();
      },
      error: (err) => {
        this.salvandoNovo.set(false);
        const msg = err?.error?.message ?? 'Erro ao criar professor.';
        this.toast.erro(msg, 'Erro');
      },
    });
  }

  // Abre confirmação de bloqueio/desbloqueio
  confirmarBloqueio(professor: AdminUser) {
    this.professorBloqueando.set(professor);
    this.confirmacaoAberta.set(true);
  }

  // Cancela o bloqueio
  cancelarBloqueio() {
    this.confirmacaoAberta.set(false);
    this.professorBloqueando.set(null);
  }

  // Executa o bloqueio/desbloqueio
  executarBloqueio() {
    const professor = this.professorBloqueando();
    if (!professor) return;

    const ativar = this.isBloqueado(professor);
    this.salvandoBloqueio.set(professor.id);
    this.confirmacaoAberta.set(false);

    this.adminService.toggleBlock(professor.id, ativar).subscribe({
      next: (res) => {
        this.salvandoBloqueio.set(null);
        this.professorBloqueando.set(null);
        this.professores.update(lista =>
          lista.map(p => p.id === res.user.id ? res.user : p)
        );
        const acao = this.isBloqueado(res.user) ? 'bloqueado' : 'desbloqueado';
        this.toast.sucesso(`${res.user.name} foi ${acao}.`, 'Sucesso');
      },
      error: () => {
        this.salvandoBloqueio.set(null);
        this.toast.erro('Erro ao atualizar status do professor.', 'Erro');
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