import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ResultStore } from '../../../../core/services/result-store';
import type { SummaryResult } from '../../../../core/models/content.models';

@Component({
  selector: 'app-summary',
  imports: [],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private store = inject(ResultStore);
  private router = inject(Router);

  data = computed(() => this.store.data()?.result as SummaryResult | undefined);

  paragraphs = computed<string[]>(() => {
    const s = this.data()?.summary ?? '';
    return s.split('\n\n').filter(p => p.trim().length > 0);
  });

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/upload']);
  }
}