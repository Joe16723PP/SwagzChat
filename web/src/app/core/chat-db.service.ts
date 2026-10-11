import { Injectable } from '@angular/core';
import { apiOrigin } from './api';
import { MESSAGE_PAGE, type ChatMessage, type InboxItem, type Profile } from './chat-model';
import { type Guest } from './guest.service';

interface LiveMessage {
  type: string;
  profiles?: Profile[];
  friendUids?: string[];
  items?: InboxItem[];
  conversationId?: string;
  messages?: ChatMessage[];
}

@Injectable({ providedIn: 'root' })
export class ChatDbService {
  private socket: WebSocket | null = null;
  private uid = '';
  private conversationId = '';
  private profiles: Profile[] | null = null;
  private friendUids: string[] | null = null;
  private inbox: InboxItem[] | null = null;
  private messages: ChatMessage[] | null = null;
  private readonly profileListeners = new Set<(rows: Profile[]) => void>();
  private readonly friendListeners = new Set<(rows: string[]) => void>();
  private readonly inboxListeners = new Set<(rows: InboxItem[]) => void>();
  private messageListener: ((rows: ChatMessage[]) => void) | null = null;

  async waitUntilConnected(timeoutMs = 8000): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${apiOrigin}/health`, { signal: controller.signal });
      if (!response.ok) {
        throw new Error('The chat server is not available.');
      }
    } finally {
      clearTimeout(timer);
    }
  }

  async ensureAccount(guest: Guest): Promise<void> {
    const name = guest.name.trim();
    if (!name) {
      throw new Error('Enter a name.');
    }
    await request('/account', 'PUT', { id: guest.id, name });
  }

  startPresence(uid: string): Promise<() => Promise<void>> {
    return this.connect(uid).then(() => async () => {
      this.closeSocket();
      await request('/presence', 'PUT', { uid, status: false }).catch(() => undefined);
    });
  }

  watchProfiles(onData: (profiles: Profile[]) => void): () => void {
    this.profileListeners.add(onData);
    if (this.profiles) {
      onData(this.profiles);
    }
    return () => this.profileListeners.delete(onData);
  }

  watchFriends(uid: string, onData: (friendUids: string[]) => void): () => void {
    this.friendListeners.add(onData);
    if (this.friendUids && this.uid === uid) {
      onData(this.friendUids);
    }
    return () => this.friendListeners.delete(onData);
  }

  watchInbox(uid: string, onData: (items: InboxItem[]) => void): () => void {
    this.inboxListeners.add(onData);
    if (this.inbox && this.uid === uid) {
      onData(this.inbox);
    }
    return () => this.inboxListeners.delete(onData);
  }

  watchMessages(conversationId: string, onData: (messages: ChatMessage[]) => void): () => void {
    this.conversationId = conversationId;
    this.messageListener = onData;
    this.messages = null;
    this.send({ type: 'watch', conversationId });
    return () => {
      if (this.conversationId === conversationId) {
        this.conversationId = '';
        this.messageListener = null;
        this.messages = null;
        this.send({ type: 'unwatch' });
      }
    };
  }

  async addFriend(myUid: string, friendUid: string): Promise<void> {
    await request('/friends', 'POST', { myUid, friendUid });
  }

  async removeFriend(myUid: string, friendUid: string): Promise<void> {
    await request('/friends', 'DELETE', { myUid, friendUid });
  }

  async createFriendConversation(myUid: string, friendUid: string): Promise<string> {
    const body = await request<{ id: string }>('/conversations/friend', 'POST', { myUid, friendUid });
    return body.id;
  }

  async createGroup(ownerUid: string, name: string, memberUids: string[]): Promise<string> {
    const body = await request<{ id: string }>('/conversations/group', 'POST', { ownerUid, name, memberUids });
    return body.id;
  }

  async sendMessage(conversationId: string, senderUid: string, text: string): Promise<void> {
    await request(`/conversations/${conversationId}/messages`, 'POST', { senderUid, text });
  }

  async markRead(uid: string, conversationId: string): Promise<void> {
    await request(`/conversations/${conversationId}/read`, 'POST', { uid });
  }

  async loadEarlier(conversationId: string, uid: string, before: number): Promise<ChatMessage[]> {
    const params = new URLSearchParams({
      uid,
      before: String(before),
      limit: String(MESSAGE_PAGE),
    });
    const response = await fetch(`${apiOrigin}/conversations/${conversationId}/messages?${params}`);
    if (!response.ok) {
      throw new Error('Earlier messages could not be loaded.');
    }
    const body = (await response.json()) as { messages?: ChatMessage[] };
    return body.messages ?? [];
  }

  private connect(uid: string): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN && this.uid === uid) {
      return Promise.resolve();
    }
    this.closeSocket();
    this.uid = uid;
    const socket = new WebSocket(apiOrigin.replace(/^http/, 'ws') + '/live');
    this.socket = socket;
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        socket.close();
        reject(new Error('The chat server is not available.'));
      }, 8000);
      socket.onopen = () => this.send({ type: 'hello', uid });
      socket.onerror = () => {
        if (settled || this.socket !== socket) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        reject(new Error('The chat server is not available.'));
      };
      socket.onmessage = (event) => {
        if (this.socket !== socket) {
          return;
        }
        const message = JSON.parse(String(event.data)) as LiveMessage;
        this.apply(message);
        if (message.type === 'ready' && !settled) {
          settled = true;
          clearTimeout(timer);
          resolve();
        }
      };
    });
  }

  private closeSocket(): void {
    this.socket?.close();
    this.socket = null;
    this.profiles = null;
    this.friendUids = null;
    this.inbox = null;
    this.messages = null;
  }

  private apply(message: LiveMessage): void {
    if (message.type === 'profiles' && message.profiles) {
      this.profiles = message.profiles;
      for (const listener of this.profileListeners) {
        listener(message.profiles);
      }
    }
    if (message.type === 'friends' && message.friendUids) {
      this.friendUids = message.friendUids;
      for (const listener of this.friendListeners) {
        listener(message.friendUids);
      }
    }
    if (message.type === 'inbox' && message.items) {
      this.inbox = message.items;
      for (const listener of this.inboxListeners) {
        listener(message.items);
      }
    }
    if (message.type === 'messages' && message.conversationId === this.conversationId && message.messages) {
      this.messages = message.messages.slice(-MESSAGE_PAGE);
      this.messageListener?.(this.messages);
    }
  }

  private send(payload: object): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }
}

async function request<T>(path: string, method: string, body: object): Promise<T> {
  const response = await fetch(`${apiOrigin}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}
