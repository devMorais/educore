import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  name = '';
  email = '';
  password = '';
  passwordConfirmation = '';
  loading = signal(false);
  errorMessage = signal('');

  constructor(private authService: Auth, private router: Router) {}

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }

  onSubmit() {
    if (!this.name || !this.email || !this.password || !this.passwordConfirmation) {
      this.errorMessage.set('Preencha todos os campos.');
      return;
    }

    if (this.password !== this.passwordConfirmation) {
      this.errorMessage.set('As senhas não coincidem.');
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage.set('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.register({
      name: this.name,
      email: this.email,
      password: this.password,
      password_confirmation: this.passwordConfirmation
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/upload']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Erro ao criar conta. Tente novamente.');
      }
    });
  }
}