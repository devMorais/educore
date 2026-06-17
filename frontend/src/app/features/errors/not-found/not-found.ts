 import { Component, OnInit, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

// Página 404 — Rota não encontrada (US-026)
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound implements OnInit {
  private platformId = inject(PLATFORM_ID);

  // Controla a animação de entrada
  visivel = signal(false);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.visivel.set(true), 50);
    }
  }
}
