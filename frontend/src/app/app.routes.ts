import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Upload } from './features/upload/upload';
import { Result } from './features/result/result';
import { GoogleCallback } from './features/auth/google-callback/google-callback';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'cadastro', component: Register, canActivate: [guestGuard] },
  { path: 'auth/google/callback', component: GoogleCallback },
  { path: 'upload', component: Upload, canActivate: [authGuard] },
  { path: 'resultado', component: Result, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
