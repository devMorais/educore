import { Component, computed, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { AvatarModule } from 'primeng/avatar';
import { Auth } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';

// Estrutura de resposta do endpoint GET /api/admin/stats
interface AdminStats {
  total_users:        number;
  total_documents:    number;
  total_generations:  number;
  active_users_7days: number;
  uploads_per_day:    { date: string; count: number }[];
  by_type?:           { type: string; count: number }[];
}

// Estrutura crua de atividade vinda de GET /api/admin/activity
interface ActivityItem {
  type:      string;
  name:      string;
  action:    string;
  timestamp: string;
}

// Atividade já formatada para o template
interface ActivityVM {
  initial: string;
  name:    string;
  action:  string;
  time:    string;
  color:   string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ChartModule, AvatarModule, Skeleton],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private auth       = inject(Auth);
  private api        = inject(ApiService);
  private toast      = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  // Nome do usuário logado
  userName = computed(() => this.auth.currentUser()?.name?.split(' ')[0] ?? 'Admin');

  // Estados de carregamento independentes (KPIs/gráficos e atividade recente)
  carregando           = signal(true);
  carregandoAtividades = signal(true);

  // KPIs vindos da API
  totalUsuarios   = signal(0);
  totalDocumentos = signal(0);
  totalGeracoes   = signal(0);
  ativos7dias     = signal(0);

  // Dados dos gráficos
  chartUploads = signal<any>(null);
  chartTipos   = signal<any>(null);

  // Atividade recente (dados reais)
  atividades = signal<ActivityVM[]>([]);

  // Arrays auxiliares para os skeletons
  readonly skeletonCards      = [1, 2, 3, 4];
  readonly skeletonAtividades = [1, 2, 3, 4, 5];

  // Opções do gráfico de linha
  readonly opcoesLinha = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#F3F4F6' } },
      x: { grid: { display: false }, ticks: { maxTicksLimit: 7 } },
    },
  };

  // Opções do gráfico donut
  readonly opcoesPizza = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } },
    },
  };

  // Mapa de tipo de geração → rótulo PT-BR e cor (para o donut real)
  private readonly tipoMeta: Record<string, { label: string; cor: string }> = {
    quiz:       { label: 'Quiz',        cor: '#356df1' },
    summary:    { label: 'Resumo',      cor: '#7c3aed' },
    slides:     { label: 'Slides',      cor: '#16a34a' },
    mindmap:    { label: 'Mapa Mental', cor: '#f97316' },
    flashcards: { label: 'Flashcards',  cor: '#0891b2' },
    pcd:        { label: 'Acessível',   cor: '#db2777' },
    kahoot:     { label: 'Kahoot',      cor: '#ef4444' },
    socrative:  { label: 'Socrative',   cor: '#9333ea' },
    scorm:      { label: 'SCORM',       cor: '#65a30d' },
  };

  // Paleta de cores para os avatares das atividades
  private readonly paletaAtividade = [
    '#7C3AED', '#2563EB', '#16A34A', '#F97316',
    '#DB2777', '#0891B2', '#9333EA', '#EA580C',
  ];

  ngOnInit() {
    // Gráficos e signals só rodam no browser (SSR-safe)
    if (isPlatformBrowser(this.platformId)) {
      this.carregarStats();
      this.carregarAtividades();
    }
  }

  // Atualiza todos os dados do dashboard
  atualizar() {
    this.carregarStats();
    this.carregarAtividades();
  }

  // Busca KPIs e gráficos reais de GET /api/admin/stats
  carregarStats() {
    this.carregando.set(true);

    this.api.get<AdminStats>('admin/stats').subscribe({
      next: (stats) => {
        this.totalUsuarios.set(stats.total_users ?? 0);
        this.totalDocumentos.set(stats.total_documents ?? 0);
        this.totalGeracoes.set(stats.total_generations ?? 0);
        this.ativos7dias.set(stats.active_users_7days ?? 0);

        this.chartUploads.set(this.montarChartLinha(stats.uploads_per_day ?? []));
        this.chartTipos.set(this.montarChartDonut(stats.by_type ?? []));

        this.carregando.set(false);
      },
      error: () => {
        this.toast.erro('Não foi possível carregar as métricas.', 'Erro');
        this.carregando.set(false);
      },
    });
  }

  // Busca a atividade recente real de GET /api/admin/activity
  carregarAtividades() {
    this.carregandoAtividades.set(true);

    this.api.get<{ activities: ActivityItem[] }>('admin/activity').subscribe({
      next: (res) => {
        this.atividades.set((res.activities ?? []).map((a, i) => this.mapAtividade(a, i)));
        this.carregandoAtividades.set(false);
      },
      error: () => {
        this.atividades.set([]);
        this.carregandoAtividades.set(false);
      },
    });
  }

  // Monta o gráfico de linha com uploads por dia (30d)
  private montarChartLinha(dados: { date: string; count: number }[]) {
    if (!dados.length) return null;
    return {
      labels: dados.map(d => this.formatarData(d.date)),
      datasets: [{
        label:                'Uploads',
        data:                 dados.map(d => d.count),
        fill:                 true,
        tension:              0.4,
        borderColor:          '#356df1',
        backgroundColor:      'rgba(53, 109, 241, 0.08)',
        pointBackgroundColor: '#356df1',
        pointRadius:          4,
      }],
    };
  }

  // Monta o gráfico donut com a distribuição REAL por tipo de conteúdo (by_type)
  private montarChartDonut(dados: { type: string; count: number }[]) {
    if (!dados.length) return null;
    return {
      labels: dados.map(d => this.tipoMeta[d.type]?.label ?? d.type),
      datasets: [{
        data:            dados.map(d => d.count),
        backgroundColor: dados.map(d => this.tipoMeta[d.type]?.cor ?? '#9ca3af'),
        borderWidth:     2,
        borderColor:     '#fff',
      }],
    };
  }

  // Transforma a atividade crua em view-model para o template
  private mapAtividade(a: ActivityItem, index: number): ActivityVM {
    return {
      initial: this.iniciais(a.name),
      name:    a.name,
      action:  a.action,
      time:    this.tempoRelativo(a.timestamp),
      color:   this.paletaAtividade[index % this.paletaAtividade.length],
    };
  }

  // Primeira letra do nome para o avatar
  private iniciais(nome: string): string {
    return (nome || '?').trim().charAt(0).toUpperCase();
  }

  // Converte um timestamp ISO em tempo relativo ("há 2 min", "há 3 h", "há 1 d")
  private tempoRelativo(iso: string): string {
    const data = new Date(iso).getTime();
    if (isNaN(data)) return '';
    const diff = Math.max(0, Date.now() - data);
    const min  = Math.floor(diff / 60000);
    if (min < 1)  return 'agora mesmo';
    if (min < 60) return `há ${min} min`;
    const horas = Math.floor(min / 60);
    if (horas < 24) return `há ${horas} h`;
    const dias = Math.floor(horas / 24);
    return `há ${dias} d`;
  }

  // Formata "2025-06-01" → "01/06"
  private formatarData(dateStr: string): string {
    const [, mes, dia] = dateStr.split('-');
    return `${dia}/${mes}`;
  }

  // Formata números com separador de milhar (1340 → 1.340)
  formatarNumero(n: number): string {
    return (n ?? 0).toLocaleString('pt-BR');
  }
}
