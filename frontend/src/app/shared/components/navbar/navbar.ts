import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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

  menuAberto     = signal(false);
  dropdownAberto = signal(false);

  isLoggedIn  = this.auth.isLoggedIn;
  currentUser = this.auth.currentUser;

  iniciais = computed(() => {
    const nome = this.currentUser()?.name ?? '';
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  });

  toggleMenu()    { this.menuAberto.update(v => !v); }
  fecharMenu()    { this.menuAberto.set(false); }
  toggleDropdown(){ this.dropdownAberto.update(v => !v); }
  fecharDropdown(){ this.dropdownAberto.set(false); }

  // Scroll suave para seção
  scrollTo(id: string) {
    this.fecharMenu();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.navbar-user')) this.dropdownAberto.set(false);
    if (!target.closest('.navbar-container')) this.fecharMenu();
  }

  logout() {
    this.fecharMenu();
    this.fecharDropdown();
    this.auth.logout();
  }
}