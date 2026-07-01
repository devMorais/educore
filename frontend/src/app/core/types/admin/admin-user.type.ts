// Interface do usuário administrativo
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'professor' | 'student';
  avatar?: string;
  created_at: string;
  last_login_at?: string;
  email_verified_at?: string | null;
  documents_count?: number;
}
