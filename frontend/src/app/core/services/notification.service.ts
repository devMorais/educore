import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import type { NotificationItem, UnreadCount } from '../types/notification';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = inject(ApiService);

  // Lista as notificações do usuário
  listar(): Observable<NotificationItem[]> {
    return this.api.get<NotificationItem[]>('notifications');
  }

  // Busca a contagem de notificações não lidas
  contarNaoLidas(): Observable<UnreadCount> {
    return this.api.get<UnreadCount>('notifications/unread-count');
  }

  // Marca uma notificação específica como lida
  marcarComoLida(id: number): Observable<NotificationItem> {
    return this.api.patch<NotificationItem>(`notifications/${id}/read`);
  }

  // Marca todas as notificações como lidas
  marcarTodasComoLidas(): Observable<{ success: boolean }> {
    return this.api.patch<{ success: boolean }>('notifications/read-all');
  }
}
