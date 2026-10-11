import { type ChatMessage, type InboxItem, type Profile } from './chat-model';

/** Thursday 11 June 2026, 10:30 in the browser's local zone. */
export const PREVIEW_NOW = new Date(2026, 5, 11, 10, 30).getTime();
export const PREVIEW_SELF_ID = 'preview_riley';
export const PREVIEW_MINA_ID = 'preview_mina';

const minaId = 'preview_mina';
const jordanId = 'preview_jordan';
const taylorId = 'preview_taylor';
const caseyId = 'preview_casey';
const averyId = 'preview_avery';

function at(day: number, hour: number, minute: number): number {
  return new Date(2026, 5, day, hour, minute).getTime();
}

export const previewProfiles: Profile[] = [
  { uid: PREVIEW_SELF_ID, nickname: 'Riley Park', handle: 'riley', status: true },
  { uid: minaId, nickname: 'Mina Chen', handle: 'mina', status: true },
  { uid: jordanId, nickname: 'Jordan Kim', handle: 'jordan', status: true },
  { uid: taylorId, nickname: 'Taylor Brooks', handle: 'taylor', status: true },
  { uid: caseyId, nickname: 'Casey Morgan', handle: 'casey', status: false },
  { uid: averyId, nickname: 'Avery Patel', handle: 'avery', status: true },
];

export const previewFriendUids = [minaId, jordanId, taylorId, caseyId, averyId];

export const previewGroupMembers = [minaId, jordanId];

export const previewInbox: InboxItem[] = [
  { id: 'preview_notes', kind: 'own', title: 'Notes', lastText: 'No messages yet.', updatedAt: 0, unread: 0 },
  {
    id: minaId,
    kind: 'friend',
    peerUid: minaId,
    lastText: 'That sounds great! See you there.',
    updatedAt: at(11, 10, 24),
    unread: 2,
  },
  {
    id: 'preview_dev',
    kind: 'group',
    title: 'Dev Squad',
    lastText: 'Alex: Pushed the latest build 🚀',
    updatedAt: at(11, 9, 18),
    unread: 0,
  },
  {
    id: 'preview_jordan',
    kind: 'friend',
    peerUid: jordanId,
    lastText: 'Cool, let me know!',
    updatedAt: at(10, 18, 0),
    unread: 0,
  },
  {
    id: 'preview_taylor',
    kind: 'friend',
    peerUid: taylorId,
    lastText: 'Are we still on for tomorrow?',
    updatedAt: at(10, 11, 0),
    unread: 0,
  },
  {
    id: 'preview_nimbus',
    kind: 'group',
    title: 'Project Nimbus',
    lastText: 'Riley: Shared a file',
    updatedAt: at(9, 15, 0),
    unread: 0,
  },
  {
    id: 'preview_casey',
    kind: 'friend',
    peerUid: caseyId,
    lastText: 'Thanks! 🙏',
    updatedAt: at(8, 16, 0),
    unread: 0,
  },
  {
    id: 'preview_avery',
    kind: 'friend',
    peerUid: averyId,
    lastText: 'No problem!',
    updatedAt: at(8, 11, 0),
    unread: 0,
  },
];

const minaThread: ChatMessage[] = [
  { id: 'preview_m1', senderUid: minaId, text: 'Hey Riley! 👋', createdAt: at(11, 10, 17) },
  { id: 'preview_m2', senderUid: minaId, text: 'Are you joining the team sync later today?', createdAt: at(11, 10, 18) },
  { id: 'preview_m3', senderUid: PREVIEW_SELF_ID, text: 'Hey Mina! Yes, I’m planning to be there.', createdAt: at(11, 10, 20) },
  {
    id: 'preview_m4',
    senderUid: minaId,
    text: 'Great! We’ll be going over the new design updates and next steps.',
    createdAt: at(11, 10, 21),
  },
  { id: 'preview_m5', senderUid: PREVIEW_SELF_ID, text: 'Sounds good. Anything I should prepare?', createdAt: at(11, 10, 22) },
  { id: 'preview_m6', senderUid: minaId, text: 'Just a quick look at the latest mocks if you have time.', createdAt: at(11, 10, 23) },
  { id: 'preview_m7', senderUid: PREVIEW_SELF_ID, text: 'That sounds great. See you there.', createdAt: at(11, 10, 24) },
];

const threads: Record<string, ChatMessage[]> = {
  [minaId]: minaThread,
  ['preview_notes']: [],
};

export function previewMessages(conversationId: string): ChatMessage[] {
  return threads[conversationId] ?? [];
}
