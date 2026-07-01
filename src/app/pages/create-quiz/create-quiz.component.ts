import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Trash2, Save } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { QuizService } from '../../services/quiz.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './create-quiz.component.html',
  styleUrl: './create-quiz.component.scss',
})
export class CreateQuizComponent implements OnInit {
  readonly icons = { Plus, Trash2, Save };

  quiz = {
    title: '',
    description: '',
    category: '',
    timeLimit: 15
  };

  questions = [
    { text: '', options: ['', '', '', ''], correctOption: 0 }
  ];

  currentUser: any = null;
  isSaving = false;
  errorMessage = '';

  constructor(private authService: AuthService, private quizService: QuizService, private router: Router) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
    });
  }

  addQuestion() {
    this.questions.push({ text: '', options: ['', '', '', ''], correctOption: 0 });
  }

  removeQuestion(index: number) {
    this.questions.splice(index, 1);
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  saveQuiz() {
    this.errorMessage = '';
    if (!this.currentUser) {
        this.errorMessage = "Session not detected. Please login again.";
        return;
    }
    this.isSaving = true;

    const quizPayload = {
        ...this.quiz,
        owner: this.currentUser.id || this.currentUser._id,
        isPublic: true,
        questions: this.questions
    };

    if (!quizPayload.owner) {
        this.errorMessage = "Failed to determine user ID.";
        this.isSaving = false;
        return;
    }

    this.quizService.createQuiz(quizPayload).subscribe({
        next: (res) => {
            console.log('Quiz saved', res);
            this.isSaving = false;
            this.router.navigate(['/home']);
        },
        error: (err) => {
            console.error('Error saving quiz', err);
            this.errorMessage = 'Could not save quiz: ' + (err.error?.error || 'Unknown Server Error');
            this.isSaving = false;
        }
    });
  }
}
