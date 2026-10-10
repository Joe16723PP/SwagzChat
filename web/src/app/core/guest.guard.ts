import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GuestService } from './guest.service';

export const guestGuard: CanActivateFn = () => {
  const guests = inject(GuestService);
  const router = inject(Router);
  return guests.guest() ? true : router.createUrlTree(['/']);
};
