import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ChatMessage } from '../types/chat';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Busca as últimas mensagens (usado no polling)
  getMessages(): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${this.baseUrl}/admin/chat/messages`,
      { withCredentials: true }
    );
  }

  // Envia uma nova mensagem
  sendMessage(content: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(
      `${this.baseUrl}/admin/chat/messages`,
      { content },
      { withCredentials: true }
    );
  }
}