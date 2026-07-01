import type { LibrasProviderConfig } from './libras-provider-config.type';

// US-027: Interface para vídeos/avatar LIBRAS vindos do backend (BS-015)
export interface LibrasVideo {
  term: string;
  text: string;
  provider: 'vlibras' | 'handtalk';
  embed_type: 'widget' | 'sdk';
  config: LibrasProviderConfig;
  source?: 'title' | 'vocabulary' | 'moment';
}
