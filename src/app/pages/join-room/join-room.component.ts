import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Gamepad2, User, Key, CheckCircle2, MessageSquare, Send, Users, ArrowLeft, Check, Trophy, ChevronRight, X } from 'lucide-angular';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-join-room',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-[#f8faff] flex flex-col p-6 relative overflow-hidden">
      <!-- Decorative background -->
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 opacity-50 pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-100 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 opacity-50 pointer-events-none"></div>

      <!-- Join Form -->
      <div *ngIf="!joined" class="flex-grow flex items-center justify-center">
        <div class="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-blue-900/5 w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-500">
          <div class="text-center mb-10">
            <div class="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/30 rotate-3">
              <lucide-icon [img]="icons.Gamepad2" class="w-10 h-10 text-white -rotate-3"></lucide-icon>
            </div>
            <h1 class="text-3xl font-black text-[#00289d] mb-2">Join Game</h1>
            <p class="text-slate-500 font-medium">Enter the room code to start playing.</p>
          </div>

          <form (ngSubmit)="joinRoom()" class="flex flex-col gap-6">
            <div *ngIf="errorMessage" class="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold flex items-center gap-2">
              <lucide-icon [img]="icons.X" class="w-5 h-5 shrink-0"></lucide-icon>
              {{ errorMessage }}
            </div>

            <div class="flex flex-col gap-2">
              <label class="font-bold text-slate-700 ml-2">Room Code</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <lucide-icon [img]="icons.Key" class="w-5 h-5"></lucide-icon>
                </span>
                <input type="text" [(ngModel)]="roomCode" name="roomCode" placeholder="6-digit code" required maxlength="6"
                  class="input w-full bg-[#f8faff] border-2 border-transparent rounded-xl pl-12 h-14 font-mono text-xl tracking-widest focus:border-blue-600 focus:bg-white transition-colors" />
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label class="font-bold text-slate-700 ml-2">Your Name</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <lucide-icon [img]="icons.User" class="w-5 h-5"></lucide-icon>
                </span>
                <input type="text" [(ngModel)]="playerName" name="playerName" placeholder="Nickname" required
                  class="input w-full bg-[#f8faff] border-2 border-transparent rounded-xl pl-12 h-14 font-medium focus:border-blue-600 focus:bg-white transition-colors" />
              </div>
            </div>

            <button type="submit" [disabled]="!roomCode || !playerName || isConnecting"
              class="btn bg-[#2d55fb] hover:bg-blue-700 text-white border-none rounded-xl h-14 text-lg font-bold mt-4 shadow-xl shadow-blue-200/50 disabled:opacity-50">
              {{ isConnecting ? 'Connecting...' : 'Join Room' }}
            </button>
          </form>

          <div class="mt-8 text-center">
            <a routerLink="/home" class="text-slate-400 hover:text-blue-600 font-bold text-sm transition-colors">Go back to Home</a>
          </div>
        </div>
      </div>

      <!-- Joined Room Interface -->
      <div *ngIf="joined" class="flex flex-col gap-6 animate-in fade-in duration-500 max-w-5xl mx-auto w-full relative z-10 pb-10">

        <!-- Header -->
        <div class="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm">
          <div class="flex items-center gap-4">
            <button (click)="leaveRoom()" class="btn btn-circle btn-ghost bg-slate-50 hover:bg-slate-100">
              <lucide-icon [img]="icons.ArrowLeft" class="w-5 h-5 text-slate-500"></lucide-icon>
            </button>
            <div>
              <h1 class="text-2xl font-black text-[#00289d] flex items-center gap-2">
                <lucide-icon [img]="icons.Gamepad2" class="w-6 h-6 text-blue-600"></lucide-icon>
                <span *ngIf="gameState === 'lobby'">Room Lobby</span>
                <span *ngIf="gameState !== 'lobby'">Playing</span>
              </h1>
              <p class="text-slate-400 font-medium text-sm">
                <span *ngIf="gameState === 'lobby'">Waiting for the host to start...</span>
                <span *ngIf="gameState !== 'lobby'">Score: {{ currentScore }} pts</span>
              </p>
            </div>
          </div>
          <button (click)="leaveRoom()" class="btn bg-red-50 hover:bg-red-100 text-red-500 border-none rounded-xl font-bold">Leave Room</button>
        </div>

        <!-- LOBBY STATE -->
        <div *ngIf="gameState === 'lobby'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Room Code & Chat (Left Column) -->
          <div class="lg:col-span-2 flex flex-col gap-6">
            <div class="bg-[#2d55fb] rounded-[2rem] p-10 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[250px]">
              <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

              <p class="text-blue-100 font-bold tracking-wider uppercase text-sm mb-4">You are in Room:</p>
              <div class="text-7xl font-black tracking-widest bg-white/20 px-8 py-4 rounded-3xl backdrop-blur-sm border border-white/30 font-mono">
                {{ roomCode }}
              </div>
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
              <div *ngFor="let p of players" class="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 animate-in slide-in-from-right-4">
                <img [src]="p.avatar || 'https://i.pravatar.cc/150'" class="w-10 h-10 rounded-full object-cover shadow-sm">
                <span class="font-bold text-slate-700">{{ p.username }} <span *ngIf="p.username === playerName" class="text-xs text-blue-500 ml-1">(You)</span></span>
              </div>
            </div>

            <button disabled class="btn bg-slate-100 text-slate-400 border-none rounded-xl w-full h-14 mt-6 text-lg font-bold flex flex-col items-center justify-center leading-none">
              <span class="text-sm">Waiting for host...</span>
            </button>
          </div>
        </div>

        <!-- GAME STATE -->
        <div *ngIf="gameState === 'playing' || gameState === 'revealed'" class="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col items-center animate-in fade-in zoom-in-95">
          <div class="text-slate-500 font-bold bg-slate-50 px-4 py-2 rounded-xl mb-6">
            Question {{ questionIndex + 1 }} / {{ totalQuestions }}
          </div>

          <h2 class="text-2xl lg:text-4xl font-black text-slate-800 text-center max-w-3xl leading-tight mb-10">
            {{ currentQuestion?.text }}
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mb-6">
            <button *ngFor="let opt of currentQuestion?.options; let i = index"
                    (click)="submitAnswer(i)"
                    [disabled]="gameState === 'revealed' || selectedOptionIndex !== -1"
                    class="relative p-6 rounded-2xl border-4 transition-all duration-300 flex items-center justify-center min-h-[100px] text-xl font-bold text-center group"
                    [ngClass]="{
                      'border-slate-100 bg-slate-50 hover:border-blue-300 hover:bg-blue-50 text-slate-700': gameState === 'playing' && selectedOptionIndex === -1,
                      'border-[#2d55fb] bg-blue-50 text-[#2d55fb]': gameState === 'playing' && selectedOptionIndex === i,
                      'border-slate-100 bg-slate-50 text-slate-300 opacity-50': (gameState === 'playing' && selectedOptionIndex !== -1 && selectedOptionIndex !== i) || (gameState === 'revealed' && i !== correctOptionIndex && selectedOptionIndex !== i),
                      'border-green-500 bg-green-50 text-green-700': gameState === 'revealed' && i === correctOptionIndex,
                      'border-red-500 bg-red-50 text-red-700': gameState === 'revealed' && selectedOptionIndex === i && i !== correctOptionIndex
                    }">
              {{ opt }}

              <div *ngIf="gameState === 'revealed' && i === correctOptionIndex" class="absolute -top-4 -right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                <lucide-icon [img]="icons.Check" class="w-5 h-5"></lucide-icon>
              </div>
              <div *ngIf="gameState === 'revealed' && selectedOptionIndex === i && i !== correctOptionIndex" class="absolute -top-4 -right-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
                <lucide-icon [img]="icons.X" class="w-5 h-5"></lucide-icon>
              </div>
            </button>
          </div>

          <div *ngIf="gameState === 'playing' && selectedOptionIndex !== -1" class="text-blue-500 font-bold animate-pulse mt-4">
            Waiting for other players...
          </div>

          <div *ngIf="gameState === 'revealed'" class="mt-6 text-2xl font-black" [ngClass]="selectedOptionIndex === correctOptionIndex ? 'text-green-500' : 'text-red-500'">
            {{ selectedOptionIndex === correctOptionIndex ? '+1000 Pts!' : 'Incorrect!' }}
          </div>
        </div>

        <!-- FINISHED STATE -->
        <div *ngIf="gameState === 'finished'" class="bg-white rounded-[2rem] p-10 shadow-sm animate-in fade-in zoom-in-95 flex flex-col items-center">
          <div class="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 text-yellow-500">
            <lucide-icon [img]="icons.Trophy" class="w-12 h-12"></lucide-icon>
          </div>
          <h2 class="text-4xl font-black text-slate-800 mb-2">Game Over!</h2>
          <p class="text-slate-500 font-medium mb-12">Your final position.</p>

          <div class="w-full max-w-2xl bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
            <div *ngFor="let p of players; let i = index" class="flex items-center justify-between p-4 mb-3 bg-white rounded-xl shadow-sm border border-slate-100" [ngClass]="{'ring-4 ring-blue-500 ring-offset-2': p.username === playerName}">
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
                <span class="font-bold text-slate-700 text-lg">{{ p.username }} <span *ngIf="p.username === playerName" class="text-xs text-blue-500 ml-1">(You)</span></span>
              </div>
              <div class="font-black text-2xl text-blue-600">{{ p.score }} <span class="text-sm text-slate-400 font-medium">pts</span></div>
            </div>
          </div>

          <button (click)="leaveRoom()" class="btn bg-slate-100 text-slate-600 hover:bg-slate-200 border-none rounded-xl h-14 px-10 text-lg font-bold mt-10">
            Return to Home
          </button>
        </div>

      </div>
    </div>
  `
})
export class JoinRoomComponent implements OnInit, OnDestroy {
  readonly icons = { Gamepad2, User, Key, CheckCircle2, MessageSquare, Send, Users, ArrowLeft, Check, Trophy, ChevronRight, X };

  roomCode: string = '';
  playerName: string = '';
  errorMessage: string = '';
  isConnecting: boolean = false;
  joined: boolean = false;

  chatMessages: { sender: string; text: string; time: string; isSelf: boolean }[] = [];
  newMessage: string = '';
  players: any[] = [];
  currentScore: number = 0;

  // Game State
  gameState: 'lobby' | 'playing' | 'revealed' | 'finished' = 'lobby';
  currentQuestion: any = null;
  questionIndex: number = 0;
  totalQuestions: number = 0;
  selectedOptionIndex: number = -1;
  correctOptionIndex: number = -1;

  private subs: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getUser();
    if (user) {
      this.playerName = user.username;
    }

    this.route.queryParams.subscribe(params => {
      if (params['code']) {
        this.roomCode = params['code'];
      }
    });

    this.subs.add(this.socketService.onError().subscribe(msg => {
      this.errorMessage = msg;
      this.isConnecting = false;
      this.joined = false;
      this.cdr.detectChanges();
    }));

    this.subs.add(this.socketService.onHostDisconnected().subscribe(() => {
      this.errorMessage = 'The host disconnected. Room closed.';
      this.joined = false;
      this.gameState = 'lobby';
      this.cdr.detectChanges();
    }));

    this.subs.add(this.socketService.onChatMessage().subscribe(msg => {
      this.chatMessages.push({
        ...msg,
        isSelf: msg.sender === this.playerName
      });
      this.cdr.detectChanges();
      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 50);
    }));

    this.subs.add(this.socketService.onPlayerJoined().subscribe(players => {
      this.players = players;
      this.cdr.detectChanges();
    }));

    this.subs.add(this.socketService.onPlayerLeft().subscribe(players => {
      this.players = players;
      this.cdr.detectChanges();
    }));

    this.subs.add(this.socketService.onNewQuestion().subscribe((data) => {
      this.gameState = 'playing';
      this.questionIndex = data.questionIndex;
      this.totalQuestions = data.totalQuestions;
      this.currentQuestion = data.question;
      this.selectedOptionIndex = -1;
      this.correctOptionIndex = -1;
      this.cdr.detectChanges();
    }));

    this.subs.add(this.socketService.onAnswerRevealed().subscribe((data) => {
      this.gameState = 'revealed';
      this.correctOptionIndex = data.correctIndex;
      this.players = data.players;
      const myPlayer = this.players.find(p => p.username === this.playerName);
      if (myPlayer) this.currentScore = myPlayer.score;
      this.cdr.detectChanges();
    }));

    this.subs.add(this.socketService.onGameFinished().subscribe((leaderboard) => {
      this.gameState = 'finished';
      this.players = leaderboard;
      this.cdr.detectChanges();
    }));
  }

  joinRoom() {
    if (!this.roomCode || !this.playerName) return;
    this.errorMessage = '';
    this.isConnecting = true;

    const user = this.authService.getUser();
    const playerPayload = {
      id: user?.id,
      username: this.playerName,
      avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.playerName}`
    };

    this.socketService.joinRoom(this.roomCode, playerPayload);

    setTimeout(() => {
      if (!this.errorMessage) {
        this.joined = true;
        this.isConnecting = false;
        this.cdr.detectChanges();
      }
    }, 500);
  }

  submitAnswer(index: number) {
    if (this.gameState !== 'playing' || this.selectedOptionIndex !== -1) return;
    this.selectedOptionIndex = index;
    this.socketService.submitAnswer(this.roomCode, index);
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    const msgData = {
      sender: this.playerName,
      text: this.newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.socketService.sendMessage(this.roomCode, msgData);
    this.newMessage = '';
  }

  leaveRoom() {
    this.socketService.disconnect();
    this.joined = false;
    this.gameState = 'lobby';
    this.router.navigate(['/home']);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.socketService.disconnect();
  }
}
