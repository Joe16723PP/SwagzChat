import { Component, effect, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { ChatDbService } from '../../core/chat-db.service';
import { Guest, GuestService } from '../../core/guest.service';
import {
  directoryWithoutFriends,
  formatMessageTime,
  inboxLabel,
  messageIsMine,
  sortInbox,
  type ChatMessage,
  type InboxItem,
  type Profile,
} from '../../core/chat-model';

@Component({
  selector: 'app-chat',
  imports: [MatButton, MatProgressSpinner],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnDestroy {
  protected readonly guests = inject(GuestService);
  private readonly db = inject(ChatDbService);
  private readonly router = inject(Router);
  private readonly log = viewChild<ElementRef<HTMLElement>>('log');

  protected readonly profiles = signal<Profile[] | null>(null);
  protected readonly friendUids = signal<string[] | null>(null);
  protected readonly inbox = signal<InboxItem[] | null>(null);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly messages = signal<ChatMessage[] | null>(null);
  protected readonly draft = signal('');
  protected readonly groupName = signal('');
  protected readonly groupMembers = signal<string[]>([]);
  protected readonly sending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly compact = signal(false);
  protected readonly showPeople = signal(false);

  private stopMessages: (() => void) | undefined;
  private stopPresence: (() => Promise<void>) | undefined;

  constructor() {
    if (typeof matchMedia === 'function') {
      const query = matchMedia('(max-width: 800px)');
      this.compact.set(query.matches);
      query.addEventListener('change', (event) => this.compact.set(event.matches));
    }

    effect((onCleanup) => {
      const guest = this.guests.guest();
      this.closeThread();
      this.inbox.set(null);
      this.profiles.set(null);
      this.friendUids.set(null);
      this.errorMessage.set(null);
      if (!guest) {
        return;
      }
      let cancelled = false;
      const stops: Array<() => void> = [];
      onCleanup(() => {
        cancelled = true;
        for (const stop of stops) {
          stop();
        }
        void this.stopPresence?.();
        this.stopPresence = undefined;
      });
      void this.openSession(guest, stops, () => cancelled);
    });

    effect(() => {
      this.messages();
      const element = this.log()?.nativeElement;
      if (!element) {
        return;
      }
      queueMicrotask(() => {
        element.scrollTop = element.scrollHeight;
      });
    });
  }

  ngOnDestroy(): void {
    this.closeThread();
  }

  protected conversations(): InboxItem[] {
    return sortInbox(this.inbox() ?? []);
  }

  protected directory(): Profile[] {
    const profiles = this.profiles();
    const friends = this.friendUids();
    const me = this.guests.guest();
    if (!profiles || !friends || !me) {
      return [];
    }
    return directoryWithoutFriends(profiles, friends, me.id);
  }

  protected friends(): Profile[] {
    const profiles = this.profiles() ?? [];
    return (this.friendUids() ?? [])
      .map((uid) => profiles.find((profile) => profile.uid === uid) ?? { uid, nickname: 'Friend', status: false });
  }

  protected label(item: InboxItem): string {
    return inboxLabel(item, this.profiles() ?? []);
  }

  protected selected(): InboxItem | null {
    return this.inbox()?.find((item) => item.id === this.selectedId()) ?? null;
  }

  protected mine(message: ChatMessage): boolean {
    return messageIsMine(message, this.guests.guest()?.id ?? '');
  }

  protected when(createdAt: number): string {
    return formatMessageTime(createdAt);
  }

  protected openConversation(id: string): void {
    const me = this.guests.guest();
    if (!me) {
      return;
    }
    this.closeThread();
    this.selectedId.set(id);
    this.messages.set(null);
    this.showPeople.set(false);
    this.errorMessage.set(null);
    this.stopMessages = this.db.watchMessages(id, (rows) => this.messages.set(rows));
    void this.db.markRead(me.id, id).catch(() => undefined);
  }

  protected backToList(): void {
    this.closeThread();
  }

  protected onDraft(event: Event): void {
    this.draft.set(this.inputValue(event));
  }

  protected onGroupName(event: Event): void {
    this.groupName.set(this.inputValue(event));
  }

  protected toggleGroupMember(uid: string): void {
    const current = this.groupMembers();
    this.groupMembers.set(current.includes(uid) ? current.filter((id) => id !== uid) : [...current, uid]);
  }

  protected async send(event: Event): Promise<void> {
    event.preventDefault();
    const text = this.draft().trim();
    const conversationId = this.selectedId();
    const me = this.guests.guest();
    if (!text || !conversationId || !me || this.sending()) {
      return;
    }
    this.sending.set(true);
    try {
      await this.db.sendMessage(conversationId, me.id, text);
      this.draft.set('');
      this.errorMessage.set(null);
    } catch {
      this.errorMessage.set('The message was not sent. Try again.');
    } finally {
      this.sending.set(false);
    }
  }

  protected async add(person: Profile): Promise<void> {
    const me = this.guests.guest();
    if (!me) {
      return;
    }
    this.errorMessage.set(null);
    try {
      await this.db.addFriend(me.id, person.uid);
    } catch {
      this.errorMessage.set('That person could not be added. Try again.');
    }
  }

  protected async removeFriend(uid: string): Promise<void> {
    const me = this.guests.guest();
    if (!me) {
      return;
    }
    this.errorMessage.set(null);
    try {
      await this.db.removeFriend(me.id, uid);
      this.groupMembers.set(this.groupMembers().filter((id) => id !== uid));
    } catch {
      this.errorMessage.set('That friend could not be removed. Try again.');
    }
  }

  protected async chatWith(friendUid: string): Promise<void> {
    const me = this.guests.guest();
    if (!me) {
      return;
    }
    this.errorMessage.set(null);
    const existing = this.inbox()?.find((item) => item.kind === 'friend' && item.peerUid === friendUid);
    try {
      const id = existing?.id ?? (await this.db.createFriendConversation(me.id, friendUid));
      this.openConversation(id);
    } catch {
      this.errorMessage.set('The friend chat could not be opened. Try again.');
    }
  }

  protected async createGroup(): Promise<void> {
    const me = this.guests.guest();
    const name = this.groupName().trim();
    if (!me || !name || this.groupMembers().length < 2) {
      this.errorMessage.set('A group needs a name and two other people.');
      return;
    }
    this.errorMessage.set(null);
    try {
      const id = await this.db.createGroup(me.id, name, this.groupMembers());
      this.groupName.set('');
      this.groupMembers.set([]);
      this.openConversation(id);
    } catch {
      this.errorMessage.set('The group could not be created. Try again.');
    }
  }

  protected async leave(): Promise<void> {
    await this.stopPresence?.();
    this.stopPresence = undefined;
    this.guests.leave();
    await this.router.navigateByUrl('/');
  }

  private closeThread(): void {
    this.stopMessages?.();
    this.stopMessages = undefined;
    this.selectedId.set(null);
    this.messages.set(null);
    this.draft.set('');
  }

  private inputValue(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement ? target.value : '';
  }

  private async openSession(guest: Guest, stops: Array<() => void>, cancelled: () => boolean): Promise<void> {
    try {
      await this.db.waitUntilConnected();
    } catch {
      if (!cancelled()) {
        this.errorMessage.set('Chat cannot load because the chat server is not available.');
      }
      return;
    }
    try {
      await this.db.ensureAccount(guest);
    } catch {
      if (!cancelled()) {
        this.errorMessage.set('Your profile could not be saved.');
      }
      return;
    }
    try {
      this.stopPresence = await this.db.startPresence(guest.id);
    } catch {
      if (!cancelled()) {
        this.errorMessage.set('Presence could not be updated.');
      }
    }
    if (cancelled()) {
      await this.stopPresence?.();
      this.stopPresence = undefined;
      return;
    }
    stops.push(this.db.watchInbox(guest.id, (rows) => this.inbox.set(rows)));
    stops.push(this.db.watchProfiles((rows) => this.profiles.set(rows.filter((profile): profile is Profile => !!profile))));
    stops.push(this.db.watchFriends(guest.id, (rows) => this.friendUids.set(rows)));
  }
}
