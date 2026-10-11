import { Component, effect, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatDbService } from '../../core/chat-db.service';
import { Guest, GuestService } from '../../core/guest.service';
import {
  PREVIEW_MINA_ID,
  PREVIEW_NOW,
  PREVIEW_SELF_ID,
  previewFriendUids,
  previewGroupMembers,
  previewInbox,
  previewMessages,
  previewProfiles,
} from '../../core/preview-fixture';
import {
  avatarSlot,
  directoryWithoutFriends,
  formatActivityTime,
  formatMessageTime,
  inboxLabel,
  initials,
  messageIsMine,
  MESSAGE_PAGE,
  sortInbox,
  type ChatMessage,
  type InboxItem,
  type Profile,
} from '../../core/chat-model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnDestroy {
  protected readonly guests = inject(GuestService);
  private readonly db = inject(ChatDbService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly previewing = this.route?.snapshot?.data?.['preview'] === true;
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
  protected readonly railCollapsed = signal(false);
  protected readonly showPeople = signal(false);
  protected readonly section = signal<'chats' | 'people'>('chats');
  protected readonly chatQuery = signal('');
  protected readonly friendQuery = signal('');
  protected readonly groupQuery = signal('');
  protected readonly membersOpen = signal(false);
  protected readonly emojiOpen = signal(false);
  protected readonly pendingUnfriend = signal<string | null>(null);
  protected readonly profileOpen = signal(false);
  protected readonly historyDone = signal(false);
  protected readonly loadingEarlier = signal(false);
  protected readonly showJump = signal(false);
  protected readonly retryTick = signal(0);
  protected readonly emoji = ['😀', '😂', '😊', '😍', '👍', '🙏', '👋', '🎉', '🔥', '🚀', '👏', '❤️'];
  private stickToEnd = true;

  private stopMessages: (() => void) | undefined;
  private stopPresence: (() => Promise<void>) | undefined;

  constructor() {
    if (typeof matchMedia === 'function') {
      const phone = matchMedia('(max-width: 800px)');
      const tablet = matchMedia('(max-width: 1199px)');
      const apply = () => {
        this.compact.set(phone.matches);
        this.railCollapsed.set(tablet.matches);
      };
      apply();
      phone.addEventListener('change', apply);
      tablet.addEventListener('change', apply);
    }

    if (this.previewing) {
      this.applyPreview();
    }

    effect((onCleanup) => {
      if (this.previewing) {
        return;
      }
      this.retryTick();
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
      if (!this.stickToEnd) {
        this.showJump.set(true);
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
    const query = this.chatQuery().trim().toLowerCase();
    return sortInbox(this.inbox() ?? []).filter((item) => {
      if (!query) {
        return true;
      }
      const profile = this.peer(item);
      return [this.label(item), profile?.handle ?? '', item.lastText].join(' ').toLowerCase().includes(query);
    });
  }

  protected directory(): Profile[] {
    const profiles = this.profiles();
    const friends = this.friendUids();
    const meId = this.previewing ? PREVIEW_SELF_ID : this.guests.guest()?.id;
    if (!profiles || !friends || !meId) {
      return [];
    }
    return directoryWithoutFriends(profiles, friends, meId);
  }

  protected friends(): Profile[] {
    const profiles = this.profiles() ?? [];
    return (this.friendUids() ?? [])
      .map((uid) => profiles.find((profile) => profile.uid === uid) ?? { uid, nickname: 'Friend', status: false });
  }

  protected label(item: InboxItem): string {
    return inboxLabel(item, this.profiles() ?? []);
  }

  protected visibleFriends(): Profile[] {
    return this.matching(this.friends(), this.friendQuery());
  }

  protected groupChoices(): Profile[] {
    return this.matching(this.friends(), this.groupQuery());
  }

  protected showMemberChoices(): boolean {
    return this.membersOpen() || this.groupQuery().trim().length > 0;
  }

  protected toggleMembers(): void {
    this.membersOpen.update((open) => !open);
  }

  protected visibleDirectory(): Profile[] {
    return this.matching(this.directory(), this.chatQuery());
  }

  protected me(): Profile | undefined {
    if (this.previewing) {
      return previewProfiles.find((profile) => profile.uid === PREVIEW_SELF_ID);
    }
    const id = this.guests.guest()?.id;
    return this.profiles()?.find((profile) => profile.uid === id);
  }

  protected peer(item: InboxItem | null): Profile | undefined {
    if (!item?.peerUid) {
      return undefined;
    }
    return this.profiles()?.find((profile) => profile.uid === item.peerUid);
  }

  protected letters(name: string): string {
    return initials(name);
  }

  protected slot(key: string): number {
    return avatarSlot(key);
  }

  protected colorKey(item: InboxItem): string {
    if (item.kind === 'friend') {
      return this.peer(item)?.handle ?? item.peerUid ?? item.id;
    }
    if (item.kind === 'own') {
      return this.me()?.handle ?? this.guests.guest()?.id ?? item.id;
    }
    return item.title ?? item.id;
  }

  protected presenceText(profile: Profile | undefined): string {
    if (!profile) {
      return 'Unavailable';
    }
    return profile.status ? 'Online' : 'Offline';
  }

  protected activity(createdAt: number): string {
    if (this.previewing) {
      return formatActivityTime(createdAt, PREVIEW_NOW, 'en-US');
    }
    return formatActivityTime(createdAt);
  }

  protected friendHandle(uid: string): string {
    return this.friends().find((friend) => friend.uid === uid)?.handle ?? uid;
  }

  protected friendName(uid: string): string {
    return this.friends().find((friend) => friend.uid === uid)?.nickname || 'Friend';
  }

  protected groupReady(): boolean {
    return this.groupName().trim().length > 0 && this.groupMembers().length >= 2;
  }

  protected groupHint(): string {
    if (!this.groupName().trim()) {
      return 'Enter a group name.';
    }
    if (this.groupMembers().length < 2) {
      return 'Choose at least two friends.';
    }
    return '';
  }

  protected showChats(): void {
    this.section.set('chats');
    this.chatQuery.set('');
  }

  protected showDirectory(): void {
    this.section.set('people');
    this.chatQuery.set('');
  }

  protected onQuery(event: Event, target: 'chat' | 'friend' | 'group'): void {
    const value = this.inputValue(event);
    if (target === 'chat') {
      this.chatQuery.set(value);
    } else if (target === 'friend') {
      this.friendQuery.set(value);
    } else {
      this.groupQuery.set(value);
    }
  }

  protected retry(): void {
    this.retryTick.update((value) => value + 1);
  }

  protected toggleEmoji(): void {
    this.emojiOpen.update((open) => !open);
  }

  protected insertEmoji(symbol: string): void {
    this.draft.update((value) => `${value}${symbol}`);
    this.emojiOpen.set(false);
  }

  protected onComposerKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.send(event);
    }
  }

  protected onLogScroll(): void {
    const element = this.log()?.nativeElement;
    if (!element) {
      return;
    }
    const nearEnd = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
    this.stickToEnd = nearEnd;
    if (nearEnd) {
      this.showJump.set(false);
    }
  }

  protected jumpToEnd(): void {
    this.stickToEnd = true;
    this.showJump.set(false);
    const element = this.log()?.nativeElement;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }

  protected async earlier(): Promise<void> {
    if (this.previewing) {
      return;
    }
    const rows = this.messages();
    const me = this.guests.guest();
    const conversationId = this.selectedId();
    const oldest = rows?.[0]?.createdAt;
    if (!rows || !me || !conversationId || !oldest || this.loadingEarlier() || this.historyDone()) {
      return;
    }
    this.loadingEarlier.set(true);
    try {
      const older = await this.db.loadEarlier(conversationId, me.id, oldest);
      if (older.length < MESSAGE_PAGE) {
        this.historyDone.set(true);
      }
      this.messages.set(mergeMessages(older, rows));
      this.errorMessage.set(null);
    } catch {
      this.errorMessage.set('Earlier messages could not be loaded.');
    } finally {
      this.loadingEarlier.set(false);
    }
  }

  protected askUnfriend(uid: string): void {
    this.pendingUnfriend.set(uid);
  }

  protected cancelUnfriend(): void {
    this.pendingUnfriend.set(null);
  }

  protected selected(): InboxItem | null {
    return this.inbox()?.find((item) => item.id === this.selectedId()) ?? null;
  }

  protected mine(message: ChatMessage): boolean {
    const id = this.previewing ? PREVIEW_SELF_ID : (this.guests.guest()?.id ?? '');
    return messageIsMine(message, id);
  }

  protected when(createdAt: number): string {
    if (this.previewing) {
      return formatMessageTime(createdAt, 'en-US');
    }
    return formatMessageTime(createdAt);
  }

  protected showTurnAvatar(index: number): boolean {
    const rows = this.messages();
    const message = rows?.[index];
    if (!rows || !message || this.mine(message)) {
      return false;
    }
    const previous = rows[index - 1];
    return !previous || previous.senderUid !== message.senderUid;
  }

  protected continuedTurn(index: number): boolean {
    const rows = this.messages();
    const message = rows?.[index];
    const previous = index > 0 ? rows?.[index - 1] : undefined;
    return !!message && !!previous && !this.mine(message) && previous.senderUid === message.senderUid;
  }

  protected senderLetters(message: ChatMessage): string {
    const profile = this.profiles()?.find((item) => item.uid === message.senderUid);
    return this.letters(profile?.nickname || 'Friend');
  }

  protected senderSlot(message: ChatMessage): number {
    const profile = this.profiles()?.find((item) => item.uid === message.senderUid);
    return this.slot(profile?.handle || message.senderUid);
  }

  protected openConversation(id: string): void {
    if (this.previewing) {
      this.selectedId.set(id);
      this.messages.set(previewMessages(id));
      this.draft.set('');
      this.historyDone.set(true);
      this.stickToEnd = true;
      this.showJump.set(false);
      this.emojiOpen.set(false);
      this.showPeople.set(false);
      this.section.set('chats');
      this.errorMessage.set(null);
      return;
    }
    const me = this.guests.guest();
    if (!me) {
      return;
    }
    this.closeThread();
    this.selectedId.set(id);
    this.messages.set(null);
    this.historyDone.set(false);
    this.stickToEnd = true;
    this.showJump.set(false);
    this.emojiOpen.set(false);
    this.showPeople.set(false);
    this.section.set('chats');
    this.errorMessage.set(null);
    let firstPage = true;
    this.stopMessages = this.db.watchMessages(id, (rows) => {
      this.messages.update((current) => {
        const older = (current ?? []).filter((message) => message.createdAt < (rows[0]?.createdAt ?? Number.POSITIVE_INFINITY));
        return mergeMessages(older, rows);
      });
      if (firstPage) {
        firstPage = false;
        this.historyDone.set(rows.length < MESSAGE_PAGE);
      }
    });
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
    if (this.previewing) {
      return;
    }
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
    if (this.previewing) {
      return;
    }
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
    if (this.previewing) {
      this.pendingUnfriend.set(null);
      return;
    }
    const me = this.guests.guest();
    if (!me) {
      return;
    }
    this.errorMessage.set(null);
    try {
      await this.db.removeFriend(me.id, uid);
      this.groupMembers.set(this.groupMembers().filter((id) => id !== uid));
      this.pendingUnfriend.set(null);
    } catch {
      this.errorMessage.set('That friend could not be removed. Try again.');
    }
  }

  protected async chatWith(friendUid: string): Promise<void> {
    if (this.previewing) {
      const existing = this.inbox()?.find((item) => item.kind === 'friend' && item.peerUid === friendUid);
      if (existing) {
        this.openConversation(existing.id);
      }
      return;
    }
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
    if (this.previewing) {
      return;
    }
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

  // Preview Leave still calls GuestService.leave(). Clear that stored guest in a later pass.
  protected async leave(): Promise<void> {
    await this.stopPresence?.();
    this.stopPresence = undefined;
    this.guests.leave();
    await this.router.navigateByUrl('/');
  }

  private matching(people: Profile[], query: string): Profile[] {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return people;
    }
    return people.filter((person) =>
      [person.nickname, person.handle ?? ''].join(' ').toLowerCase().includes(needle),
    );
  }

  private closeThread(): void {
    this.stopMessages?.();
    this.stopMessages = undefined;
    this.selectedId.set(null);
    this.messages.set(null);
    this.draft.set('');
    this.emojiOpen.set(false);
    this.historyDone.set(false);
  }

  private inputValue(event: Event): string {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return '';
  }

  private applyPreview(): void {
    this.inbox.set(previewInbox);
    this.profiles.set(previewProfiles);
    this.friendUids.set(previewFriendUids);
    this.selectedId.set(PREVIEW_MINA_ID);
    this.messages.set(previewMessages(PREVIEW_MINA_ID));
    this.groupName.set('');
    this.groupMembers.set([...previewGroupMembers]);
    this.historyDone.set(true);
    this.errorMessage.set(null);
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

function mergeMessages(older: readonly ChatMessage[], newer: readonly ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const message of [...older, ...newer]) {
    byId.set(message.id, message);
  }
  return [...byId.values()].sort((left, right) => left.createdAt - right.createdAt);
}
