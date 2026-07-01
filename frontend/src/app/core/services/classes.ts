import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Turma {
  id: number;
  name: string;
  description?: string;
  students_count: number;
  created_at: string;
}

export interface Aluno {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface PaginatedAlunos {
  data: Aluno[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface TurmaPayload {
  name: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class ClassesService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  listar(): Observable<Turma[]> {
    return this.http.get<Turma[]>(`${this.baseUrl}/classes`, { withCredentials: true });
  }

  criar(payload: TurmaPayload): Observable<Turma> {
    return this.http.post<Turma>(`${this.baseUrl}/classes`, payload, { withCredentials: true });
  }

  listarAlunos(classId: number): Observable<PaginatedAlunos> {
    return this.http.get<PaginatedAlunos>(`${this.baseUrl}/classes/${classId}/students`, { withCredentials: true });
  }

  buscarAlunos(search: string): Observable<PaginatedAlunos> {
    const params = new HttpParams().set('search', search).set('role', 'student');
    return this.http.get<PaginatedAlunos>(`${this.baseUrl}/admin/users`, { params, withCredentials: true });
  }

  matricular(classId: number, userId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/classes/${classId}/enroll`,
      { user_id: userId },
      { withCredentials: true }
    );
  }

  remover(classId: number, userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/classes/${classId}/enroll/${userId}`,
      { withCredentials: true }
    );
  }
}