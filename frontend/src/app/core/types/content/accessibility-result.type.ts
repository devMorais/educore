import type { WcagMetadata } from './wcag-metadata.type';
import type { LibrasVideo } from './libras-video.type';

export interface AccessibilityResult {
  title: string;
  simplified_text: string;
  audio_script: string;
  visual_alternatives: string[];
  key_vocabulary: Array<{ term: string; definition: string }>;
  wcag_metadata: WcagMetadata;
  libras_suggestions: string[];
  // US-027: Campo opcional — não quebra resultados antigos sem libras_videos
  libras_videos?: LibrasVideo[];
}
