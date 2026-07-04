// Paginação padrão do Laravel
export interface Paginated<T> {
  data: T[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}
