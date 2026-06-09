import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';
import { Logo } from '../../../shared/components/logo/logo';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, Logo],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  // Campos do formulário
  email = '';
  password = '';

  // Estados de controle
  loading = signal(false);
  errorMessage = signal('');
  mostrarSenha = signal(false); // Controla visibilidade da senha

  private authService = inject(Auth);
  private router = inject(Router);
  private toast = inject(ToastService);

  // Alterna visibilidade da senha
  toggleSenha() {
    this.mostrarSenha.set(!this.mostrarSenha());
  }

  // Login com Google
  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }

  // Submissão do formulário
  onSubmit() {
    // Validação inline
    if (!this.email || !this.password) {
      this.errorMessage.set('Preencha email e senha.');
      return;
    }

    // Inicia loading e limpa erros anteriores
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login({ email: this.email, password: this.password }).subscribe({
     next: () => {
        this.loading.set(false);
        const usuario = this.authService.currentUser();
        const nome = usuario?.name?.split(' ')[0] || 'usuário';
        this.toast.sucesso(`Bem-vindo de volta, ${nome}!`, 'Login realizado');
        this.router.navigate(['/upload']);
      },
      error: (err) => {
        this.loading.set(false);

        // Mensagem em destaque vermelho para erro 401
        if (err.status === 401) {
          this.errorMessage.set('Email ou senha incorretos. Verifique suas credenciais.');
        } else {
          this.errorMessage.set(err.error?.message || 'Erro ao fazer login. Tente novamente.');
        }
      }
    });
  }
}