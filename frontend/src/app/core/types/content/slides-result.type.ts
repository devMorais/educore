import type { SlideContent } from './slide-content.type';

export interface SlidesResult {
  title: string;
  slides: SlideContent[];
  total_slides: number;
}
