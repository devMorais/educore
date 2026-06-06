import { Component, computed, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { AvatarModule } from 'primeng/avatar';
import { Auth } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast';

// Estrutura de resposta do endpoint /api/admin/stats
interface AdminStats {
  total_users:           number;
  total_documents:       number;
  total_generations:     number;
  active_users_7days:    number;
  uploads_per_day:       { date: string; count: number }[];
  registrations_per_day: { date: string; count: number }[];
}

// Estrutura de atividade recente
interface Atividade {
  id:      number;
  initial: string;
  name:    string;
  action:  string;
  time:    string;
  color:   string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ChartModule, AvatarModule],
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

  // Estado de carregamento
  carregando = signal(true);

  // KPIs vindos da API
  totalUsuarios   = signal(0);
  totalDocumentos = signal(0);
  totalGeracoes   = signal(0);
  ativos7dias     = signal(0);

  // Dados dos gráficos
  chartUploads = signal<any>(null);
  chartTipos   = signal<any>(null);

  // Opções do gráfico de linha
  readonly opcoesLinha = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#F3F4F6' } },
      x: { grid: { display: false }, ticks: { maxTicksLimit: 7 } },
    },
  };

  // Opções do gráfico donut
  readonly opcoesPizza = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } },
    },
  };

  // Últimas 10 atividades recentes
  readonly atividades: Atividade[] = [
    { id: 1,  initial: 'A', name: 'Ana Silva',      action: 'Enviou um novo PDF',   time: '2min',  color: '#7C3AED' },
    { id: 2,  initial: 'C', name: 'Carlos Mendes',  action: 'Gerou um quiz',        time: '15min', color: '#2563EB' },
    { id: 3,  initial: 'M', name: 'Maria Costa',    action: 'Exportou slides',      time: '1h',    color: '#16A34A' },
    { id: 4,  initial: 'J', name: 'João Pedro',     action: 'Criou uma conta',      time: '2h',    color: '#F97316' },
    { id: 5,  initial: 'L', name: 'Lucia Ferreira', action: 'Enviou um novo PDF',   time: '3h',    color: '#DB2777' },
    { id: 6,  initial: 'R', name: 'Rafael Souza',   action: 'Gerou flashcards',     time: '4h',    color: '#0891B2' },
    { id: 7,  initial: 'P', name: 'Paula Rocha',    action: 'Gerou mapa mental',    time: '5h',    color: '#65A30D' },
    { id: 8,  initial: 'T', name: 'Tiago Alves',    action: 'Acessou conteúdo PCD', time: '6h',    color: '#DC2626' },
    { id: 9,  initial: 'F', name: 'Fernanda Lima',  action: 'Enviou um novo PDF',   time: '7h',    color: '#9333EA' },
    { id: 10, initial: 'B', name: 'Bruno Castro',   action: 'Gerou resumo',         time: '8h',    color: '#EA580C' },
  ];

  ngOnInit() {
    // Gráficos só funcionam no browser (SSR)
    if (isPlatformBrowser(this.platformId)) {
      this.carregarStats();
    }
  }

  // Busca dados reais do endpoint GET /api/admin/stats
  carregarStats() {
    this.carregando.set(true);

    this.api.get<AdminStats>('admin/stats').subscribe({
      next: (stats) => {
        // Preenche os KPIs
        this.totalUsuarios.set(stats.total_users);
        this.totalDocumentos.set(stats.total_documents);
        this.totalGeracoes.set(stats.total_generations);
        this.ativos7dias.set(stats.active_users_7days);

        // Monta os gráficos
        this.chartUploads.set(this.montarChartLinha(stats.uploads_per_day));
        this.chartTipos.set(this.montarChartDonut(stats.total_generations));

        this.carregando.set(false);
      },
      error: () => {
        this.toast.erro('Não foi possível carregar as métricas.', 'Erro');
        this.carregando.set(false);
      },
    });
  }

  // Monta gráfico de linha com uploads por dia (30d)
  private montarChartLinha(dados: { date: string; count: number }[]) {
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

  // Monta gráfico donut com distribuição estimada por tipo de conteúdo
  private montarChartDonut(totalGeracoes: number) {
    const proporcoes = [0.25, 0.20, 0.18, 0.15, 0.12, 0.10];
    const totais = proporcoes.map(p => Math.round(totalGeracoes * p));

    return {
      labels: ['Quiz', 'Resumo', 'Slides', 'Mapa Mental', 'Flashcards', 'PCD'],
      datasets: [{
        data:            totais,
        backgroundColor: ['#356df1', '#7c3aed', '#16a34a', '#f97316', '#0891b2', '#db2777'],
        borderWidth:     2,
        borderColor:     '#fff',
      }],
    };
  }

  // Formata "2025-06-01" → "01/06"
  private formatarData(dateStr: string): string {
    const [, mes, dia] = dateStr.split('-');
    return `${dia}/${mes}`;
  }

  // Formata números com ponto separador (1340 → 1.340)
  formatarNumero(n: number): string {
    return n.toLocaleString('pt-BR');
  }
}