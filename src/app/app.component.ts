import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Bell, Award, History, LogOut, Search, Gamepad2, Plus } from 'lucide-angular';
import { AuthService } from './services/auth.service';
import { QuizService } from './services/quiz.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
})
export class AppComponent implements OnInit {
  title = 'LeGrandQuizz';
  readonly icons = { LayoutDashboard, Bell, Award, History, LogOut, Search, Gamepad2, Plus };
  currentUser: any = null;
  userQuizzes: any[] = [];
  isLoadingQuizzes = false;

  constructor(
    public router: Router,
    public authService: AuthService,
    private quizService: QuizService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      const activeId = user?.id?.toString() || user?._id?.toString();
      if (activeId) {
        this.loadUserQuizzes(activeId);
      } else {
        this.userQuizzes = [];
      }
    });
  }

  loadUserQuizzes(userId: string) {
    this.isLoadingQuizzes = true;
    this.quizService.getUserQuizzes(userId).subscribe({
      next: (quizzes) => {
        this.userQuizzes = quizzes;
        this.isLoadingQuizzes = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load quizzes', err);
        this.isLoadingQuizzes = false;
        this.cdr.detectChanges();
      }
    });
  }

  get isAuthRoute(): boolean {
    return this.router.url.startsWith('/join');
  }

  logout() {
    this.authService.logout();
  }
}
