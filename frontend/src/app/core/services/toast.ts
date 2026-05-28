import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

/**
 * Serviço de Toast Global (US-002)
 *
 * Centraliza a exibição de mensagens de feedback ao usuário
 * utilizando o MessageService do PrimeNG.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private messageService: MessageService) {}

  // Exibe mensagem de sucesso
  sucesso(mensagem: string, titulo: string = 'Sucesso') {
    this.messageService.add({
      severity: 'success',
      summary: titulo,
      detail: mensagem,
      life: 4000,
    });
  }

  // Exibe mensagem de erro
  erro(mensagem: string, titulo: string = 'Erro') {
    this.messageService.add({
      severity: 'error',
      summary: titulo,
      detail: mensagem,
      life: 5000,
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