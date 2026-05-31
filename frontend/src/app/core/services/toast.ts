import { Injectable } from '@angular/core';
import { Message, MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private ativas = 0;
  private readonly MAX = 3;

  constructor(private messageService: MessageService) {}

  private mostrar(msg: Message): void {
    if (this.ativas >= this.MAX) {
      this.messageService.clear();
      this.ativas = 0;
    }
    this.messageService.add(msg);
    this.ativas++;
    // Decrementa quando o toast expirar (300ms de margem para animação de saída)
    setTimeout(() => { this.ativas = Math.max(0, this.ativas - 1); }, (msg.life ?? 4000) + 300);
  }

  sucesso(mensagem: string, titulo: string = 'Sucesso') {
    this.mostrar({ severity: 'success', summary: titulo, detail: mensagem, life: 4000 });
  }

  erro(mensagem: string, titulo: string = 'Erro') {
    this.mostrar({ severity: 'error', summary: titulo, detail: mensagem, life: 4000 });
  }

  aviso(mensagem: string, titulo: string = 'Atenção') {
    this.mostrar({ severity: 'warn', summary: titulo, detail: mensagem, life: 4000 });
  }

  info(mensagem: string, titulo: string = 'Informação') {
    this.mostrar({ severity: 'info', summary: titulo, detail: mensagem, life: 4000 });
  }
}
