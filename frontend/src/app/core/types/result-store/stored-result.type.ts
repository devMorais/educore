import type { ContentResult, GenerationType } from '../content';

export interface StoredResult {
  result: ContentResult;
  type: GenerationType;
  documentId?: number;
}
