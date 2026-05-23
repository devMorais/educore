import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal('');

  constructor(private authService: Auth, private router: Router) {}

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Preencha email e senha.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/upload']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Email ou senha incorretos.');
      }
    });
  }
}