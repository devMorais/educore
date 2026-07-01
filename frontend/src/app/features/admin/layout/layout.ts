import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { PanelMenuModule } from 'primeng/panelmenu';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { Auth } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, PanelMenuModule, AvatarModule, ButtonModule, TooltipModule],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class Layout {
  private auth = inject(Auth);

  userName = computed(() => this.auth.currentUser()?.name ?? 'Admin');
  userInitial = computed(() => this.userName().charAt(0).toUpperCase());

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/admin'
    },
    {
      label: 'Usuários',
      icon: 'pi pi-users',
      items: [
        { label: 'Professores', icon: 'pi pi-user', routerLink: '/admin/professores' },
        { label: 'Alunos', icon: 'pi pi-graduation-cap', routerLink: '/admin/alunos' },
        { label: 'Todos', icon: 'pi pi-list', routerLink: '/admin/usuarios' },
      ]
    },
    {
      label: 'Chat',
      icon: 'pi pi-comments',
      routerLink: '/admin/chat'
    },
    {
      label: 'Fórum',
      icon: 'pi pi-th-large',
      routerLink: '/admin/forum'
    },
  ];

  logout() {
    this.auth.logout();
  }
}