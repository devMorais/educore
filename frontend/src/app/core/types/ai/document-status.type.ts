export interface DocumentStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percent: number;
  pages_processed: number;
  total_pages: number;
  error?: string;
}
