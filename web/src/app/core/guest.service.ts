import { Injectable, signal } from '@angular/core';

const storageKey = 'swagzchat.guest';

export interface Guest {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class GuestService {
  readonly guest = signal<Guest | null>(readGuest());

  enter(name: string): Guest {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 32) {
      throw new Error('Enter a name.');
    }
    const current = this.guest();
    const guest: Guest = { id: current?.id ?? createGuestId(), name: trimmed };
    localStorage.setItem(storageKey, JSON.stringify(guest));
    this.guest.set(guest);
    return guest;
  }

  leave(): void {
    localStorage.removeItem(storageKey);
    this.guest.set(null);
  }
}

function readGuest(): Guest | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }
  try {
    const value = JSON.parse(raw) as Partial<Guest>;
    if (typeof value.id === 'string' && value.id && typeof value.name === 'string' && value.name.trim()) {
      return { id: value.id, name: value.name.trim() };
    }
  } catch {
    return null;
  }
  return null;
}

function createGuestId(): string {
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
  return `guest_${uuid}`;
}
