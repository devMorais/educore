import type { SlideLayout } from './slide-layout.type';

export interface SlideContent {
  title: string;
  content: string[];
  notes?: string;
  layout?: SlideLayout;
  visual_suggestion?: string;
  accent_color?: 'blue' | 'green' | 'orange' | 'purple';
}
