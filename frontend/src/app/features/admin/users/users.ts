import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import type { AdminUser, PaginatedUsers, UserFilters } from '../../../core/types/admin';

@Component({
  selector: 'app-users',
  imports: [FormsModule, CommonModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private toast        = inject(ToastService);
  private destroy$     = new Subject<void>();
  private busca$       = new Subject<string>();

  // Estado da lista
  usuarios      = signal<AdminUser[]>([]);
  carregando    = signal(false);
  totalUsuarios = signal(0);
  totalPaginas  = signal(0);

  // Filtros
  termoBusca  = signal('');
  filtroRole  = signal('');
  paginaAtual = signal(1);
  readonly porPagina = 20;

  // Modal de detalhes
  usuarioSelecionado = signal<AdminUser | null>(null);
  modalAberto        = signal(false);

  // Confirmação de bloqueio
  usuarioBloqueando = signal<AdminUser | null>(null);
  confirmacaoAberta = signal(false);

  // Loading por ação
  salvandoRole     = signal<number | null>(null);
  salvandoBloqueio = signal<number | null>(null);
  exportandoCsv    = signal(false);

  // Opções de role para o filtro
  readonly opcoesRole = [
    { valor: '',          label: 'Todos os perfis' },
    { valor: 'admin',     label: 'Administrador'   },
    { valor: 'professor', label: 'Professor'       },
    { valor: 'student',   label: 'Aluno'           },
  ];

  // Opções de role para o select de mudança
  readonly opcoesRoleMudanca = [
    { valor: 'admin',     label: 'Administrador' },
    { valor: 'professor', label: 'Professor'     },
    { valor: 'student',   label: 'Aluno'         },
  ];

  ngOnInit() {
    // Debounce de 300ms na busca
    this.busca$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.paginaAtual.set(1);
      this.carregarUsuarios();
    });

    this.carregarUsuarios();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Carrega a lista de usuários
  carregarUsuarios() {
    this.carregando.set(true);
    const filtros: UserFilters = {
      search:   this.termoBusca() || undefined,
      role:     this.filtroRole() || undefined,
      page:     this.paginaAtual(),
      per_page: this.porPagina,
    };

    this.adminService.listUsers(filtros).subscribe({
      next: (res: PaginatedUsers) => {
        this.usuarios.set(res.data);
        this.totalUsuarios.set(res.total);
        this.totalPaginas.set(res.last_page);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.toast.erro('Erro ao carregar usuários.', 'Erro');
      },
    });
  }

  // Dispara a busca com debounce
  onBusca(valor: string) {
    this.termoBusca.set(valor);
    this.busca$.next(valor);
  }

  // Muda o filtro de role
  onFiltroRole(valor: string) {
    this.filtroRole.set(valor);
    this.paginaAtual.set(1);
    this.carregarUsuarios();
  }

  // Navega para uma página
  irParaPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaAtual.set(pagina);
    this.carregarUsuarios();
  }

  // Abre o modal de detalhes
  verDetalhes(usuario: AdminUser) {
    this.usuarioSelecionado.set(usuario);
    this.modalAberto.set(true);
  }

  // Fecha o modal de detalhes
  fecharModal() {
    this.modalAberto.set(false);
    this.usuarioSelecionado.set(null);
  }

  // Verifica se o usuário está bloqueado (D-09: campo status, separado de email_verified_at)
  isBloqueado(usuario: AdminUser): boolean {
    return usuario.status === 'blocked';
  }

  // Muda o role do usuário
  mudarRole(usuario: AdminUser, novoRole: 'admin' | 'professor' | 'student') {
    if (usuario.role === novoRole) return;
    this.salvandoRole.set(usuario.id);

    this.adminService.updateRole(usuario.id, novoRole).subscribe({
      next: (res) => {
        this.salvandoRole.set(null);
        this.usuarios.update(lista =>
          lista.map(u => u.id === res.user.id ? res.user : u)
        );
        this.toast.sucesso(
          `Perfil de ${res.user.name} atualizado para ${this.traduzirRole(novoRole)}.`,
          'Perfil atualizado'
        );
      },
      error: () => {
        this.salvandoRole.set(null);
        this.toast.erro('Erro ao atualizar perfil.', 'Erro');
      },
    });
  }

  // Abre confirmação de bloqueio
  confirmarBloqueio(usuario: AdminUser) {
    this.usuarioBloqueando.set(usuario);
    this.confirmacaoAberta.set(true);
  }

  // Cancela o bloqueio
  cancelarBloqueio() {
    this.confirmacaoAberta.set(false);
    this.usuarioBloqueando.set(null);
  }

  // Executa o bloqueio/desbloqueio
  executarBloqueio() {
    const usuario = this.usuarioBloqueando();
    if (!usuario) return;

    // ativar = true significa desbloquear; false significa bloquear
    const ativar = this.isBloqueado(usuario);
    this.salvandoBloqueio.set(usuario.id);
    this.confirmacaoAberta.set(false);

    this.adminService.toggleBlock(usuario.id, ativar).subscribe({
      next: (res) => {
        this.salvandoBloqueio.set(null);
        this.usuarioBloqueando.set(null);
        this.usuarios.update(lista =>
          lista.map(u => u.id === res.user.id ? res.user : u)
        );
        const acao = this.isBloqueado(res.user) ? 'bloqueado' : 'desbloqueado';
        this.toast.sucesso(`${res.user.name} foi ${acao}.`, 'Sucesso');
      },
      error: () => {
        this.salvandoBloqueio.set(null);
        this.toast.erro('Erro ao atualizar status do usuário.', 'Erro');
      },
    });
  }

  // Exporta CSV com todos os usuários
  exportarCsv() {
    this.exportandoCsv.set(true);
    this.adminService.listUsers({ per_page: 9999 }).subscribe({
      next: (res) => {
        this.adminService.exportCsvLocal(res.data);
        this.exportandoCsv.set(false);
        this.toast.sucesso('CSV exportado com sucesso!', 'Exportado');
      },
      error: () => {
        this.exportandoCsv.set(false);
        this.toast.erro('Erro ao exportar CSV.', 'Erro');
      },
    });
  }

  // Formata a data
  formatarData(data: string): string {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  // Retorna as iniciais do nome
  iniciais(nome: string): string {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  // Traduz o role para português
  traduzirRole(role: string): string {
    const mapa: Record<string, string> = {
      admin:     'Administrador',
      professor: 'Professor',
      student:   'Aluno',
    };
    return mapa[role] ?? role;
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