import type { AdminUser } from './admin-user.type';

// Interface de paginação (Laravel paginate)
export interface PaginatedUsers {
  data: AdminUser[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}
