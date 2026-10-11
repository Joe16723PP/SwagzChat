import { isDevMode } from '@angular/core';
import { CanMatchFn, Routes } from '@angular/router';
import { guestGuard } from './core/guest.guard';

const previewAvailable: CanMatchFn = () => isDevMode();

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
  {
    path: 'preview',
    canMatch: [previewAvailable],
    data: { preview: true },
    loadComponent: () => import('./pages/chat/chat').then((m) => m.Chat),
  },
  { path: '**', redirectTo: '' },
];
