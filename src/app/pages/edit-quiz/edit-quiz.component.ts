import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Trash2, Save, ArrowLeft } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { QuizService } from '../../services/quiz.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-edit-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule],
  templateUrl: './edit-quiz.component.html',
  styleUrl: './edit-quiz.component.scss',
})
export class EditQuizComponent implements OnInit {
  readonly icons = { Plus, Trash2, Save, ArrowLeft };

  quizId: string = '';
  quiz = {
    title: '',
    description: '',
    category: '',
    timeLimit: 15,
    isPublic: true,
    image: ''
  };

  questions: { text: string; options: string[]; correctOption: number }[] = [];

  currentUser: any = null;
  isSaving = false;
  isLoading = true;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private quizService: QuizService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
    });

    this.quizId = this.route.snapshot.paramMap.get('id') || '';
    if (this.quizId) {
      this.loadQuiz();
    } else {
      this.router.navigate(['/home']);
    }
  }

  loadQuiz() {
    this.isLoading = true;
    this.quizService.getQuizById(this.quizId).subscribe({
      next: (data) => {
        const ownerId = data.owner?.toString();
        const userId = this.currentUser?.id?.toString() || this.currentUser?._id?.toString();
        if (ownerId && userId && ownerId !== userId) {
          this.router.navigate(['/home']);
          return;
        }
        this.quiz = {
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          timeLimit: data.timeLimit || 15,
          isPublic: data.isPublic ?? true,
          image: data.image || ''
        };
        this.questions = data.questions?.length
          ? data.questions.map((q: any) => ({
              text: q.text || '',
              options: q.options?.length ? [...q.options] : ['', '', '', ''],
              correctOption: q.correctOption || 0
            }))
          : [{ text: '', options: ['', '', '', ''], correctOption: 0 }];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load quiz', err);
        this.errorMessage = 'Could not load quiz. It may not exist.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  addQuestion() {
    this.questions.push({ text: '', options: ['', '', '', ''], correctOption: 0 });
  }

  removeQuestion(index: number) {
    this.questions.splice(index, 1);
  }

  trackByIndex(index: number): number {
    return index;
  }

  saveQuiz() {
    this.errorMessage = '';
    if (!this.currentUser) {
      this.errorMessage = 'Session not detected. Please login again.';
      return;
    }
    this.isSaving = true;

    const quizPayload = {
      ...this.quiz,
      owner: this.currentUser.id?.toString() || this.currentUser._id?.toString(),
      questions: this.questions
    };

    this.quizService.updateQuiz(this.quizId, quizPayload).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Error updating quiz', err);
        this.errorMessage = 'Could not update quiz: ' + (err.error?.error || 'Unknown Server Error');
        this.isSaving = false;
      }
    });
  }
}
