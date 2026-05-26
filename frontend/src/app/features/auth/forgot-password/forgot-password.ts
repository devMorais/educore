import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword {
  email = '';
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(private auth: Auth) {}

  onSubmit() {
    if (!this.email) return;
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.auth.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('E-mail enviado! Verifique sua caixa de entrada.');
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Não foi possível enviar o e-mail. Tente novamente.');
      }
    });
  }
}