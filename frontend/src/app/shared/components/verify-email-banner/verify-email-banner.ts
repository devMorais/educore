import { Component, computed, inject, signal } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';

/**
 * Banner de aviso de verificação de email (BS-023).
 * Barra fixa no rodapé exibida quando o usuário está logado mas com o email
 * NÃO verificado (email_verified === false). Apenas AVISA — não bloqueia o uso
 * (graceful degradation). Permite reenviar o email e ser fechado.
 */
@Component({
  selector: 'app-verify-email-banner',
  template: `
    @if (mostrar()) {
      <div class="verify-banner" role="alert">
        <i class="pi pi-exclamation-triangle"></i>
        <span class="verify-banner__msg">
          Confirme seu email para ativar todos os recursos da sua conta.
        </span>
        <button class="verify-banner__btn" (click)="reenviar()" [disabled]="enviando()">
          <i class="pi pi-envelope"></i>
          {{ enviando() ? 'Enviando…' : 'Reenviar email' }}
        </button>
        <button class="verify-banner__close" (click)="fechar()" aria-label="Fechar aviso">
          <i class="pi pi-times"></i>
        </button>
      </div>
    }
  `,
  styleUrl: './verify-email-banner.scss',
})
export class VerifyEmailBanner {
  private auth = inject(Auth);
  private toast = inject(ToastService);

  enviando = signal(false);
  private fechado = signal(false);

  // Só aparece para usuário logado com email comprovadamente NÃO verificado.
  mostrar = computed(() =>
    !this.fechado()
    && this.auth.isLoggedIn()
    && this.auth.currentUser()?.email_verified === false
  );

  reenviar(): void {
    this.enviando.set(true);
    this.auth.resendVerification().subscribe({
      next: () => {
        this.toast.sucesso('Email de verificação reenviado. Confira sua caixa de entrada.');
        this.enviando.set(false);
      },
      error: () => {
        this.toast.erro('Não foi possível reenviar agora. Tente novamente mais tarde.');
        this.enviando.set(false);
      },
    });
  }

  fechar(): void {
    this.fechado.set(true);
  }
}
