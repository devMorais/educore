import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Upload } from './features/upload/upload';
import { Result } from './features/result/result';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'cadastro',
    component: Register
  },
  {
    path: 'upload',
    component: Upload
  },
  {
    path: 'resultado',
    component: Result
  }
];