import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Remetente da mensagem (dados básicos do usuário)
export interface ChatSender {
  id: number;
  name: string;
  avatar?: string;
}

// Mensagem do chat administrativo
export interface ChatMessage {
  id: number;
  content: string;
  created_at: string;
  user: ChatSender;
}

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