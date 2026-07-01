import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Navbar, Footer } from './shared/components/molecules/layout';
import { VerifyEmailBanner } from './shared/components/molecules/feedback';
import { CommonModule } from '@angular/common';
import { Toast } from 'primeng/toast';
import { filter } from 'rxjs/operators';
import { ThemeService } from './core/services/theme.service';

// Rotas com layout próprio (sidebar/header dedicados, ou tela cheia standalone) — não usam navbar/footer públicos
const ROTAS_SEM_CHROME_PUBLICO = ['/admin', '/painel', '/login', '/cadastro', '/esqueci-senha'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, VerifyEmailBanner, CommonModule, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private router = inject(Router);
  // Instanciado aqui (não só no Painel) para reaplicar o tema salvo em toda navegação/reload
  private theme = inject(ThemeService);
  semChromePublico = signal(false);

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e) => {
      this.semChromePublico.set(
        ROTAS_SEM_CHROME_PUBLICO.some(rota => e.urlAfterRedirects.startsWith(rota))
      );
    });
  }
}