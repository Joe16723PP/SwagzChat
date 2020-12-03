import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {HomeComponent} from './pages/home/home.component';
import {ProfileComponent} from './components/profile/profile.component';
import {AuthGuard} from './guard/auth.guard';
import {ChatComponent} from './pages/chat/chat.component';
import {AnswerCallComponent} from './pages/answer-call/answer-call.component';
import {CallingComponent} from './pages/calling/calling.component';
import {TestTokboxComponent} from './pages/test-tokbox/test-tokbox.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'video_call/answer',
    component: AnswerCallComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'chat/video_call/answer/:id',
    component: AnswerCallComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'video_call/calling/:id',
    component: CallingComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'chat/video_call/calling/:id',
    component: CallingComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'tokbox',
    component: TestTokboxComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
