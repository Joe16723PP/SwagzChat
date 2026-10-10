import { Injectable, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { firebaseAuth } from './firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Null until the first auth state event, then the Firebase user or null. */
  readonly user = signal<User | null>(null);
  readonly ready = signal(false);

  private readonly readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = new Promise((resolve) => {
      onAuthStateChanged(firebaseAuth, (user) => {
        this.user.set(user);
        if (!this.ready()) {
          this.ready.set(true);
          resolve();
        }
      });
    });
  }

  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  signInWithEmail(email: string, password: string): Promise<unknown> {
    return signInWithEmailAndPassword(firebaseAuth, email, password);
  }

  signInWithGoogle(): Promise<unknown> {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    return signInWithPopup(firebaseAuth, provider);
  }

  signOut(): Promise<void> {
    return signOut(firebaseAuth);
  }
}
