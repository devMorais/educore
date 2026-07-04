import type { ForumAuthor } from './forum-author.type';

// Tópico do fórum
export interface ForumTopic {
  id: number;
  title: string;
  body: string;
  user: ForumAuthor;
  replies_count: number;
  last_reply_at: string | null;
  created_at: string;
}
