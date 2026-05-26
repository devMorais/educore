import { Component, computed, inject } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { AvatarModule } from 'primeng/avatar';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ChartModule, AvatarModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private auth = inject(Auth);
  userName = computed(() => this.auth.currentUser()?.name?.split(' ')[0] ?? 'Admin');

  chartData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'PDFs enviados',
        data: [42, 58, 35, 71, 89, 24, 16],
        backgroundColor: 'rgba(124, 58, 237, 0.7)',
        borderRadius: 8,
      }
    ]
  };

  chartOptions = {
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#F3F4F6' } },
      x: { grid: { display: false } }
    }
  };

  activities = [
    { id: 1, initial: 'A', name: 'Ana Silva', action: 'Enviou um novo PDF', time: '2min', color: '#7C3AED' },
    { id: 2, initial: 'C', name: 'Carlos Mendes', action: 'Gerou um quiz', time: '15min', color: '#2563EB' },
    { id: 3, initial: 'M', name: 'Maria Costa', action: 'Exportou slides', time: '1h', color: '#16A34A' },
    { id: 4, initial: 'J', name: 'João Pedro', action: 'Criou uma conta', time: '2h', color: '#F97316' },
    { id: 5, initial: 'L', name: 'Lucia Ferreira', action: 'Enviou um novo PDF', time: '3h', color: '#DB2777' },
  ];
}