export type ConversationKind = 'own' | 'friend' | 'group';

export interface Profile {
  uid: string;
  nickname: string;
  handle?: string;
  status: boolean;
}

export interface InboxItem {
  id: string;
  kind: ConversationKind;
  title?: string;
  peerUid?: string;
  lastText: string;
  updatedAt: number;
  unread: number;
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  text: string;
  createdAt: number;
}

export const MESSAGE_PAGE = 50;

export function sortInbox(items: readonly InboxItem[]): InboxItem[] {
  return [...items].sort((a, b) => {
    if (a.kind === 'own' && b.kind !== 'own') {
      return -1;
    }
    if (b.kind === 'own' && a.kind !== 'own') {
      return 1;
    }
    return b.updatedAt - a.updatedAt;
  });
}

export function inboxLabel(item: InboxItem, profiles: readonly Profile[]): string {
  if (item.kind === 'own') {
    return 'Notes';
  }
  if (item.kind === 'group') {
    return item.title?.trim() || 'Group';
  }
  return profiles.find((profile) => profile.uid === item.peerUid)?.nickname ?? 'Friend';
}

export function directoryWithoutFriends(
  profiles: readonly Profile[],
  friendUids: readonly string[],
  myUid: string,
): Profile[] {
  const friends = new Set(friendUids);
  return profiles.filter((profile) => profile.uid !== myUid && !friends.has(profile.uid));
}

export function messageIsMine(message: ChatMessage, myUid: string): boolean {
  return message.senderUid === myUid;
}

export function formatMessageTime(createdAt: number): string {
  if (!createdAt) {
    return '';
  }
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(createdAt);
}

export function formatActivityTime(createdAt: number, now = Date.now()): string {
  if (!createdAt) {
    return '';
  }
  const when = new Date(createdAt);
  const current = new Date(now);
  const start = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round((start(current) - start(when)) / 86_400_000);
  if (days <= 0) {
    return formatMessageTime(createdAt);
  }
  if (days === 1) {
    return 'Yesterday';
  }
  if (days <= 6) {
    return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(when);
  }
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(when);
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return '?';
  }
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export function avatarSlot(key: string): number {
  const sum = [...key].reduce((total, char) => total + char.charCodeAt(0), 0);
  return (sum % 8) + 1;
}
