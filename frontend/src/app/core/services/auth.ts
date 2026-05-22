import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private baseUrl = environment.apiUrl;

  isLoggedIn = signal<boolean>(false);
  currentUser = signal<AuthResponse['user'] | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.isLoggedIn.set(!!localStorage.getItem('token'));
      const user = localStorage.getItem('user');
      this.currentUser.set(user ? JSON.parse(user) : null);
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  login(credentials: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (this.isBrowser()) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
        }
        this.isLoggedIn.set(true);
        this.currentUser.set(response.user);
      })
    );
  }

  register(data: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, data).pipe(
      tap(response => {
        if (this.isBrowser()) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
        }
        this.isLoggedIn.set(true);
        this.currentUser.set(response.user);
      })
    );
  }

  logout() {
    const token = this.getToken();
    this.http.post(`${this.baseUrl}/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe();
    if (this.isBrowser()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem('token');
  }
}