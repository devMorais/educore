import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { HttpEvent, HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { AiService, DocumentStatus, DocumentItem, GenerationCache } from '../../core/services/ai';
import { Auth } from '../../core/services/auth';
import { ToastService } from '../../core/services/toast';
import type { GenerationType } from '../../core/models/content.models';
import { ResultStore } from '../../core/services/result-store';

@Component({
  selector: 'app-upload',
  imports: [RouterLink],
  templateUrl: './upload.html',
  styleUrl: './upload.scss',
})
export class Upload implements OnInit, OnDestroy {
  private aiService = inject(AiService);
  private router = inject(Router);
  private store = inject(ResultStore);
  private toast = inject(ToastService);
  auth = inject(Auth);

  // Botões de ação com ícones PrimeIcons (os 6 primeiros são os conteúdos principais da US-010)
  readonly actionButtons = [
    { type: 'quiz', icon: 'pi-question-circle', label: 'Quiz', desc: '30 perguntas inteligentes', color: 'blue' },
    { type: 'summary', icon: 'pi-file-edit', label: 'Resumo', desc: 'Pontos-chave do conteúdo', color: 'green' },
    { type: 'slides', icon: 'pi-desktop', label: 'Slides GOLD', desc: 'Apresentação premium PPTX', color: 'purple' },
    { type: 'mindmap', icon: 'pi-sitemap', label: 'Mapa Mental', desc: 'Visualização interativa', color: 'orange' },
    { type: 'flashcards', icon: 'pi-clone', label: 'Flashcards', desc: '20 cartões de estudo', color: 'teal' },
    { type: 'pcd', icon: 'pi-eye', label: 'Acessível PCD', desc: 'Linguagem simplificada', color: 'indigo' },
    { type: 'kahoot', icon: 'pi-play-circle', label: 'Kahoot', desc: 'Download JSON pronto', color: 'red' },
    { type: 'socrative', icon: 'pi-chart-bar', label: 'Socrative', desc: 'Download JSON', color: 'pink' },
    { type: 'scorm', icon: 'pi-graduation-cap', label: 'SCORM / LMS', desc: 'Moodle, Canvas, Blackboard', color: 'gray' },
  ];

  selectedFile = signal<File | null>(null);
  isDragging = signal(false);
  uploading = signal(false);
  uploadProgress = signal(0);
  processingProgress = signal(0);
  generating = signal(false);
  generatingType = signal<string>('');
  errorMessage = signal('');
  uploadedDocumentId = signal<number | null>(null);
  isCompleted = signal(false);
  recentDocuments = signal<DocumentItem[]>([]);
  cachedGenerations = signal<GenerationCache[]>([]);

  // Controla a abertura da sidebar no mobile (menu hambúrguer)
  menuAberto = signal(false);

  private readonly MAX_SIZE = 100 * 1024 * 1024;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.loadDocuments();
  }

  // Abre/fecha a sidebar no mobile
  alternarMenu() {
    this.menuAberto.update(v => !v);
  }

  loadDocuments() {
    this.aiService.listDocuments().subscribe({
      next: docs => this.recentDocuments.set(docs.filter(d => d.status === 'completed')),
    });
  }

  selectDocument(doc: DocumentItem) {
    this.uploadedDocumentId.set(doc.id);
    this.isCompleted.set(true);
    this.processingProgress.set(100);
    this.selectedFile.set(null);
    this.errorMessage.set('');
    this.menuAberto.set(false); // fecha o menu ao escolher um documento no mobile
    this.loadGenerations(doc.id);
  }

  loadGenerations(documentId: number) {
    this.aiService.listGenerations(documentId).subscribe({
      next: gens => this.cachedGenerations.set(gens),
      error: () => this.cachedGenerations.set([]),
    });
  }

  isCached(type: string): boolean {
    return this.cachedGenerations().some(g => g.type === type);
  }

  // US-010: botão só é liberado quando o progresso atinge 30%
  botaoLiberado(): boolean {
    return this.isCompleted() || this.processingProgress() >= 30;
  }

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
      this.errorMessage.set('Arquivo muito grande. O limite é 100 MB.');
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
    this.processingProgress.set(0);
    this.errorMessage.set('');

    this.aiService.uploadFile(file).subscribe({
      next: (event: HttpEvent<{ document_id: number; status?: string; deduplicated?: boolean }>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((event.loaded / event.total) * 100));
        } else if (event.type === HttpEventType.Response && event.body) {
          this.uploading.set(false);
          this.uploadedDocumentId.set(event.body.document_id);
          if (event.body.status === 'completed' || event.body.deduplicated) {
            this.processingProgress.set(100);
            this.isCompleted.set(true);
            this.loadDocuments();
            this.loadGenerations(event.body.document_id);
          } else {
            this.startPolling(event.body.document_id);
          }
        }
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        this.uploadProgress.set(0);
        this.errorMessage.set(this.mapError(err));
      },
    });
  }

  private mapError(err: HttpErrorResponse): string {
    if (err.status === 429) return 'Limite de uso da IA atingido. Aguarde alguns segundos e tente novamente.';
    if (err.status === 413) return 'Arquivo muito grande. O limite é 100 MB.';
    if (err.status === 0) return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    return err.error?.detail ?? 'Erro ao enviar o arquivo. Tente novamente.';
  }

  private startPolling(documentId: number) {
    this.stopPolling();
    this.pollingInterval = setInterval(() => {
      this.aiService.checkStatus(documentId).subscribe({
        next: (status: DocumentStatus) => {
          this.processingProgress.set(status.progress_percent ?? 0);
          if (status.status === 'completed') {
            this.stopPolling();
            this.processingProgress.set(100);
            this.isCompleted.set(true);
            this.loadDocuments();
            this.loadGenerations(documentId);
          } else if (status.status === 'failed') {
            this.stopPolling();
            this.errorMessage.set('Erro ao processar o PDF. Tente novamente.');
            this.uploadedDocumentId.set(null);
          }
        },
      });
    }, 2000);
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // US-010: clica no tipo, salva no ResultStore e navega para /resultado/{tipo}
  generate(type: GenerationType | string) {
    const documentId = this.uploadedDocumentId();
    if (!documentId || this.generating()) return;

    // Exportações continuam baixando arquivo (não navegam para tela de resultado)
    if (type === 'kahoot' || type === 'socrative' || type === 'scorm') {
      this.triggerExport(documentId, type as 'kahoot' | 'socrative' | 'scorm');
      return;
    }

    this.generating.set(true);
    this.generatingType.set(type);
    this.errorMessage.set('');

    // US-010: se já existe em cache, avisa que está usando o resultado salvo
    if (this.isCached(type)) {
      this.toast.info('Usando resultado salvo.', 'Conteúdo em cache');
    }

    this.aiService.generateContent(documentId, type as GenerationType).subscribe({
      next: response => {
        this.generating.set(false);
        this.generatingType.set('');
        this.loadGenerations(documentId);
        this.store.set({ result: response, type: type as GenerationType, documentId });
        this.router.navigate(['/resultado', type]);
      },
      error: (err: HttpErrorResponse) => {
        // US-010: em erro, dispara toast e libera o botão
        this.generating.set(false);
        this.generatingType.set('');
        this.toast.erro(err.error?.detail ?? 'Erro ao gerar conteúdo. Tente novamente.');
      },
    });
  }

  private triggerExport(documentId: number, type: 'kahoot' | 'socrative' | 'scorm') {
    this.generating.set(true);
    this.generatingType.set(type);
    const ext = type === 'scorm' ? '.zip' : '.json';
    const obs =
      type === 'kahoot'
        ? this.aiService.exportKahoot(documentId)
        : type === 'socrative'
          ? this.aiService.exportSocrative(documentId)
          : this.aiService.exportScorm(documentId);

    obs.subscribe({
      next: blob => {
        this.generating.set(false);
        this.generatingType.set('');
        this.aiService.triggerDownload(blob, `educore_${type}_${documentId}${ext}`);
      },
      error: (err: HttpErrorResponse) => {
        this.generating.set(false);
        this.generatingType.set('');
        this.toast.erro(err.error?.detail ?? `Erro ao exportar para ${type}.`);
      },
    });
  }

  ngOnDestroy() {
    this.stopPolling();
  }
}