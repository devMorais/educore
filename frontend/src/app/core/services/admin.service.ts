import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AdminUser, PaginatedUsers, UserFilters } from '../types/admin';

// Interface para criação de usuário (professor ou aluno)
export interface CreateUserPayload {
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
    return this.http.get<PaginatedUsers>(`${this.baseUrl}/admin/users`, { params });
  }

  // Cria um novo professor
  createProfessor(payload: CreateUserPayload): Observable<{ message: string; user: AdminUser }> {
    return this.http.post<{ message: string; user: AdminUser }>(
      `${this.baseUrl}/admin/professors`,
      payload,
    );
  }

  // Cria um novo aluno
  createStudent(payload: CreateUserPayload): Observable<{ message: string; user: AdminUser }> {
    return this.http.post<{ message: string; user: AdminUser }>(
      `${this.baseUrl}/admin/students`,
      payload,
    );
  }

  // Muda o role do usuário
  updateRole(id: number, role: 'admin' | 'professor' | 'student'): Observable<{ message: string; user: AdminUser }> {
    return this.http.patch<{ message: string; user: AdminUser }>(
      `${this.baseUrl}/admin/users/${id}/role`,
      { role },
    );
  }

  // Bloqueia ou desbloqueia o usuário
  toggleBlock(id: number, active: boolean): Observable<{ message: string; user: AdminUser }> {
    return this.http.patch<{ message: string; user: AdminUser }>(
      `${this.baseUrl}/admin/users/${id}/status`,
      { active },
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
      u.status === 'blocked' ? 'Bloqueado' : 'Ativo',
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
