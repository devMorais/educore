import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { HttpEvent, HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { Auth } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { AiService } from '../../core/services/ai.service';
import { ResultStore } from '../../core/services/result-store.service';
import { DemoService } from '../../core/services/demo.service';
import { Logo } from '../../shared/components/atoms';
import type { GenerationType } from '../../core/types/content';
import type { DocumentStatus, DocumentItem, GenerationCache } from '../../core/types/ai';

const STORAGE_KEY_SIDEBAR = 'educore_sidebar_colapsada';

interface PanelNavItem {
  icon: string;
  label: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-panel',
  imports: [RouterLink, RouterLinkActive, AvatarModule, TooltipModule, Logo],
  templateUrl: './panel.html',
  styleUrl: './panel.scss',
})
export class Panel implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);
  private aiService = inject(AiService);
  private store = inject(ResultStore);
  private router = inject(Router);
  readonly demoService = inject(DemoService);
  readonly theme = inject(ThemeService);

  menuAberto = signal(false);
  colapsado = signal(this.carregarColapsado());

  userName = computed(() => this.auth.currentUser()?.name ?? 'Usuário');
  userInitial = computed(() => this.userName().charAt(0).toUpperCase());
  isAdmin = computed(() => this.auth.currentUser()?.role === 'admin');

  readonly navItems: PanelNavItem[] = [
    { icon: 'pi-user', label: 'Meu Perfil', route: '/perfil' },
    { icon: 'pi-shield', label: 'Administração', route: '/admin', adminOnly: true },
  ];

  navVisivel = computed(() => this.navItems.filter(n => !n.adminOnly || this.isAdmin()));

  // ── Workspace: upload de PDF e geração de conteúdo com IA ──────────────────

  // Botões de ação com ícones PrimeIcons
  readonly actionButtons = [
    { type: 'quiz',       icon: 'pi-question-circle', label: 'Quiz',          desc: '30 perguntas inteligentes',  color: 'blue'   },
    { type: 'summary',    icon: 'pi-file-edit',        label: 'Resumo',        desc: 'Pontos-chave do conteúdo',   color: 'green'  },
    { type: 'slides',     icon: 'pi-desktop',          label: 'Slides GOLD',   desc: 'Apresentação premium PPTX',  color: 'purple' },
    { type: 'mindmap',    icon: 'pi-sitemap',          label: 'Mapa Mental',   desc: 'Visualização interativa',    color: 'orange' },
    { type: 'flashcards', icon: 'pi-clone',            label: 'Flashcards',    desc: '20 cartões de estudo',       color: 'teal'   },
    { type: 'pcd',        icon: 'pi-eye',              label: 'Acessível PCD', desc: 'Linguagem simplificada',     color: 'indigo' },
    { type: 'kahoot',     icon: 'pi-play-circle',      label: 'Kahoot',        desc: 'Download JSON pronto',       color: 'red'    },
    { type: 'socrative',  icon: 'pi-chart-bar',        label: 'Socrative',     desc: 'Download JSON',              color: 'pink'   },
    { type: 'scorm',      icon: 'pi-graduation-cap',   label: 'SCORM / LMS',   desc: 'Moodle, Canvas, Blackboard', color: 'gray'   },
  ];

  selectedFile       = signal<File | null>(null);
  isDragging         = signal(false);
  uploading          = signal(false);
  uploadProgress     = signal(0);
  processingProgress = signal(0);
  generating         = signal(false);
  generatingType     = signal<string>('');
  errorMessage       = signal('');
  uploadedDocumentId = signal<number | null>(null);
  isCompleted        = signal(false);
  recentDocuments    = signal<DocumentItem[]>([]);
  cachedGenerations  = signal<GenerationCache[]>([]);

  // Fase atual do processamento para mensagens em tempo real
  faseProcessamento = signal<'enviando' | 'analisando' | 'finalizando' | ''>('');

  // Indica se a geração de conteúdo está liberada (só quando o documento está 100% processado)
  botoesDisponiveis = signal(false);

  // Controla o loading skeleton enquanto a lista de documentos carrega
  loadingDocs = signal(true);

  private readonly MAX_SIZE = 100 * 1024 * 1024;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    // Se entrou no modo demo, prepara a tela como se um documento estivesse pronto
    if (this.demoService.isDemo()) {
      this.isCompleted.set(true);
      this.botoesDisponiveis.set(true);
      this.processingProgress.set(100);
      this.loadingDocs.set(false);
      return;
    }
    this.loadDocuments();
  }

  // Abre/fecha a sidebar no mobile
  alternarMenu() {
    this.menuAberto.update(v => !v);
  }

  fecharMenu() {
    this.menuAberto.set(false);
  }

  alternarColapso() {
    const novoValor = !this.colapsado();
    this.colapsado.set(novoValor);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY_SIDEBAR, String(novoValor));
    }
  }

  alternarTema() {
    this.theme.alternar();
  }

  perguntarIA() {
    this.toast.info(
      'Estamos preparando o assistente de IA do EduCore para conversar com você em tempo real. Em breve por aqui!',
      'Em breve',
    );
  }

  logout() {
    this.auth.logout();
  }

  private carregarColapsado(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return localStorage.getItem(STORAGE_KEY_SIDEBAR) === 'true';
  }

  // Carrega os últimos 10 documentos para a lista "Materiais recentes" (sidebar)
  loadDocuments() {
    this.loadingDocs.set(true);
    this.aiService.listDocuments().subscribe({
      next: docs => {
        const ultimos10 = [...docs]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);
        this.recentDocuments.set(ultimos10);
        this.loadingDocs.set(false);
      },
      error: () => {
        this.recentDocuments.set([]);
        this.loadingDocs.set(false);
      },
    });
  }

  statusClass(status: string): string {
    if (status === 'completed') return 'is-done';
    if (status === 'failed') return 'is-failed';
    return 'is-processing';
  }

  selectDocument(doc: DocumentItem) {
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

  reenviar(doc: DocumentItem, event: Event) {
    event.stopPropagation();
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

  generatingLabel(): string {
    const btn = this.actionButtons.find(b => b.type === this.generatingType());
    return btn?.label ?? 'conteúdo';
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

  mensagemFase(): string {
    const fase = this.faseProcessamento();
    if (fase === 'enviando')    return 'Enviando arquivo para o servidor...';
    if (fase === 'analisando')  return 'Analisando conteúdo com IA...';
    if (fase === 'finalizando') return 'Finalizando processamento...';
    return 'Iniciando análise do documento...';
  }

  tentarNovamente() {
    this.uploadedDocumentId.set(null);
    this.processingProgress.set(0);
    this.faseProcessamento.set('');
    this.botoesDisponiveis.set(false);
    this.errorMessage.set('');
    this.selectedFile.set(null);
  }

  enviarNovoPdf() {
    this.uploadedDocumentId.set(null);
    this.isCompleted.set(false);
    this.selectedFile.set(null);
    this.cachedGenerations.set([]);
    this.botoesDisponiveis.set(false);
    this.processingProgress.set(0);
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

  private startPolling(documentId: number) {
    this.stopPolling();
    this.pollingInterval = setInterval(() => {
      this.aiService.checkStatus(documentId).subscribe({
        next: (status: DocumentStatus) => {
          const progresso = status.progress_percent ?? 0;
          this.processingProgress.set(progresso);

          if (progresso >= 80) {
            this.faseProcessamento.set('finalizando');
          } else if (progresso >= 10) {
            this.faseProcessamento.set('analisando');
          }

          if (status.status === 'completed') {
            this.stopPolling();
            this.faseProcessamento.set('');
            this.processingProgress.set(100);
            this.isCompleted.set(true);
            this.botoesDisponiveis.set(true);
            this.loadDocuments();
            this.loadGenerations(documentId);
          } else if (status.status === 'failed') {
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

  // Clica no tipo — se modo demo carrega mock, senão chama a API
  generate(type: GenerationType | string) {
    // Modo demo: carrega mock instantaneamente
    if (this.demoService.isDemo()) {
      const tiposDemo: GenerationType[] = ['quiz', 'summary', 'slides', 'mindmap', 'flashcards', 'pcd'];
      if (tiposDemo.includes(type as GenerationType)) {
        this.demoService.loadMock(type as GenerationType);
        this.router.navigate(['/resultado', type]);
      } else {
        this.toast.aviso('Esta exportação não está disponível no Modo Demo.', 'Modo Demo');
      }
      return;
    }

    const documentId = this.uploadedDocumentId();
    if (!documentId || this.generating()) return;

    if (type === 'kahoot' || type === 'socrative' || type === 'scorm') {
      this.triggerExport(documentId, type as 'kahoot' | 'socrative' | 'scorm');
      return;
    }

    this.generating.set(true);
    this.generatingType.set(type);
    this.errorMessage.set('');

    const cached = this.isCached(type);
    if (cached) {
      this.toast.info('Usando resultado salvo.', 'Conteúdo em cache');
    }

    const source = cached
      ? this.aiService.getCachedGeneration(documentId, type)
      : this.aiService.generateContent(documentId, type as GenerationType);

    source.subscribe({
      next: response => {
        this.generating.set(false);
        this.generatingType.set('');
        if (!cached) this.loadGenerations(documentId);
        this.store.set({ result: response, type: type as GenerationType, documentId });
        this.router.navigate(['/resultado', type]);
      },
      error: (err: HttpErrorResponse) => {
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
      type === 'kahoot'      ? this.aiService.exportKahoot(documentId)
      : type === 'socrative' ? this.aiService.exportSocrative(documentId)
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
