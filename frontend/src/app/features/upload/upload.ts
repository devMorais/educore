import { Component, signal, inject, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { HttpEvent, HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { AiService } from '../../core/services/ai';

@Component({
  selector: 'app-upload',
  imports: [RouterLink],
  templateUrl: './upload.html',
  styleUrl: './upload.scss'
})
export class Upload implements OnDestroy {
  private aiService = inject(AiService);
  private router = inject(Router);

  selectedFile = signal<File | null>(null);
  isDragging = signal(false);
  uploading = signal(false);
  uploadProgress = signal(0);
  generating = signal(false);
  errorMessage = signal('');
  uploadedDocumentId = signal<number | null>(null);
  isCompleted = signal(false);

  private readonly MAX_SIZE = 50 * 1024 * 1024; // 50MB
  private pollingInterval: any;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave() {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    this.validateAndSet(event.dataTransfer?.files[0]);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.validateAndSet(input.files?.[0]);
  }

  private validateAndSet(file: File | undefined) {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      this.errorMessage.set('Apenas arquivos PDF são aceitos.');
      return;
    }
    if (file.size > this.MAX_SIZE) {
      this.errorMessage.set('Arquivo muito grande. O limite é 50MB.');
      return;
    }
    this.selectedFile.set(file);
    this.errorMessage.set('');
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  uploadFile() {
    const file = this.selectedFile();
    if (!file) return;

    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.errorMessage.set('');

    this.aiService.uploadFile(file).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((event.loaded / event.total) * 100));
        } else if (event.type === HttpEventType.Response) {
          this.uploading.set(false);
          const body: any = event.body;
          this.uploadedDocumentId.set(body.document_id);
          this.startPolling(body.document_id);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        this.uploadProgress.set(0);
        this.errorMessage.set(this.mapError(err));
      }
    });
  }

  private mapError(err: HttpErrorResponse): string {
    if (err.status === 429) return 'Limite de uso da IA atingido. Aguarde alguns segundos e tente novamente.';
    if (err.status === 413) return 'Arquivo muito grande. O limite é 50MB.';
    if (err.status === 0)   return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    return 'Erro ao enviar o arquivo. Tente novamente.';
  }

  private startPolling(documentId: number) {
    this.pollingInterval = setInterval(() => {
      this.aiService.checkStatus(documentId).subscribe({
        next: (response: any) => {
          if (response.status === 'completed') {
            clearInterval(this.pollingInterval);
            this.isCompleted.set(true);
          } else if (response.status === 'failed') {
            clearInterval(this.pollingInterval);
            this.errorMessage.set('Erro ao processar o PDF. Tente novamente.');
            this.uploadedDocumentId.set(null);
          }
        }
      });
    }, 3000);
  }

 generate(type: string) {
    const documentId = this.uploadedDocumentId();
    if (!documentId) return;

    this.generating.set(true);
    this.errorMessage.set('');

    this.aiService.generateContent(documentId, type).subscribe({
      next: (response: any) => {
        this.generating.set(false);
        console.log('[generate] resposta recebida:', type, response); // debug
        this.router.navigate(['/resultado'], {
          state: { result: response, type: type }
        }).then(ok => console.log('[generate] navegou?', ok))
          .catch(err => console.error('[generate] erro na navegação:', err));
      },
      error: (err) => {
        this.generating.set(false);
        console.error('[generate] erro na chamada:', err); // debug
        this.errorMessage.set('Erro ao gerar conteúdo. Tente novamente.');
      }
    });
  }
  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}