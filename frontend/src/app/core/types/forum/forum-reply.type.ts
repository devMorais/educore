import type { ForumAuthor } from './forum-author.type';

// Resposta de um tópico
export interface ForumReply {
  id: number;
  topic_id: number;
  body: string;
  user: ForumAuthor;
  created_at: string;
}
