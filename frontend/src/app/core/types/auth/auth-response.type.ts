import type { AuthUser } from './auth-user.type';

export interface AuthResponse {
  token?: string;
  access_token?: string;
  expires_at?: string;
  user: AuthUser;
}
