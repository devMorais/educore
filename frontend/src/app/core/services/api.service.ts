import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  get<T>(endpoint: string) {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`);
  }

  post<T>(endpoint: string, body: unknown) {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body);
  }

  // Adicionado para a US-005 — marcar notificações como lidas
  patch<T>(endpoint: string, body: unknown = {}) {
    return this.http.patch<T>(`${this.baseUrl}/${endpoint}`, body);
  }
}
