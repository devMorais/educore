 import { Component, inject, signal, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Auth } from '../../core/services/auth';
import { ToastService } from '../../core/services/toast';
import { environment } from '../../../environments/environment';

// Página de Perfil do Usuário (US-027)
@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private http        = inject(HttpClient);
  private toast       = inject(ToastService);
  private platformId  = inject(PLATFORM_ID);
  readonly auth       = inject(Auth);

  private baseUrl = environment.apiUrl;

  // Campos do formulário
  nome         = signal('');
  emailDisplay = signal('');

  // Preview do avatar antes de salvar
  avatarPreview = signal<string | null>(null);
  avatarFile    = signal<File | null>(null);

  // Estados de UI
  salvando  = signal(false);
  visivel   = signal(false);

  // Limite de 2MB para o avatar
  private readonly MAX_AVATAR = 2 * 1024 * 1024;

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.nome.set(user.name);
      this.emailDisplay.set(user.email);
      if (user.avatar) this.avatarPreview.set(user.avatar);
    }

    // Animação de entrada
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.visivel.set(true), 50);
    }
  }

  // Abre o seletor de arquivo para o avatar
  onAvatarClick(input: HTMLInputElement) {
    input.click();
  }

  // Valida e faz preview do avatar selecionado
  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toast.erro('Apenas imagens são aceitas para o avatar.');
      return;
    }
    if (file.size > this.MAX_AVATAR) {
      this.toast.erro('A imagem deve ter no máximo 2MB.');
      return;
    }

    this.avatarFile.set(file);

    // Gera preview local
    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  // Retorna as iniciais do nome para o avatar padrão
  iniciais(): string {
    const nome = this.nome() || this.auth.currentUser()?.name || '';
    return nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }

  // Salva nome e avatar via API
  salvar() {
    if (!this.nome().trim()) {
      this.toast.erro('O nome não pode estar vazio.');
      return;
    }

    this.salvando.set(true);

    const formData = new FormData();
    formData.append('name', this.nome().trim());
    if (this.avatarFile()) {
      formData.append('avatar', this.avatarFile()!);
    }

    this.http.post<{ user: { id: number; name: string; email: string; avatar?: string; role?: string } }>(
      `${this.baseUrl}/profile`, formData
    ).subscribe({
      next: res => {
        this.salvando.set(false);
        // Atualiza o signal global de usuário
        this.auth.currentUser.set(res.user);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('user', JSON.stringify(res.user));
        }
        this.toast.sucesso('Perfil atualizado com sucesso!', 'Salvo');
        this.avatarFile.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.salvando.set(false);
        this.toast.erro(err.error?.message ?? 'Erro ao salvar perfil. Tente novamente.');
      },
    });
  }
}
