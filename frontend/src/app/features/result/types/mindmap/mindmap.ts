import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ResultStore } from '../../../../core/services/result-store';
import { MindmapNode } from '../../mindmap-node/mindmap-node';
import type { MindMapResult } from '../../../../core/models/content.models';

@Component({
  selector: 'app-mindmap',
  imports: [MindmapNode],
  templateUrl: './mindmap.html',
  styleUrl: './mindmap.scss',
})
export class Mindmap {
  private store = inject(ResultStore);
  private router = inject(Router);

  data = computed(() => this.store.data()?.result as MindMapResult | undefined);

  goToUpload() {
    this.store.clear();
    this.router.navigate(['/upload']);
  }
}