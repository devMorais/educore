import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface AuthResponse {
  token?: string;
  access_token?: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private baseUrl = environment.apiUrl;

  isLoggedIn = signal<boolean>(false);
  currentUser = signal<AuthUser | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.isLoggedIn.set(!!localStorage.getItem('token'));
      const raw = localStorage.getItem('user');
      this.currentUser.set(raw ? JSON.parse(raw) : null);
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  loginWithGoogle() {
    this.http.get<{ url: string }>(`${this.baseUrl}/auth/google`).subscribe({
      next: (res) => {
        if (this.isBrowser()) {
          window.location.href = res.url;
        }
      },
    });
  }

  exchangeGoogleCode(code: string, state: string) {
    return this.http
      .get<AuthResponse>(`${this.baseUrl}/auth/google/callback`, {
        params: { code, state },
      })
      .pipe(tap((res) => this.persistSession(res)));
  }

  login(credentials: LoginRequest) {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(tap(res => this.persistSession(res)));
  }

  register(data: RegisterRequest) {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/register`, data)
      .pipe(tap(res => this.persistSession(res)));
  }

  logout() {
    this.http
      .post(`${this.baseUrl}/auth/logout`, {})
      .subscribe({ error: () => { } });
    this.clearSession();
  }

  clearSession() {
    if (this.isBrowser()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('educore_result');
    }
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
  forgotPassword(email: string) {
    return this.http.post(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem('token');
  }

  private persistSession(res: AuthResponse) {
    const token = res.token ?? res.access_token ?? '';
    if (this.isBrowser()) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    this.isLoggedIn.set(true);
    this.currentUser.set(res.user);
  }
}
