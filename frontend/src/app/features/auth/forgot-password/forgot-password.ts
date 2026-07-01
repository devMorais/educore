import { Component, signal, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Auth } from '../../../core/services/auth.service';
import { Logo } from '../../../shared/components/atoms';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink, Logo],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword implements OnDestroy {
  email = '';
  loading = signal(false);
  enviado = signal(false);
  erroEmail = signal('');
  countdown = signal(5);

  private emailTocado = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  private auth = inject(Auth);
  private router = inject(Router);

  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  ngOnDestroy() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.intervalId) clearInterval(this.intervalId);
  }

  onEmailBlur() {
    this.emailTocado = true;
    this.validarEmail();
  }

  onEmailInput() {
    if (this.emailTocado) this.validarEmail();
  }

  private validarEmail(): boolean {
    if (!this.email) {
      this.erroEmail.set('Digite seu e-mail.');
      return false;
    }
    if (!this.emailRegex.test(this.email)) {
      this.erroEmail.set('Digite um e-mail válido.');
      return false;
    }
    this.erroEmail.set('');
    return true;
  }

  onSubmit() {
    this.emailTocado = true;
    if (!this.validarEmail()) return;

    this.loading.set(true);

    this.auth.forgotPassword(this.email).subscribe({
      next: () => this.onEnviado(),
      error: () => this.onEnviado()
    });
  }

  private onEnviado() {
    this.loading.set(false);
    this.enviado.set(true);
    this.countdown.set(5);

    // Decrementa o contador a cada segundo para exibição animada
    this.intervalId = setInterval(() => {
      const restante = this.countdown() - 1;
      this.countdown.set(restante);
      if (restante <= 0) {
        clearInterval(this.intervalId!);
        this.intervalId = null;
      }
    }, 1000);

    this.timeoutId = setTimeout(() => this.router.navigate(['/login']), 5000);
  }
}
