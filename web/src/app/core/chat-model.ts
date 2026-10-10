export type ConversationKind = 'own' | 'friend' | 'group';

export interface Profile {
  uid: string;
  nickname: string;
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

export function nicknameFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim();
  return local || email;
}

export function ownConversationId(uid: string): string {
  return `own_${uid}`;
}

export function asProfile(key: string, value: unknown): Profile | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const row = value as Record<string, unknown>;
  const nickname = typeof row['nickname'] === 'string' ? row['nickname'].trim() : '';
  if (!nickname) {
    return null;
  }
  return {
    uid: key,
    nickname,
    status: row['status'] === true,
  };
}

export function friendUidFromEdge(key: string, value: unknown): string | null {
  if (value === true) {
    return key;
  }
  if (value && typeof value === 'object' && typeof (value as { uid?: unknown }).uid === 'string') {
    return (value as { uid: string }).uid;
  }
  return null;
}

export function asInboxItem(id: string, value: unknown): InboxItem | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const row = value as Record<string, unknown>;
  const kind = row['kind'];
  if (kind !== 'own' && kind !== 'friend' && kind !== 'group') {
    return null;
  }
  return {
    id,
    kind,
    title: typeof row['title'] === 'string' ? row['title'] : undefined,
    peerUid: typeof row['peerUid'] === 'string' ? row['peerUid'] : undefined,
    lastText: typeof row['lastText'] === 'string' ? row['lastText'] : '',
    updatedAt: typeof row['updatedAt'] === 'number' ? row['updatedAt'] : 0,
    unread: typeof row['unread'] === 'number' ? row['unread'] : 0,
  };
}

export function asMessage(id: string, value: unknown): ChatMessage | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const row = value as Record<string, unknown>;
  const text = typeof row['text'] === 'string' ? row['text'] : '';
  const senderUid = typeof row['senderUid'] === 'string' ? row['senderUid'] : '';
  if (!text || !senderUid) {
    return null;
  }
  return {
    id,
    senderUid,
    text,
    createdAt: typeof row['createdAt'] === 'number' ? row['createdAt'] : 0,
  };
}

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
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(createdAt);
}
