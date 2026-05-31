import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';

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

  // Erros inline por campo
  erroNome = signal('');
  erroEmail = signal('');
  erroSenha = signal('');
  erroConfirmacao = signal('');

  // Controla visibilidade das senhas
  mostrarSenha = signal(false);
  mostrarConfirmacao = signal(false);

  // Força da senha: 0=vazia, 1=fraca, 2=média, 3=forte
  forcaSenha = signal(0);

  private authService = inject(Auth);
  private router = inject(Router);
  private toast = inject(ToastService);

  toggleSenha() {
    this.mostrarSenha.set(!this.mostrarSenha());
  }

  toggleConfirmacao() {
    this.mostrarConfirmacao.set(!this.mostrarConfirmacao());
  }

  // Valida nome em tempo real
  validarNome() {
    if (!this.name) {
      this.erroNome.set('Nome é obrigatório.');
    } else if (this.name.length < 3) {
      this.erroNome.set('Nome deve ter no mínimo 3 caracteres.');
    } else if (this.name.length > 255) {
      this.erroNome.set('Nome deve ter no máximo 255 caracteres.');
    } else {
      this.erroNome.set('');
    }
  }

  // Valida email em tempo real
  validarEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email) {
      this.erroEmail.set('Email é obrigatório.');
    } else if (!emailRegex.test(this.email)) {
      this.erroEmail.set('Digite um email válido.');
    } else {
      this.erroEmail.set('');
    }
  }

  // Calcula força da senha e valida
  validarSenha() {
    if (!this.password) {
      this.forcaSenha.set(0);
      this.erroSenha.set('Senha é obrigatória.');
      return;
    }

    if (this.password.length < 8) {
      this.forcaSenha.set(1);
      this.erroSenha.set('Senha deve ter no mínimo 8 caracteres.');
      return;
    }

    // Calcula força
    let forca = 0;
    if (this.password.length >= 8) forca++;
    if (/[A-Z]/.test(this.password)) forca++;
    if (/[0-9]/.test(this.password)) forca++;
    if (/[^A-Za-z0-9]/.test(this.password)) forca++;

    this.forcaSenha.set(forca >= 3 ? 3 : forca >= 2 ? 2 : 1);
    this.erroSenha.set('');

    // Revalida confirmação se já preenchida
    if (this.passwordConfirmation) {
      this.validarConfirmacao();
    }
  }

  // Valida confirmação de senha em tempo real
  validarConfirmacao() {
    if (!this.passwordConfirmation) {
      this.erroConfirmacao.set('Confirme sua senha.');
    } else if (this.password !== this.passwordConfirmation) {
      this.erroConfirmacao.set('As senhas não coincidem.');
    } else {
      this.erroConfirmacao.set('');
    }
  }

  // Texto da força da senha
  textoForca(): string {
    const textos = ['', 'Fraca', 'Média', 'Forte'];
    return textos[this.forcaSenha()];
  }

  // Verifica se o formulário é válido
  formularioValido(): boolean {
    return (
      this.name.length >= 3 &&
      this.name.length <= 255 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email) &&
      this.password.length >= 8 &&
      this.password === this.passwordConfirmation &&
      !this.erroNome() &&
      !this.erroEmail() &&
      !this.erroSenha() &&
      !this.erroConfirmacao()
    );
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }

  onSubmit() {
    // Valida todos os campos antes de submeter
    this.validarNome();
    this.validarEmail();
    this.validarSenha();
    this.validarConfirmacao();

    if (!this.formularioValido()) return;

    this.loading.set(true);

    this.authService.register({
      name: this.name,
      email: this.email,
      password: this.password,
      password_confirmation: this.passwordConfirmation
    }).subscribe({
      next: () => {
        this.loading.set(false);
        const nome = this.authService.currentUser()?.name?.split(' ')[0] || 'usuário';
        this.toast.sucesso(`Bem-vindo ao EduCore, ${nome}!`, 'Conta criada');
        this.router.navigate(['/upload']);
      },
      error: (err) => {
        this.loading.set(false);
        const erros = err.error?.errors;
        if (erros?.email) {
          this.erroEmail.set(erros.email[0]);
        }
        if (erros?.name) {
          this.erroNome.set(erros.name[0]);
        }
      }
    });
  }
}