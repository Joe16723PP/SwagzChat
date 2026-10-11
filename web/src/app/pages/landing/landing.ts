import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GuestService } from '../../core/guest.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  private readonly guests = inject(GuestService);
  private readonly router = inject(Router);

  protected readonly name = signal(this.guests.guest()?.name ?? '');
  protected readonly errorMessage = signal<string | null>(null);

  protected onName(event: Event): void {
    const target = event.target;
    this.name.set(target instanceof HTMLInputElement ? target.value : '');
    this.errorMessage.set(null);
  }

  protected enter(event: Event): void {
    event.preventDefault();
    const name = this.name().trim();
    if (!name || name.length > 32) {
      this.errorMessage.set('Enter a name.');
      return;
    }
    this.guests.enter(name);
    void this.router.navigateByUrl('/chat');
  }
}
