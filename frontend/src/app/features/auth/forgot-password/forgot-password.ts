import { Component, signal, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword implements OnDestroy {
  email = '';
  loading = signal(false);
  enviado = signal(false);

  private auth = inject(Auth);
  private router = inject(Router);
  private timeoutId: any = null;

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  onSubmit() {
    if (!this.email) return;

    this.loading.set(true);

    this.auth.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.enviado.set(true);
        this.timeoutId = setTimeout(() => {
          this.router.navigate(['/login']);
        }, 5000);
      },
      error: () => {
        this.loading.set(false);
        this.enviado.set(true);
        this.timeoutId = setTimeout(() => {
          this.router.navigate(['/login']);
        }, 5000);
      }
    });
  }
}