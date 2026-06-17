 import { Component, OnInit, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

// Página 403 — Acesso negado (US-026)
@Component({
  selector: 'app-forbidden',
  imports: [RouterLink],
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.scss',
})
export class Forbidden implements OnInit {
  private platformId = inject(PLATFORM_ID);

  // Controla a animação de entrada
  visivel = signal(false);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.visivel.set(true), 50);
    }
  }
}
