import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CreateQuizComponent } from './pages/create-quiz/create-quiz.component';
import { EditQuizComponent } from './pages/edit-quiz/edit-quiz.component';
import { HostRoomComponent } from './pages/host-room/host-room.component';
import { JoinRoomComponent } from './pages/join-room/join-room.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'create-quiz', component: CreateQuizComponent, canActivate: [authGuard] },
  { path: 'edit-quiz/:id', component: EditQuizComponent, canActivate: [authGuard] },
  { path: 'host/:id', component: HostRoomComponent, canActivate: [authGuard] },
  { path: 'join', component: JoinRoomComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
