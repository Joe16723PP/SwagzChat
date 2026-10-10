import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { guestGuard } from './guest.guard';
import { GuestService } from './guest.service';

describe('guestGuard', () => {
  function setup(guest: { id: string; name: string } | null) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: GuestService,
          useValue: { guest: signal(guest) },
        },
      ],
    });
  }

  it('sends a visitor with no name to the landing page', () => {
    setup(null);
    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('allows a guest through', () => {
    setup({ id: 'guest_1', name: 'Ann' });
    expect(TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never))).toBe(true);
  });
});
