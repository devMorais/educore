import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ForumTopic, ForumReply, Paginated, TopicFilters } from '../types/forum';

@Injectable({ providedIn: 'root' })
export class ForumService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Lista tópicos com paginação e busca opcional
  listTopics(filters: TopicFilters = {}): Observable<Paginated<ForumTopic>> {
    let params = new HttpParams();
    if (filters.search)   params = params.set('search', filters.search);
    if (filters.page)     params = params.set('page', filters.page.toString());
    if (filters.per_page) params = params.set('per_page', filters.per_page.toString());

    return this.http.get<Paginated<ForumTopic>>(`${this.baseUrl}/forum/topics`, {
      params,
      withCredentials: true,
    });
  }

  // Cria um novo tópico
  createTopic(title: string, body: string): Observable<ForumTopic> {
    return this.http.post<ForumTopic>(
      `${this.baseUrl}/forum/topics`,
      { title, body },
      { withCredentials: true },
    );
  }

  // Remove um tópico (soft delete) — autor ou admin
  deleteTopic(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/forum/topics/${id}`, {
      withCredentials: true,
    });
  }

  // Lista respostas de um tópico, paginadas
  listReplies(topicId: number, page = 1, perPage = 10): Observable<Paginated<ForumReply>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<Paginated<ForumReply>>(
      `${this.baseUrl}/forum/topics/${topicId}/replies`,
      { params, withCredentials: true },
    );
  }

  // Cria uma nova resposta no tópico
  createReply(topicId: number, body: string): Observable<ForumReply> {
    return this.http.post<ForumReply>(
      `${this.baseUrl}/forum/topics/${topicId}/replies`,
      { body },
      { withCredentials: true },
    );
  }

  // Remove uma resposta (soft delete) — autor ou admin
  deleteReply(topicId: number, replyId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/forum/topics/${topicId}/replies/${replyId}`,
      { withCredentials: true },
    );
  }
}