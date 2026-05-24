import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Upload } from './features/upload/upload';
import { Result } from './features/result/result';
import { GoogleCallback } from './features/auth/google-callback/google-callback';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { Summary } from './features/result/types/summary/summary';
import { Quiz } from './features/result/types/quiz/quiz';
import { Slides } from './features/result/types/slides/slides';
import { Mindmap } from './features/result/types/mindmap/mindmap';
import { Flashcards } from './features/result/types/flashcards/flashcards';
import { Pcd } from './features/result/types/pcd/pcd';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'cadastro', component: Register, canActivate: [guestGuard] },
  { path: 'auth/google/callback', component: GoogleCallback },
  { path: 'upload', component: Upload, canActivate: [authGuard] },
  {
    path: 'resultado',
    canActivate: [authGuard],
    children: [
      { path: 'quiz', component: Quiz },
      { path: 'summary', component: Summary },
      { path: 'slides', component: Slides },
      { path: 'mindmap', component: Mindmap },
      { path: 'flashcards', component: Flashcards },
      { path: 'pcd', component: Pcd },
      { path: '', component: Result },
    ],
  },
  { path: '**', redirectTo: '' },
];