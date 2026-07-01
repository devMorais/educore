// Estrutura de resposta do endpoint GET /api/admin/stats
export interface AdminStats {
  total_users: number;
  total_documents: number;
  total_generations: number;
  active_users_7days: number;
  uploads_per_day: { date: string; count: number }[];
  by_type?: { type: string; count: number }[];
}
