import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AdminUser, PaginatedUsers, UserFilters } from '../types/admin';

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

  // Muda o role do usuário
  updateRole(id: number, role: 'admin' | 'professor' | 'student'): Observable<{ message: string; user: AdminUser }> {
    return this.http.patch<{ message: string; user: AdminUser }>(
      `${this.baseUrl}/admin/users/${id}/role`,
      { role },
      { withCredentials: true }
    );
  }

  // Bloqueia ou desbloqueia o usuário (backend usa /status com campo active)
  toggleBlock(id: number, active: boolean): Observable<{ message: string; user: AdminUser }> {
    return this.http.patch<{ message: string; user: AdminUser }>(
      `${this.baseUrl}/admin/users/${id}/status`,
      { active },
      { withCredentials: true }
    );
  }

  // Exporta usuários como CSV (gerado no frontend com os dados já carregados)
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