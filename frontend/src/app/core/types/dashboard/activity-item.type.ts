// Estrutura crua de atividade vinda de GET /api/admin/activity
export interface ActivityItem {
  type: string;
  name: string;
  action: string;
  timestamp: string;
}
