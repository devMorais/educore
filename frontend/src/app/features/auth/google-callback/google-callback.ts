import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../../../core/services/auth.service';

@Component({
  selector: 'app-google-callback',
  imports: [],
  template: `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Roboto',sans-serif;background:#f4f5f7">
      <div style="text-align:center">
        <div style="font-size:2rem;margin-bottom:1rem">⏳</div>
        <p style="color:#4a5568;font-size:1rem">Autenticando com Google...</p>
      </div>
    </div>
  `,
})
export class GoogleCallback implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(Auth);
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    const code = this.route.snapshot.queryParamMap.get('code');
    const state = this.route.snapshot.queryParamMap.get('state') ?? '';

    if (!code) {
      this.router.navigate(['/login']);
      return;
    }

    this.auth.exchangeGoogleCode(code, state).subscribe({
      next: () => this.router.navigate(['/painel']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
