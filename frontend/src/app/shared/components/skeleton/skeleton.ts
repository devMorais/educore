import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  imports: [CommonModule],
  template: `
    <div
      class="skeleton"
      [class.skeleton--circle]="shape() === 'circle'"
      [class.skeleton--rect]="shape() === 'rect'"
      [style.width]="width()"
      [style.height]="height()"
      [style.border-radius]="shape() === 'circle' ? '50%' : borderRadius()">
    </div>
  `,
  styles: [`
    /* Animação pulse para skeleton loading */
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }

    .skeleton {
      background: linear-gradient(90deg, #e8e8f0 25%, #f0f0f8 50%, #e8e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite, pulse 2s ease-in-out infinite;
      border-radius: 8px;
      display: block;
    }

    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .skeleton--circle { border-radius: 50% !important; }
    .skeleton--rect   { border-radius: 4px; }
  `],
})
export class Skeleton {
  // Forma do skeleton: 'rect' (padrão) ou 'circle'
  shape        = input<'rect' | 'circle'>('rect');
  width        = input<string>('100%');
  height       = input<string>('16px');
  borderRadius = input<string>('8px');
}