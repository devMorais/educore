import { Component, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ResultStore } from '../../../../core/services/result-store';
import type { AccessibilityResult } from '../../../../core/models/content.models';

type PcdTab = 'simplified' | 'audio' | 'vocabulary' | 'libras';

@Component({
  selector: 'app-pcd',
  imports: [],
  templateUrl: './pcd.html',
  styleUrl: './pcd.scss',
})
export class Pcd {
  private store = inject(ResultStore);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  data = computed(() => this.store.data()?.result as AccessibilityResult | undefined);

  pcdTab = signal<PcdTab>('simplified');

  setPcdTab(tab: PcdTab) {
    this.pcdTab.set(tab);
  }

  copyText(text: string) {
    if (isPlatformBrowser(this.platformId)) {
      navigator.clipboard.writeText(text);
    }
  }

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/upload']);
  }
}