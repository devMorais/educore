// Formato consumido pelo PrimeNG ChartModule (chart.js) — usado pelos gráficos do dashboard admin
export interface ChartLineData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    fill: boolean;
    tension: number;
    borderColor: string;
    backgroundColor: string;
    pointBackgroundColor: string;
    pointRadius: number;
  }[];
}

export interface ChartDonutData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderWidth: number;
    borderColor: string;
  }[];
}
