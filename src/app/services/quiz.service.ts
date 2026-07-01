import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private apiUrl = '/api/quizzes';

  constructor(private http: HttpClient) {}

  getUserQuizzes(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`);
  }

  getQuizById(quizId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${quizId}`);
  }

  createQuiz(quizData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, quizData);
  }

  updateQuiz(quizId: string, quizData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${quizId}`, quizData);
  }

  getUserHistory(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/history/user/${userId}`);
  }
}
