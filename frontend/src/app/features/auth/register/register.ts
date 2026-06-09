import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';
import { Logo } from '../../../shared/components/logo/logo';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, Logo],
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

  // Força da senha: 0=vazia, 1=fraca, 2=média, 3=forte
  forcaSenha = signal(0);

  // Controla visibilidade das senhas
  mostrarSenha = signal(false);
  mostrarConfirmacao = signal(false);

  // Rastrea quais campos já foram visitados (blur) para não mostrar erros prematuros
  readonly tocado = { nome: false, email: false, senha: false, confirmacao: false };

  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private authService = inject(Auth);
  private router = inject(Router);
  private toast = inject(ToastService);

  toggleSenha() { this.mostrarSenha.set(!this.mostrarSenha()); }
  toggleConfirmacao() { this.mostrarConfirmacao.set(!this.mostrarConfirmacao()); }

  // --- Handlers de blur (marcam campo como visitado e validam) ---

  onNomeBlur() { this.tocado.nome = true; this.validarNome(); }
  onEmailBlur() { this.tocado.email = true; this.validarEmail(); }
  onSenhaBlur() { this.tocado.senha = true; this.validarSenha(); }
  onConfirmacaoBlur() { this.tocado.confirmacao = true; this.validarConfirmacao(); }

  // --- Handlers de input (validam somente após o campo ser visitado) ---

  onNomeInput() { if (this.tocado.nome) this.validarNome(); }
  onEmailInput() { if (this.tocado.email) this.validarEmail(); }

  // Senha: força atualiza sempre; erro somente se já visitado
  onSenhaInput() {
    this.calcularForcaSenha();
    if (this.tocado.senha) this.validarSenha();
    if (this.tocado.confirmacao && this.passwordConfirmation) this.validarConfirmacao();
  }

  // Confirmação: mismatch em tempo real; "obrigatório" somente após blur
  onConfirmacaoInput() {
    if (!this.passwordConfirmation) {
      if (this.tocado.confirmacao) this.erroConfirmacao.set('Confirme sua senha.');
      return;
    }
    this.erroConfirmacao.set(
      this.password !== this.passwordConfirmation ? 'As senhas não coincidem.' : ''
    );
  }

  // --- Validações ---

  validarNome(): boolean {
    if (!this.name) { this.erroNome.set('Nome é obrigatório.'); return false; }
    if (this.name.trim().length < 3) { this.erroNome.set('Nome deve ter no mínimo 3 caracteres.'); return false; }
    if (this.name.length > 255) { this.erroNome.set('Nome deve ter no máximo 255 caracteres.'); return false; }
    this.erroNome.set('');
    return true;
  }

  validarEmail(): boolean {
    if (!this.email) { this.erroEmail.set('Email é obrigatório.'); return false; }
    if (!this.emailRegex.test(this.email)) { this.erroEmail.set('Digite um e-mail válido.'); return false; }
    this.erroEmail.set('');
    return true;
  }

  validarSenha(): boolean {
    if (!this.password) { this.erroSenha.set('Senha é obrigatória.'); return false; }
    if (this.password.length < 8) { this.erroSenha.set('Senha deve ter no mínimo 8 caracteres.'); return false; }
    this.erroSenha.set('');
    return true;
  }

  validarConfirmacao(): boolean {
    if (!this.passwordConfirmation) { this.erroConfirmacao.set('Confirme sua senha.'); return false; }
    if (this.password !== this.passwordConfirmation) { this.erroConfirmacao.set('As senhas não coincidem.'); return false; }
    this.erroConfirmacao.set('');
    return true;
  }

  private calcularForcaSenha() {
    if (!this.password || this.password.length < 8) {
      this.forcaSenha.set(this.password.length > 0 ? 1 : 0);
      return;
    }
    let pts = 1; // mínimo 8 chars
    if (/[A-Z]/.test(this.password)) pts++;
    if (/[0-9]/.test(this.password)) pts++;
    if (/[^A-Za-z0-9]/.test(this.password)) pts++;
    this.forcaSenha.set(pts >= 3 ? 3 : pts >= 2 ? 2 : 1);
  }

  textoForca(): string {
    return ['', 'Fraca', 'Média', 'Forte'][this.forcaSenha()];
  }

  // Verificações de estado de campo para o template
  nomeOk(): boolean { return this.tocado.nome && !this.erroNome() && this.name.trim().length >= 3; }
  emailOk(): boolean { return this.tocado.email && !this.erroEmail() && this.emailRegex.test(this.email); }
  confirmacaoOk(): boolean {
    return this.passwordConfirmation.length > 0 && this.password === this.passwordConfirmation;
  }

  formularioValido(): boolean {
    return (
      this.name.trim().length >= 3 && this.name.length <= 255 &&
      this.emailRegex.test(this.email) &&
      this.password.length >= 8 &&
      this.password === this.passwordConfirmation &&
      !this.erroNome() && !this.erroEmail() && !this.erroSenha() && !this.erroConfirmacao()
    );
  }

  loginWithGoogle() { this.authService.loginWithGoogle(); }

  onSubmit() {
    // Marca todos como visitados e valida antes de enviar
    this.tocado.nome = true; this.tocado.email = true;
    this.tocado.senha = true; this.tocado.confirmacao = true;

    // Executa todas as validações (sem short-circuit) para exibir todos os erros de uma vez
    this.validarNome();
    this.validarEmail();
    this.validarSenha();
    this.validarConfirmacao();
    if (!this.formularioValido()) return;

    this.loading.set(true);

    this.authService.register({
      name: this.name.trim(),
      email: this.email,
      password: this.password,
      password_confirmation: this.passwordConfirmation
    }).subscribe({
      next: () => {
        this.loading.set(false);
        const nome = this.authService.currentUser()?.name?.split(' ')[0] || 'usuário';
        this.toast.sucesso(`Bem-vindo ao EduCore, ${nome}!`, 'Conta criada com sucesso');
        this.router.navigate(['/upload']);
      },
      error: (err) => {
        this.loading.set(false);
        const erros = err.error?.errors;
        if (erros?.email) this.erroEmail.set(erros.email[0]);
        if (erros?.name) this.erroNome.set(erros.name[0]);
        if (!erros) this.toast.erro(err.error?.message || 'Erro ao criar conta. Tente novamente.');
      }
    });
  }
}
