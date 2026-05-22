import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);
  private aiUrl = environment.aiServiceUrl;

  uploadFile(file: File): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);
    const req = new HttpRequest('POST', `${this.aiUrl}/documents/upload`, formData, {
      reportProgress: true
    });
    return this.http.request(req);
  }

  checkStatus(documentId: number): Observable<any> {
    return this.http.get<any>(`${this.aiUrl}/documents/${documentId}/status`);
  }

  generateContent(documentId: number, type: string): Observable<any> {
    return this.http.post<any>(`${this.aiUrl}/documents/${documentId}/generate`, {
      document_id: documentId,
      type: type,
      options: {}
    });
  }
}