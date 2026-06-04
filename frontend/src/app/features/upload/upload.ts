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

  // Botões de ação com ícones PrimeIcons
  readonly actionButtons = [
    { type: 'quiz',       icon: 'pi-question-circle', label: 'Quiz',         desc: '30 perguntas inteligentes',   color: 'blue'   },
    { type: 'summary',    icon: 'pi-file-edit',        label: 'Resumo',       desc: 'Pontos-chave do conteúdo',    color: 'green'  },
    { type: 'slides',     icon: 'pi-desktop',          label: 'Slides GOLD',  desc: 'Apresentação premium PPTX',   color: 'purple' },
    { type: 'mindmap',    icon: 'pi-sitemap',          label: 'Mapa Mental',  desc: 'Visualização interativa',     color: 'orange' },
    { type: 'flashcards', icon: 'pi-clone',            label: 'Flashcards',   desc: '20 cartões de estudo',        color: 'teal'   },
    { type: 'pcd',        icon: 'pi-eye',              label: 'Acessível PCD',desc: 'Linguagem simplificada',      color: 'indigo' },
    { type: 'kahoot',     icon: 'pi-play-circle',      label: 'Kahoot',       desc: 'Download JSON pronto',        color: 'red'    },
    { type: 'socrative',  icon: 'pi-chart-bar',        label: 'Socrative',    desc: 'Download JSON',               color: 'pink'   },
    { type: 'scorm',      icon: 'pi-graduation-cap',   label: 'SCORM / LMS',  desc: 'Moodle, Canvas, Blackboard',  color: 'gray'   },
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

  // Fase atual do processamento para mensagens em tempo real
  faseProcessamento = signal<'enviando' | 'analisando' | 'finalizando' | ''>('');

  // Indica se os botões estão parcialmente habilitados (progresso >= 30%)
  botoesDisponiveis = signal(false);

  // Controla o loading skeleton enquanto a lista de documentos carrega
  loadingDocs = signal(true);

  // Controla a abertura da sidebar no mobile (menu hambúrguer)
  menuAberto = signal(false);

  // Ícone PrimeIcons de cada tipo de conteúdo, para mostrar o que já foi gerado em cada documento
  private readonly typeIcon: Record<string, string> = {
    quiz: 'pi-question-circle',
    summary: 'pi-file-edit',
    slides: 'pi-desktop',
    mindmap: 'pi-sitemap',
    flashcards: 'pi-clone',
    pcd: 'pi-eye',
    kahoot: 'pi-play-circle',
    socrative: 'pi-chart-bar',
    scorm: 'pi-graduation-cap',
  };

  // Cache dos tipos já gerados por documento (documentId -> lista de tipos)
  generationsByDoc = signal<Record<number, string[]>>({});

  private readonly MAX_SIZE = 100 * 1024 * 1024;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.loadDocuments();
  }

  // Abre/fecha a sidebar no mobile
  alternarMenu() {
    this.menuAberto.update(v => !v);
  }

  // Carrega os últimos 10 documentos (todos os status) para a lista "Documentos Recentes"
  loadDocuments() {
    this.loadingDocs.set(true);
    this.aiService.listDocuments().subscribe({
      next: docs => {
        // Ordena do mais recente para o mais antigo e pega os 10 primeiros
        const ultimos10 = [...docs]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);
        this.recentDocuments.set(ultimos10);
        this.loadingDocs.set(false);

        // Para cada documento concluído, carrega os tipos já gerados (para exibir os ícones)
        ultimos10
          .filter(d => d.status === 'completed')
          .forEach(d => this.carregarTiposGerados(d.id));
      },
      error: () => {
        this.recentDocuments.set([]);
        this.loadingDocs.set(false);
      },
    });
  }

  // US-009: busca os tipos já gerados de um documento e guarda no mapa
  private carregarTiposGerados(documentId: number) {
    this.aiService.listGenerations(documentId).subscribe({
      next: gens => {
        this.generationsByDoc.update(mapa => ({
          ...mapa,
          [documentId]: gens.map(g => g.type),
        }));
      },
    });
  }

  // US-009: retorna os tipos já gerados de um documento (para o template)
  tiposGerados(documentId: number): string[] {
    return this.generationsByDoc()[documentId] ?? [];
  }

  // US-009: retorna a classe do ícone PrimeIcons de um tipo de conteúdo
  iconeDoTipo(type: string): string {
    return this.typeIcon[type] ?? 'pi-file';
  }

  // US-009: formata a data de criação para o padrão brasileiro
  formatDate(dataIso: string): string {
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // US-009: texto do badge conforme o status do documento
  statusLabel(status: string): string {
    if (status === 'completed') return 'Concluído';
    if (status === 'failed') return 'Falhou';
    if (status === 'processing' || status === 'pending') return 'Processando';
    return status;
  }

  // US-009: classe CSS do badge conforme o status
  statusClass(status: string): string {
    if (status === 'completed') return 'is-done';
    if (status === 'failed') return 'is-failed';
    return 'is-processing';
  }

  selectDocument(doc: DocumentItem) {
    // US-009: só permite abrir a geração se o documento estiver concluído
    if (doc.status !== 'completed') return;

    this.uploadedDocumentId.set(doc.id);
    this.isCompleted.set(true);
    this.processingProgress.set(100);
    this.selectedFile.set(null);
    this.errorMessage.set('');
    this.botoesDisponiveis.set(true);
    this.menuAberto.set(false);
    this.loadGenerations(doc.id);
  }

  // US-009: reenvia um documento que falhou (volta para a tela de upload)
  reenviar(doc: DocumentItem, event: Event) {
    event.stopPropagation(); // evita disparar o clique do item da lista
    this.uploadedDocumentId.set(null);
    this.isCompleted.set(false);
    this.selectedFile.set(null);
    this.errorMessage.set('');
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

    // Valida pelo mime type E pela extensão do arquivo
    const extensaoValida = file.name.toLowerCase().endsWith('.pdf');
    const mimeValido = file.type === 'application/pdf';

    if (!extensaoValida || !mimeValido) {
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

  // Retorna a mensagem da fase atual do processamento
  mensagemFase(): string {
    const fase = this.faseProcessamento();
    if (fase === 'enviando')    return 'Enviando arquivo para o servidor...';
    if (fase === 'analisando')  return 'Analisando conteúdo com IA...';
    if (fase === 'finalizando') return 'Finalizando processamento...';
    return 'Iniciando análise do documento...';
  }

  // Reinicia o upload após uma falha
  tentarNovamente() {
    this.uploadedDocumentId.set(null);
    this.processingProgress.set(0);
    this.faseProcessamento.set('');
    this.botoesDisponiveis.set(false);
    this.errorMessage.set('');
    this.selectedFile.set(null);
  }

  uploadFile() {
    const file = this.selectedFile();
    if (!file) return;

    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.processingProgress.set(0);
    this.errorMessage.set('');
    this.faseProcessamento.set('enviando');

    this.aiService.uploadFile(file).subscribe({
      next: (event: HttpEvent<{ document_id: number; status?: string; deduplicated?: boolean }>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((event.loaded / event.total) * 100));
        } else if (event.type === HttpEventType.Response && event.body) {
          this.uploading.set(false);
          this.uploadedDocumentId.set(event.body.document_id);

          if (event.body.status === 'completed' || event.body.deduplicated) {
            // PDF já processado anteriormente — avisa o usuário via toast
            this.toast.aviso(
              'Este PDF já foi enviado anteriormente. Usando versão em cache.',
              'PDF já processado'
            );
            this.faseProcessamento.set('');
            this.processingProgress.set(100);
            this.isCompleted.set(true);
            this.botoesDisponiveis.set(true);
            this.loadDocuments();
            this.loadGenerations(event.body.document_id);
          } else {
            // Inicia polling de status a cada 2 segundos
            this.faseProcessamento.set('analisando');
            this.startPolling(event.body.document_id);
          }
        }
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        this.uploadProgress.set(0);
        this.faseProcessamento.set('');
        this.errorMessage.set(this.mapError(err));
      },
    });
  }

  private mapError(err: HttpErrorResponse): string {
    if (err.status === 429) return 'Limite de uso da IA atingido. Aguarde alguns segundos e tente novamente.';
    if (err.status === 413) return 'Arquivo muito grande. O limite é 100 MB.';
    if (err.status === 0)   return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    return err.error?.detail ?? 'Erro ao enviar o arquivo. Tente novamente.';
  }

  // Polling a cada 2s em /documents/{id}/status
  private startPolling(documentId: number) {
    this.stopPolling();
    this.pollingInterval = setInterval(() => {
      this.aiService.checkStatus(documentId).subscribe({
        next: (status: DocumentStatus) => {
          const progresso = status.progress_percent ?? 0;
          this.processingProgress.set(progresso);

          // Atualiza fase conforme o progresso
          if (progresso >= 80) {
            this.faseProcessamento.set('finalizando');
          } else if (progresso >= 10) {
            this.faseProcessamento.set('analisando');
          }

          // Habilita botões parcialmente quando progresso >= 30%
          if (progresso >= 30 && !this.botoesDisponiveis()) {
            this.botoesDisponiveis.set(true);
          }

          if (status.status === 'completed') {
            // Processamento concluído — para o polling
            this.stopPolling();
            this.faseProcessamento.set('');
            this.processingProgress.set(100);
            this.isCompleted.set(true);
            this.botoesDisponiveis.set(true);
            this.loadDocuments();
            this.loadGenerations(documentId);
          } else if (status.status === 'failed') {
            // Falha no processamento — para o polling e exibe erro
            this.stopPolling();
            this.faseProcessamento.set('');
            this.errorMessage.set('Erro ao processar o PDF. Clique em "Tentar novamente".');
            this.uploadedDocumentId.set(null);
            this.botoesDisponiveis.set(false);
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

  // Para o polling ao destruir o componente (evita memory leak)
  ngOnDestroy() {
    this.stopPolling();
  }
}