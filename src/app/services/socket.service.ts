import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3004', { autoConnect: true });
  }

  connect() {
    if (this.socket.disconnected) {
      this.socket.connect();
    }
  }

  // --- Host Events ---
  createRoom(roomCode: string, quizId: string) {
    this.connect();
    this.socket.emit('create-room', roomCode, quizId);
  }

  startGame(roomCode: string) {
    this.socket.emit('start-game', roomCode);
  }

  onPlayerJoined(): Observable<any[]> {
    return new Observable((observer) => {
      this.socket.on('player-joined', (players: any[]) => {
        observer.next(players);
      });
    });
  }

  onPlayerLeft(): Observable<any[]> {
    return new Observable((observer) => {
      this.socket.on('player-left', (players: any[]) => {
        observer.next(players);
      });
    });
  }

  // --- Player Events ---
  joinRoom(roomCode: string, player: any) {
    this.connect();
    this.socket.emit('join-room', roomCode, player);
  }

  onGameStarted(): Observable<void> {
    return new Observable((observer) => {
      this.socket.on('game-started', () => {
        observer.next();
      });
    });
  }

  // --- Game Loop Events ---
  nextQuestion(roomCode: string) {
    this.connect();
    this.socket.emit('next-question', roomCode);
  }

  onNewQuestion(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('new-question', (data: any) => observer.next(data));
    });
  }

  submitAnswer(roomCode: string, answerIndex: number) {
    this.connect();
    this.socket.emit('submit-answer', roomCode, answerIndex);
  }

  onPlayerAnswered(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('player-answered', (data: any) => observer.next(data));
    });
  }

  onAllPlayersAnswered(): Observable<void> {
    return new Observable((observer) => {
      this.socket.on('all-players-answered', () => observer.next());
    });
  }

  revealAnswer(roomCode: string) {
    this.connect();
    this.socket.emit('reveal-answer', roomCode);
  }

  onAnswerRevealed(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('answer-revealed', (data: any) => observer.next(data));
    });
  }

  onGameFinished(): Observable<any[]> {
    return new Observable((observer) => {
      this.socket.on('game-finished', (leaderboard: any[]) => observer.next(leaderboard));
    });
  }

  onHostDisconnected(): Observable<void> {
    return new Observable((observer) => {
      this.socket.on('host-disconnected', () => {
        observer.next();
      });
    });
  }

  onError(): Observable<string> {
    return new Observable((observer) => {
      this.socket.on('error', (message: string) => {
        observer.next(message);
      });
    });
  }

  // --- Chat Events ---
  sendMessage(roomCode: string, messageData: any) {
    this.connect();
    this.socket.emit('send-message', roomCode, messageData);
  }

  onChatMessage(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('chat-message', (messageData: any) => {
        observer.next(messageData);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
