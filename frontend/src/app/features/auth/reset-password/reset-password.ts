import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { Auth } from '../../../core/services/auth.service';
import { Logo } from '../../../shared/components/atoms';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink, Logo],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPassword implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  token = '';
  email = '';
  password = '';
  passwordConfirmation = '';

  loading = signal(false);
  sucesso = signal(false);
  linkInvalido = signal(false);
  erroSenha = signal('');
  erroConfirmacao = signal('');
  erroGeral = signal('');

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    this.token = params.get('token') ?? '';
    this.email = params.get('email') ?? '';

    if (!this.token || !this.email) {
      this.linkInvalido.set(true);
    }
  }

  onPasswordBlur() {
    this.validarSenha();
  }

  onPasswordInput() {
    if (this.erroSenha()) this.validarSenha();
  }

  private validarSenha(): boolean {
    if (!this.password) {
      this.erroSenha.set('Digite a nova senha.');
      return false;
    }
    if (this.password.length < 8) {
      this.erroSenha.set('A senha deve ter pelo menos 8 caracteres.');
      return false;
    }
    this.erroSenha.set('');
    return true;
  }

  private validarConfirmacao(): boolean {
    if (this.password !== this.passwordConfirmation) {
      this.erroConfirmacao.set('As senhas não coincidem.');
      return false;
    }
    this.erroConfirmacao.set('');
    return true;
  }

  onSubmit() {
    this.erroGeral.set('');

    const senhaOk = this.validarSenha();
    const confirmacaoOk = this.validarConfirmacao();
    if (!senhaOk || !confirmacaoOk) return;

    this.loading.set(true);

    this.auth
      .resetPassword({
        token: this.token,
        email: this.email,
        password: this.password,
        password_confirmation: this.passwordConfirmation,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.sucesso.set(true);
          setTimeout(() => this.router.navigate(['/login']), 3000);
        },
        error: (err: any) => {
          this.loading.set(false);
          this.erroGeral.set(
            err?.error?.message ?? 'Não foi possível redefinir a senha. O link pode ter expirado.'
          );
        },
      });
  }
}