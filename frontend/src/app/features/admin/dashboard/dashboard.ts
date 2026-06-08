import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { AvatarModule } from 'primeng/avatar';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';

// Interface das métricas do dashboard
interface DashboardStats {
  total_users: number;
  total_documents: number;
  total_generations: number;
  active_users_7days: number;
  uploads_per_day: { date: string; count: number }[];
  registrations_per_day: { date: string; count: number }[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ChartModule, AvatarModule, CommonModule, Skeleton],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private auth  = inject(Auth);
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  userName = computed(() => this.auth.currentUser()?.name?.split(' ')[0] ?? 'Admin');

  // Estado de loading
  carregando = signal(true);

  // Métricas vindas da API
  stats = signal<DashboardStats | null>(null);

  // Dados do gráfico
  chartData = signal<any>(null);

  readonly chartOptions = {
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#F3F4F6' } },
      x: { grid: { display: false } }
    }
  };

  // Atividades recentes (estáticas por ora)
  activities = signal([
    { id: 1, initial: 'A', name: 'Ana Silva',      action: 'Enviou um novo PDF', time: '2min',  color: '#7C3AED' },
    { id: 2, initial: 'C', name: 'Carlos Mendes',  action: 'Gerou um quiz',      time: '15min', color: '#2563EB' },
    { id: 3, initial: 'M', name: 'Maria Costa',    action: 'Exportou slides',    time: '1h',    color: '#16A34A' },
    { id: 4, initial: 'J', name: 'João Pedro',     action: 'Criou uma conta',    time: '2h',    color: '#F97316' },
    { id: 5, initial: 'L', name: 'Lucia Ferreira', action: 'Enviou um novo PDF', time: '3h',    color: '#DB2777' },
  ]);

  // Carregamento separado para atividades
  carregandoAtividades = signal(true);

  ngOnInit() {
    this.carregarStats();
  }

  carregarStats() {
    this.carregando.set(true);
    this.carregandoAtividades.set(true);

    this.api.get<DashboardStats>('admin/stats').subscribe({
      next: (data) => {
        this.stats.set(data);
        this.montarGrafico(data);
        this.carregando.set(false);
        // Simula delay das atividades para demonstrar skeleton independente
        setTimeout(() => this.carregandoAtividades.set(false), 300);
      },
      error: () => {
        this.carregando.set(false);
        this.carregandoAtividades.set(false);
        this.toast.erro('Erro ao carregar métricas.', 'Erro');
        // Fallback com dados estáticos
        this.chartData.set(this.chartDataFallback());
      },
    });
  }

  // Monta o gráfico com dados reais da API
  private montarGrafico(data: DashboardStats) {
    const uploads = data.uploads_per_day ?? [];
    if (uploads.length > 0) {
      this.chartData.set({
        labels: uploads.map(u => {
          const d = new Date(u.date);
          return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }),
        datasets: [{
          label: 'PDFs enviados',
          data: uploads.map(u => u.count),
          backgroundColor: 'rgba(124, 58, 237, 0.7)',
          borderRadius: 8,
        }]
      });
    } else {
      this.chartData.set(this.chartDataFallback());
    }
  }

  // Dados fallback caso a API não retorne uploads_per_day
  private chartDataFallback() {
    return {
      labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      datasets: [{
        label: 'PDFs enviados',
        data: [42, 58, 35, 71, 89, 24, 16],
        backgroundColor: 'rgba(124, 58, 237, 0.7)',
        borderRadius: 8,
      }]
    };
  }

  // Array auxiliar para os skeletons dos cards de métricas
  readonly skeletonCards = [1, 2, 3, 4];
  readonly skeletonAtividades = [1, 2, 3, 4, 5];
}