import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-quiz-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-[#f8faff] rounded-[2rem] p-6 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full">
      <div class="relative overflow-hidden rounded-2xl mb-6">
        <img [src]="quiz?.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=60'"
             class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
        <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold shadow-sm"
             [ngClass]="quiz?.isPublic ? 'text-green-600' : 'text-slate-500'">
          {{ quiz?.isPublic ? 'Public' : 'Private' }}
        </div>
      </div>
      <h3 class="text-xl font-bold text-[#00289d] mb-2">{{ quiz?.title }}</h3>
      <p class="text-slate-500 text-sm font-medium line-clamp-2 flex-grow">{{ quiz?.description }}</p>
      <div class="mt-4 flex items-center justify-between pt-4 border-t border-slate-100">
        <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">
          {{ quiz?.questions?.length || 0 }} question{{ (quiz?.questions?.length || 0) === 1 ? '' : 's' }}
        </span>
        <button (click)="goToEdit($event)"
           class="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>
      </div>
    </div>
  `
})
export class QuizCardComponent {
  @Input() quiz: any;

  constructor(private router: Router) {}

  goToEdit(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (this.quiz?._id) {
      this.router.navigate(['/edit-quiz', this.quiz._id]);
    }
  }
}
