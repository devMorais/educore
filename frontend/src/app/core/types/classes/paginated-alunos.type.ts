import type { Aluno } from './aluno.type';

export interface PaginatedAlunos {
  data: Aluno[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}
