import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { LucideAngularModule, Flag, Clock, Trophy } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { QuizService } from '../../services/quiz.service';
import { QuizCardComponent } from '../../components/quiz-card/quiz-card.component';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [LucideAngularModule, CommonModule, QuizCardComponent, RouterModule],
})
export class HomeComponent implements OnInit, OnDestroy {
    readonly icons = { Flag, Clock, Trophy };
    currentUser: any = null;
    userQuizzes: any[] = [];
    gameHistory: any[] = [];
    isLoadingQuizzes = false;
    isLoadingHistory = false;

    private authSub?: Subscription;

    constructor(private authService: AuthService, private quizService: QuizService, private cdr: ChangeDetectorRef) {}

    ngOnInit() {
        this.authSub = this.authService.user$.subscribe(user => {
            this.currentUser = user;
            const activeId = user?.id?.toString() || user?._id?.toString();
            if (activeId) {
                this.loadUserQuizzes(activeId);
                this.loadUserHistory(activeId);
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

    loadUserHistory(userId: string) {
        this.isLoadingHistory = true;
        this.quizService.getUserHistory(userId).subscribe({
            next: (history) => {
                this.gameHistory = history;
                this.isLoadingHistory = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load history', err);
                this.isLoadingHistory = false;
                this.cdr.detectChanges();
            }
        });
    }

    getUserScore(game: any) {
        const userId = this.currentUser?.id?.toString() || this.currentUser?._id?.toString();
        const player = game.players.find((p: any) => p.userId?.toString() === userId);
        return player ? player.score : 0;
    }

    ngOnDestroy() {
        this.authSub?.unsubscribe();
    }
}
