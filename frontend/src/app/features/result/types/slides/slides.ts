import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ResultStore } from '../../../../core/services/result-store';
import { AiService } from '../../../../core/services/ai';
import type { SlidesResult } from '../../../../core/models/content.models';

@Component({
  selector: 'app-slides',
  imports: [],
  templateUrl: './slides.html',
  styleUrl: './slides.scss',
})
export class Slides {
  private store = inject(ResultStore);
  private router = inject(Router);
  private aiService = inject(AiService);

  data = computed(() => this.store.data()?.result as SlidesResult | undefined);
  documentId = computed(() => this.store.data()?.documentId ?? null);

  downloadingPptx = signal(false);

  downloadPptx() {
    const docId = this.documentId();
    if (!docId) return;
    this.downloadingPptx.set(true);
    this.aiService.downloadPptx(docId).subscribe({
      next: blob => {
        this.downloadingPptx.set(false);
        this.aiService.triggerDownload(blob, `apresentacao_educore_${docId}.pptx`);
      },
      error: () => this.downloadingPptx.set(false),
    });
  }

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/upload']);
  }
}