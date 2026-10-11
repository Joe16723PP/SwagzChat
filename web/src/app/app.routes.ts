import { Routes } from '@angular/router';
import { guestGuard } from './core/guest.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.Landing),
  },
  {
    path: 'chat',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/chat/chat').then((m) => m.Chat),
  },
  { path: '**', redirectTo: '' },
];
