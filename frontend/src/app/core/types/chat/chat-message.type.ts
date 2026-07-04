import type { ChatSender } from './chat-sender.type';

// Mensagem do chat administrativo
export interface ChatMessage {
  id: number;
  content: string;
  created_at: string;
  user: ChatSender;
}
