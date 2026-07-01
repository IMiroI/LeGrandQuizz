import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<any>(undefined); // undefined = loading
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUser();
  }

  private loadUser() {
    this.http.get('/vgames/api/auth/verify').subscribe({
      next: (res: any) => this.userSubject.next(res?.valid ? res.user : null),
      error: () => this.userSubject.next(null)
    });
  }

  getUser() {
    return this.userSubject.value;
  }

  logout() {
    const loginUrl = window.location.protocol === 'https:' ? 'https://localhost/login' : 'http://localhost:3000/login';
    this.http.get('/vgames/logout').subscribe({
      complete: () => { window.location.href = loginUrl; },
      error: () => { window.location.href = loginUrl; }
    });
  }
}
