import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

/**
 * Serviço de Toast Global (US-006)
 *
 * Centraliza a exibição de mensagens de feedback ao usuário
 * utilizando o MessageService do PrimeNG.
 * Duração padrão: 4 segundos
 * Posição: top-right
 * Máximo: 3 toasts simultâneos
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private messageService: MessageService) {}

  // Exibe mensagem de sucesso — ícone check verde
  sucesso(mensagem: string, titulo: string = 'Sucesso') {
    this.messageService.add({
      severity: 'success',
      summary: titulo,
      detail: mensagem,
      life: 4000,
    });
  }

  // Exibe mensagem de erro — ícone X vermelho
  erro(mensagem: string, titulo: string = 'Erro') {
    this.messageService.add({
      severity: 'error',
      summary: titulo,
      detail: mensagem,
      life: 4000,
    });
  }

  // Exibe mensagem de aviso
  aviso(mensagem: string, titulo: string = 'Atenção') {
    this.messageService.add({
      severity: 'warn',
      summary: titulo,
      detail: mensagem,
      life: 4000,
    });
  }

  // Exibe mensagem informativa
  info(mensagem: string, titulo: string = 'Informação') {
    this.messageService.add({
      severity: 'info',
      summary: titulo,
      detail: mensagem,
      life: 4000,
    });
  }
}