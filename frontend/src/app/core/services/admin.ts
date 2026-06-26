import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interface do usuário administrativo
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'professor' | 'student';
  avatar?: string;
  created_at: string;
  last_login_at?: string;
  email_verified_at?: string | null;
  documents_count?: number;
}

// Interface de paginação (Laravel paginate)
export interface PaginatedUsers {
  data: AdminUser[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

// Interface de filtros
export interface UserFilters {
  search?: string;
  role?: string;
  page?: number;
  per_page?: number;
}

// Interface para criação de professor
export interface CreateProfessorPayload {
  name: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Lista usuários com filtros e paginação
  listUsers(filters: UserFilters = {}): Observable<PaginatedUsers> {
    let params = new HttpParams();
    if (filters.search)   params = params.set('search', filters.search);
    if (filters.role)     params = params.set('role', filters.role);
    if (filters.page)     params = params.set('page', filters.page.toString());
    if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
    return this.http.get<PaginatedUsers>(`${this.baseUrl}/admin/users`, { params, withCredentials: true });
  }

  // Cria um novo professor
  createProfessor(payload: CreateProfessorPayload): Observable<{ message: string; user: AdminUser }> {
    return this.http.post<{ message: string; user: AdminUser }>(
      `${this.baseUrl}/admin/professors`,
      payload,
      { withCredentials: true }
    );
  }

  // Muda o role do usuário
  updateRole(id: number, role: 'admin' | 'professor' | 'student'): Observable<{ message: string; user: AdminUser }> {
    return this.http.patch<{ message: string; user: AdminUser }>(
      `${this.baseUrl}/admin/users/${id}/role`,
      { role },
      { withCredentials: true }
    );
  }

  // Bloqueia ou desbloqueia o usuário
  toggleBlock(id: number, active: boolean): Observable<{ message: string; user: AdminUser }> {
    return this.http.patch<{ message: string; user: AdminUser }>(
      `${this.baseUrl}/admin/users/${id}/status`,
      { active },
      { withCredentials: true }
    );
  }

  // Exporta usuários como CSV
  exportCsvLocal(usuarios: AdminUser[]): void {
    const cabecalho = ['ID', 'Nome', 'Email', 'Perfil', 'Cadastro', 'Status'];
    const linhas = usuarios.map(u => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.role,
      new Date(u.created_at).toLocaleDateString('pt-BR'),
      u.email_verified_at ? 'Ativo' : 'Bloqueado',
    ]);
    const csv = [cabecalho, ...linhas].map(l => l.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `usuarios_educore_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}