import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private auth   = inject(Auth);
  private router = inject(Router);

  // Estado do menu mobile
  menuAberto = signal(false);

  // Dados do usuário logado
  isLoggedIn  = this.auth.isLoggedIn;
  currentUser = this.auth.currentUser;

  // Iniciais do nome para avatar
  iniciais = computed(() => {
    const nome = this.currentUser()?.name ?? '';
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  });

  // Abre/fecha o menu mobile
  toggleMenu() {
    this.menuAberto.update(v => !v);
  }

  // Fecha o menu mobile
  fecharMenu() {
    this.menuAberto.set(false);
  }

  // Fecha o menu ao clicar fora
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.navbar-container')) {
      this.fecharMenu();
    }
  }

  // Logout e fecha o menu
  logout() {
    this.fecharMenu();
    this.auth.logout();
  }
}