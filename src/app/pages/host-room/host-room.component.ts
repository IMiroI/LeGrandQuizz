import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Users, Copy, ArrowLeft, Gamepad2, Send, MessageSquare, Check, Trophy, ChevronRight, X } from 'lucide-angular';
import { QuizService } from '../../services/quiz.service';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-host-room',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FormsModule],
  template: `
    <div class="flex flex-col gap-6 animate-in fade-in duration-500 max-w-5xl mx-auto mt-6 pb-10">

      <!-- Header -->
      <div class="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm">
        <div class="flex items-center gap-4">
          <button (click)="endSession()" class="btn btn-circle btn-ghost bg-slate-50 hover:bg-slate-100">
            <lucide-icon [img]="icons.ArrowLeft" class="w-5 h-5 text-slate-500"></lucide-icon>
          </button>
          <div>
            <h1 class="text-2xl font-black text-[#00289d] flex items-center gap-2">
              <lucide-icon [img]="icons.Gamepad2" class="w-6 h-6 text-blue-600"></lucide-icon>
              {{ gameState === 'lobby' ? 'Room Lobby' : 'Live Game' }}
            </h1>
            <p class="text-slate-400 font-medium text-sm">Quiz: <span class="text-slate-600 font-bold">{{ quiz?.title || 'Loading...' }}</span></p>
          </div>
        </div>
        <div class="flex gap-4 items-center">
          <div *ngIf="gameState !== 'lobby' && gameState !== 'finished'" class="text-slate-500 font-bold bg-slate-100 px-4 py-2 rounded-xl">
            Question {{ questionIndex + 1 }} / {{ totalQuestions }}
          </div>
          <button (click)="endSession()" class="btn bg-red-50 hover:bg-red-100 text-red-500 border-none rounded-xl font-bold">End Session</button>
        </div>
      </div>

      <!-- LOBBY STATE -->
      <div *ngIf="gameState === 'lobby'" class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95">
        <!-- Room Code & Chat (Left Column) -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          <div class="bg-[#2d55fb] rounded-[2rem] p-10 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[250px]">
            <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

            <p class="text-blue-100 font-bold tracking-wider uppercase text-sm mb-4">Join at localhost:3001/join with code:</p>
            <div class="text-7xl font-black tracking-widest bg-white/20 px-8 py-4 rounded-3xl backdrop-blur-sm border border-white/30 mb-6 font-mono">
              {{ roomCode }}
            </div>
            <button (click)="copyCode()" class="btn btn-sm bg-white/20 hover:bg-white/30 text-white border-none rounded-full px-6 font-medium backdrop-blur-md">
              <lucide-icon [img]="icons.Copy" class="w-4 h-4 mr-1.5"></lucide-icon>
              {{ copied ? 'Copied!' : 'Copy Join Link' }}
            </button>
          </div>

          <!-- Chat Section -->
          <div class="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col h-[400px]">
            <h3 class="font-bold text-[#00289d] text-lg flex items-center gap-2 mb-4 border-b border-slate-100 pb-4">
              <lucide-icon [img]="icons.MessageSquare" class="w-5 h-5 text-blue-500"></lucide-icon>
              Room Chat
            </h3>

            <div class="flex-grow flex flex-col gap-3 overflow-y-auto pr-2 mb-4 chat-container">
              <div *ngIf="chatMessages.length === 0" class="flex-grow flex items-center justify-center text-slate-400 text-sm font-medium">
                No messages yet. Say hi!
              </div>
              <div *ngFor="let msg of chatMessages" class="flex flex-col animate-in fade-in" [ngClass]="msg.isSelf ? 'items-end' : 'items-start'">
                <span class="text-[10px] font-bold text-slate-400 mb-1 px-1">{{ msg.sender }} • {{ msg.time }}</span>
                <div class="px-4 py-2 rounded-2xl max-w-[80%] text-sm"
                     [ngClass]="msg.isSelf ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-700 rounded-tl-sm'">
                  {{ msg.text }}
                </div>
              </div>
            </div>

            <form (ngSubmit)="sendMessage()" class="flex gap-2">
              <input type="text" [(ngModel)]="newMessage" name="newMessage" placeholder="Type a message..."
                     class="input flex-grow bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 h-12" />
              <button type="submit" [disabled]="!newMessage.trim()" class="btn btn-square bg-[#2d55fb] hover:bg-blue-700 text-white border-none rounded-xl h-12">
                <lucide-icon [img]="icons.Send" class="w-5 h-5"></lucide-icon>
              </button>
            </form>
          </div>
        </div>

        <!-- Players List (Right Column) -->
        <div class="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col h-[674px]">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-[#00289d] text-lg flex items-center gap-2">
              <lucide-icon [img]="icons.Users" class="w-5 h-5 text-blue-500"></lucide-icon>
              Players ({{ players.length }})
            </h3>
            <div class="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          </div>

          <div class="flex-grow flex flex-col gap-3 overflow-y-auto pr-2">
            <div *ngIf="players.length === 0" class="flex-grow flex flex-col items-center justify-center text-slate-400 gap-3">
              <div class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                <lucide-icon [img]="icons.Users" class="w-6 h-6 opacity-50"></lucide-icon>
              </div>
              <p class="font-medium text-sm text-center">Waiting for players<br>to join...</p>
            </div>

            <div *ngFor="let p of players" class="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 animate-in slide-in-from-right-4">
              <img [src]="p.avatar || 'https://i.pravatar.cc/150'" class="w-10 h-10 rounded-full object-cover shadow-sm">
              <span class="font-bold text-slate-700">{{ p.username }}</span>
            </div>
          </div>

          <button (click)="startGame()" class="btn bg-green-500 hover:bg-green-600 text-white border-none rounded-xl w-full h-14 mt-6 text-lg font-bold shadow-lg shadow-green-200" [disabled]="players.length < 2">
            {{ players.length < 2 ? 'Need 2+ players' : 'Start Game' }}
          </button>
        </div>
      </div>

      <!-- PLAYING / REVEALED STATE -->
      <div *ngIf="gameState === 'playing' || gameState === 'revealed'" class="bg-white rounded-[2rem] p-10 shadow-sm animate-in fade-in zoom-in-95 flex flex-col items-center">

        <div class="w-full flex justify-between items-center mb-10">
          <div class="flex gap-2 items-center">
            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xl">
              {{ questionIndex + 1 }}
            </div>
            <div class="h-2 bg-slate-100 rounded-full w-48 overflow-hidden">
              <div class="h-full bg-blue-500 transition-all duration-500" [style.width]="((questionIndex + 1) / totalQuestions * 100) + '%'"></div>
            </div>
          </div>

          <div class="bg-slate-50 px-6 py-3 rounded-xl font-bold text-slate-600 flex items-center gap-3">
            <lucide-icon [img]="icons.Users" class="w-5 h-5 text-slate-400"></lucide-icon>
            {{ answeredPlayers.size }} / {{ players.length }} Answered
          </div>
        </div>

        <h2 class="text-4xl font-black text-slate-800 text-center max-w-3xl leading-tight mb-12">
          {{ currentQuestion?.text }}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mb-12">
          <div *ngFor="let opt of currentQuestion?.options; let i = index"
               class="relative p-6 rounded-2xl border-4 transition-all duration-300 flex items-center justify-center min-h-[100px] text-xl font-bold text-center"
               [ngClass]="{
                 'border-slate-100 bg-slate-50 text-slate-700': gameState === 'playing',
                 'border-green-500 bg-green-50 text-green-700': gameState === 'revealed' && i === correctOptionIndex,
                 'border-slate-100 bg-slate-50 text-slate-300 opacity-50': gameState === 'revealed' && i !== correctOptionIndex
               }">
            {{ opt.text || opt }}

            <div *ngIf="gameState === 'revealed' && i === correctOptionIndex" class="absolute -top-4 -right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
              <lucide-icon [img]="icons.Check" class="w-5 h-5"></lucide-icon>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex gap-4 w-full max-w-md">
          <button *ngIf="gameState === 'playing'" (click)="revealAnswer()" class="btn flex-1 bg-yellow-500 hover:bg-yellow-600 text-white border-none rounded-xl h-14 text-lg font-bold shadow-lg shadow-yellow-200">
            Reveal Answer
          </button>

          <button *ngIf="gameState === 'revealed'" (click)="nextQuestion()" class="btn flex-1 bg-[#2d55fb] hover:bg-blue-700 text-white border-none rounded-xl h-14 text-lg font-bold shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2">
            {{ questionIndex + 1 >= totalQuestions ? 'Show Leaderboard' : 'Next Question' }}
            <lucide-icon [img]="icons.ChevronRight" class="w-5 h-5"></lucide-icon>
          </button>
        </div>
      </div>

      <!-- FINISHED STATE -->
      <div *ngIf="gameState === 'finished'" class="bg-white rounded-[2rem] p-10 shadow-sm animate-in fade-in zoom-in-95 flex flex-col items-center">
        <div class="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 text-yellow-500">
          <lucide-icon [img]="icons.Trophy" class="w-12 h-12"></lucide-icon>
        </div>
        <h2 class="text-4xl font-black text-slate-800 mb-2">Game Finished!</h2>
        <p class="text-slate-500 font-medium mb-12">Here are the final results.</p>

        <div class="w-full max-w-2xl bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
          <div *ngFor="let p of finalLeaderboard; let i = index" class="flex items-center justify-between p-4 mb-3 bg-white rounded-xl shadow-sm border border-slate-100">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg"
                   [ngClass]="{
                     'bg-yellow-100 text-yellow-600': i === 0,
                     'bg-slate-200 text-slate-600': i === 1,
                     'bg-orange-100 text-orange-600': i === 2,
                     'text-slate-400': i > 2
                   }">
                #{{ i + 1 }}
              </div>
              <img [src]="p.avatar" class="w-12 h-12 rounded-full object-cover">
              <span class="font-bold text-slate-700 text-lg">{{ p.username }}</span>
            </div>
            <div class="font-black text-2xl text-blue-600">{{ p.score }} <span class="text-sm text-slate-400 font-medium">pts</span></div>
          </div>
        </div>

        <button (click)="endSession()" class="btn bg-[#2d55fb] hover:bg-blue-700 text-white border-none rounded-xl h-14 px-10 text-lg font-bold mt-10 shadow-lg shadow-blue-200/50">
          Close Room
        </button>
      </div>

    </div>
  `
})
export class HostRoomComponent implements OnInit, OnDestroy {
  readonly icons = { Users, Copy, ArrowLeft, Gamepad2, Send, MessageSquare, Check, Trophy, ChevronRight, X };

  quizId: string = '';
  quiz: any = null;
  roomCode: string = '';
  players: any[] = [];
  copied = false;

  chatMessages: { sender: string; text: string; time: string; isSelf: boolean }[] = [];
  newMessage: string = '';
  currentUser: any = null;

  // Game State
  gameState: 'lobby' | 'playing' | 'revealed' | 'finished' = 'lobby';
  currentQuestion: any = null;
  questionIndex: number = 0;
  totalQuestions: number = 0;
  answeredPlayers: Set<string> = new Set();
  correctOptionIndex: number = -1;
  finalLeaderboard: any[] = [];

  private subs: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private quizService: QuizService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getUser();

    this.quizId = this.route.snapshot.paramMap.get('id') || '';
    if (this.quizId) {
      this.quizService.getQuizById(this.quizId).subscribe(q => {
        this.quiz = q;
        this.cdr.detectChanges();
      });
    }

    this.roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.socketService.createRoom(this.roomCode, this.quizId);

    this.subs.add(this.socketService.onPlayerJoined().subscribe(players => {
      this.players = players;
      this.cdr.detectChanges();
    }));

    this.subs.add(this.socketService.onPlayerLeft().subscribe(players => {
      this.players = players;
      this.cdr.detectChanges();
    }));

    this.subs.add(this.socketService.onChatMessage().subscribe(msg => {
      this.chatMessages.push({
        ...msg,
        isSelf: msg.sender === (this.currentUser?.username || 'Host')
      });
      this.cdr.detectChanges();
      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 50);
    }));

    this.subs.add(this.socketService.onGameStarted().subscribe(() => {
      this.socketService.nextQuestion(this.roomCode);
    }));

    this.subs.add(this.socketService.onNewQuestion().subscribe((data) => {
      this.gameState = 'playing';
      this.questionIndex = data.questionIndex;
      this.totalQuestions = data.totalQuestions;
      this.currentQuestion = data.question;
      this.answeredPlayers.clear();
      this.correctOptionIndex = -1;
      this.cdr.detectChanges();
    }));

    this.subs.add(this.socketService.onPlayerAnswered().subscribe((data) => {
      this.answeredPlayers.add(data.playerId);
      this.cdr.detectChanges();
    }));

    this.subs.add(this.socketService.onAllPlayersAnswered().subscribe(() => {
      console.log('All players have answered');
    }));

    this.subs.add(this.socketService.onAnswerRevealed().subscribe((data) => {
      this.gameState = 'revealed';
      this.correctOptionIndex = data.correctIndex;
      this.players = data.players;
      this.cdr.detectChanges();
    }));

    this.subs.add(this.socketService.onGameFinished().subscribe((leaderboard) => {
      this.gameState = 'finished';
      this.finalLeaderboard = leaderboard;
      this.cdr.detectChanges();
    }));
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    const msgData = {
      sender: this.currentUser?.username || 'Host',
      text: this.newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.socketService.sendMessage(this.roomCode, msgData);
    this.newMessage = '';
  }

  copyCode() {
    navigator.clipboard.writeText('http://localhost:3001/join?code=' + this.roomCode);
    this.copied = true;
    setTimeout(() => { this.copied = false; this.cdr.detectChanges(); }, 2000);
  }

  startGame() {
    if (this.players.length < 2) return;
    this.socketService.startGame(this.roomCode);
  }

  revealAnswer() {
    this.socketService.revealAnswer(this.roomCode);
  }

  nextQuestion() {
    this.socketService.nextQuestion(this.roomCode);
  }

  endSession() {
    this.socketService.disconnect();
    this.router.navigate(['/home']);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.socketService.disconnect();
  }
}
