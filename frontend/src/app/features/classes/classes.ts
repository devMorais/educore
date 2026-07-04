import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassesService } from '../../core/services/classes.service';
import type { Turma, Aluno } from '../../core/types/classes';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, DialogModule, InputTextModule,
    TextareaModule, DrawerModule, ToastModule, SkeletonModule,
    AvatarModule, TagModule,
  ],
  providers: [MessageService],
  templateUrl: './classes.html',
  styleUrl: './classes.scss',
})
export class ClassesComponent implements OnInit {
  private svc = inject(ClassesService);
  private toast = inject(MessageService);

  turmas = signal<Turma[]>([]);
  carregando = signal(true);

  dialogAberto = signal(false);
  salvando = signal(false);
  nomeTurma = signal('');
  descricaoTurma = signal('');

  sidebarAberta = signal(false);
  turmaSelecionada = signal<Turma | null>(null);
  alunosMatriculados = signal<Aluno[]>([]);
  carregandoAlunos = signal(false);

  termoBusca = signal('');
  resultadosBusca = signal<Aluno[]>([]);
  buscando = signal(false);
  private timeoutBusca: ReturnType<typeof setTimeout> | undefined;

  ngOnInit() {
    this.carregarTurmas();
  }

  carregarTurmas() {
    this.carregando.set(true);
    this.svc.listar().subscribe({
      next: (data) => { this.turmas.set(data); this.carregando.set(false); },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Erro', detail: 'Nao foi possivel carregar as turmas.' });
        this.carregando.set(false);
      },
    });
  }

  abrirDialog() {
    this.nomeTurma.set('');
    this.descricaoTurma.set('');
    this.dialogAberto.set(true);
  }

  criarTurma() {
    if (!this.nomeTurma().trim()) return;
    this.salvando.set(true);
    this.svc.criar({ name: this.nomeTurma(), description: this.descricaoTurma() }).subscribe({
      next: (nova) => {
        this.turmas.update(t => [nova, ...t]);
        this.dialogAberto.set(false);
        this.salvando.set(false);
        this.toast.add({ severity: 'success', summary: 'Turma criada!', detail: nova.name });
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Erro', detail: 'Nao foi possivel criar a turma.' });
        this.salvando.set(false);
      },
    });
  }

  abrirSidebar(turma: Turma) {
    this.turmaSelecionada.set(turma);
    this.termoBusca.set('');
    this.resultadosBusca.set([]);
    this.sidebarAberta.set(true);
    this.carregarAlunos(turma.id);
  }

  carregarAlunos(classId: number) {
    this.carregandoAlunos.set(true);
    this.svc.listarAlunos(classId).subscribe({
      next: (res) => { this.alunosMatriculados.set(res.data); this.carregandoAlunos.set(false); },
      error: () => { this.carregandoAlunos.set(false); },
    });
  }

  onBuscarAlunos(termo: string) {
    this.termoBusca.set(termo);
    clearTimeout(this.timeoutBusca);
    if (!termo.trim()) { this.resultadosBusca.set([]); return; }
    this.buscando.set(true);
    this.timeoutBusca = setTimeout(() => {
      this.svc.buscarAlunos(termo).subscribe({
        next: (res) => {
          this.resultadosBusca.set(res.data);
          this.buscando.set(false);
        },
        error: () => this.buscando.set(false),
      });
    }, 400);
  }

  matricular(aluno: Aluno) {
    const turma = this.turmaSelecionada();
    if (!turma) return;
    this.svc.matricular(turma.id, aluno.id).subscribe({
      next: () => {
        this.alunosMatriculados.update(a => [...a, aluno]);
        this.turmas.update(t => t.map(t2 =>
          t2.id === turma.id ? { ...t2, students_count: t2.students_count + 1 } : t2
        ));
        this.resultadosBusca.set([]);
        this.termoBusca.set('');
        this.toast.add({ severity: 'success', summary: 'Matriculado!', detail: aluno.name });
      },
      error: () => this.toast.add({ severity: 'error', summary: 'Erro', detail: 'Nao foi possivel matricular.' }),
    });
  }

  removerAluno(aluno: Aluno) {
    const turma = this.turmaSelecionada();
    if (!turma) return;
    this.svc.remover(turma.id, aluno.id).subscribe({
      next: () => {
        this.alunosMatriculados.update(a => a.filter(x => x.id !== aluno.id));
        this.turmas.update(t => t.map(t2 =>
          t2.id === turma.id ? { ...t2, students_count: Math.max(0, t2.students_count - 1) } : t2
        ));
        this.toast.add({ severity: 'info', summary: 'Removido', detail: aluno.name });
      },
      error: () => this.toast.add({ severity: 'error', summary: 'Erro', detail: 'Nao foi possivel remover.' }),
    });
  }

  jaMatriculado(aluno: Aluno): boolean {
    return this.alunosMatriculados().some(a => a.id === aluno.id);
  }

  iniciais(nome: string): string {
    return nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }

  formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR');
  }
}