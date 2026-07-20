import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { ForgotPassword } from './features/auth/forgot-password/forgot-password';
import { ResetPassword } from './features/auth/reset-password/reset-password';
import { Panel } from './features/panel/panel';
import { Result } from './features/result/result';
import { GoogleCallback } from './features/auth/google-callback/google-callback';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';
import { Summary } from './features/result/types/summary/summary';
import { Quiz } from './features/result/types/quiz/quiz';
import { Slides } from './features/result/types/slides/slides';
import { Mindmap } from './features/result/types/mindmap/mindmap';
import { Flashcards } from './features/result/types/flashcards/flashcards';
import { Pcd } from './features/result/types/pcd/pcd';
import { Layout } from './features/admin/layout/layout';
import { Dashboard } from './features/admin/dashboard/dashboard';
import { Users } from './features/admin/users/users';
import { Professors } from './features/admin/professors/professors';
import { Students } from './features/admin/students/students';
import { Chat } from './features/admin/chat/chat';
import { Forum } from './features/admin/forum/forum';
import { NotFound } from './features/errors/not-found/not-found';
import { Forbidden } from './features/errors/forbidden/forbidden';
import { Profile } from './features/profile/profile';
import { ClassesComponent } from './features/classes/classes';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'cadastro', component: Register, canActivate: [guestGuard] },
  { path: 'esqueci-senha', component: ForgotPassword, canActivate: [guestGuard] },
  { path: 'redefinir-senha', component: ResetPassword, canActivate: [guestGuard] },
  { path: 'auth/google/callback', component: GoogleCallback },
  // Painel — upload de PDF e geração de conteúdo, tudo em um único lugar
  { path: 'painel', component: Panel, canActivate: [authGuard] },
  { path: 'upload', redirectTo: 'painel' },
  { path: 'perfil', component: Profile, canActivate: [authGuard] },
  { path: 'turmas', component: ClassesComponent, canActivate: [authGuard] },
  {
    path: 'resultado',
    canActivate: [authGuard],
    children: [
      { path: 'quiz',       component: Quiz },
      { path: 'summary',    component: Summary },
      { path: 'slides',     component: Slides },
      { path: 'mindmap',    component: Mindmap },
      { path: 'flashcards', component: Flashcards },
      { path: 'pcd',        component: Pcd },
      { path: '',           component: Result },
    ],
  },
  {
    path: 'admin',
    component: Layout,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '',            component: Dashboard },
      { path: 'usuarios',    component: Users },
      { path: 'professores', component: Professors },
      { path: 'alunos',      component: Students },
      { path: 'chat',        component: Chat },
      { path: 'forum',       component: Forum },
    ],
  },
  { path: '403', component: Forbidden },
  { path: '404', component: NotFound },
  { path: '**', redirectTo: '404' },
];