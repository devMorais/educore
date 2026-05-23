import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import type {
  ContentResult,
  GenerationType,
  QuizResult,
  SummaryResult,
  SlidesResult,
  MindMapResult,
  FlashcardsResult,
  AccessibilityResult,
} from '../models/content.models';

export interface DocumentStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percent: number;
  pages_processed: number;
  total_pages: number;
  error?: string;
}

export interface DocumentItem {
  id: number;
  filename: string;
  status: string;
  progress_percent: number;
  created_at: string;
}

export interface GenerationCache {
  id: number;
  type: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private aiUrl = environment.aiServiceUrl;

  listDocuments(): Observable<DocumentItem[]> {
    return this.http.get<DocumentItem[]>(`${this.aiUrl}/documents/`);
  }

  listGenerations(documentId: number): Observable<GenerationCache[]> {
    return this.http.get<GenerationCache[]>(`${this.aiUrl}/documents/${documentId}/generations`);
  }

  getCachedGeneration(documentId: number, type: string): Observable<ContentResult> {
    return this.http.get<ContentResult>(`${this.aiUrl}/documents/${documentId}/generations/${type}`);
  }

  uploadFile(file: File): Observable<HttpEvent<{ document_id: number }>> {
    const formData = new FormData();
    formData.append('file', file);
    const req = new HttpRequest(
      'POST',
      `${this.aiUrl}/documents/upload`,
      formData,
      { reportProgress: true },
    );
    return this.http.request(req);
  }

  checkStatus(documentId: number): Observable<DocumentStatus> {
    return this.http.get<DocumentStatus>(
      `${this.aiUrl}/documents/${documentId}/status`,
    );
  }

  generateQuiz(documentId: number): Observable<QuizResult> {
    return this.generateContent<QuizResult>(documentId, 'quiz');
  }

  generateSummary(documentId: number): Observable<SummaryResult> {
    return this.generateContent<SummaryResult>(documentId, 'summary');
  }

  generateSlides(documentId: number): Observable<SlidesResult> {
    return this.generateContent<SlidesResult>(documentId, 'slides');
  }

  generateMindMap(documentId: number): Observable<MindMapResult> {
    return this.generateContent<MindMapResult>(documentId, 'mindmap');
  }

  generateFlashcards(documentId: number): Observable<FlashcardsResult> {
    return this.generateContent<FlashcardsResult>(documentId, 'flashcards');
  }

  generatePcd(documentId: number): Observable<AccessibilityResult> {
    return this.generateContent<AccessibilityResult>(documentId, 'pcd');
  }

  generateContent<T extends ContentResult = ContentResult>(
    documentId: number,
    type: GenerationType,
    options: Record<string, unknown> = {},
  ): Observable<T> {
    return this.http.post<T>(`${this.aiUrl}/documents/${documentId}/generate`, {
      document_id: documentId,
      type,
      options,
    });
  }

  exportKahoot(documentId: number): Observable<Blob> {
    return this.http.get(
      `${this.aiUrl}/documents/${documentId}/export-kahoot`,
      { responseType: 'blob' },
    );
  }

  exportSocrative(documentId: number): Observable<Blob> {
    return this.http.get(
      `${this.aiUrl}/documents/${documentId}/export-socrative`,
      { responseType: 'blob' },
    );
  }

  exportScorm(documentId: number): Observable<Blob> {
    return this.http.get(
      `${this.aiUrl}/documents/${documentId}/export-scorm`,
      { responseType: 'blob' },
    );
  }

  downloadPptx(documentId: number): Observable<Blob> {
    return this.http.post(
      `${this.aiUrl}/documents/${documentId}/export-pptx`,
      {},
      { responseType: 'blob' },
    );
  }

  /** Trigger browser file download from a Blob */
  triggerDownload(blob: Blob, filename: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
