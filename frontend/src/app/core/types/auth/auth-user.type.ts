export interface AuthUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  email_verified?: boolean; // BS-023: verificação de email
}
