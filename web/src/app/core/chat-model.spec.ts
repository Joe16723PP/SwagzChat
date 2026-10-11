import { directoryWithoutFriends, formatActivityTime, inboxLabel, initials, messageIsMine, sortInbox, type InboxItem, type Profile } from './chat-model';

const ann: Profile = { uid: 'ann', nickname: 'Ann', status: true };
const bob: Profile = { uid: 'bob', nickname: 'Bob', status: false };
const cy: Profile = { uid: 'cy', nickname: 'Cy', status: true };

describe('conversation model', () => {
  it('keeps Notes first and then the newest conversation', () => {
    const items: InboxItem[] = [
      { id: 'g', kind: 'group', title: 'Trip', lastText: 'later', updatedAt: 30, unread: 0 },
      { id: 'o', kind: 'own', title: 'Notes', lastText: '', updatedAt: 1, unread: 0 },
      { id: 'f', kind: 'friend', peerUid: 'bob', lastText: 'hi', updatedAt: 20, unread: 1 },
    ];
    expect(sortInbox(items).map((item) => item.id)).toEqual(['o', 'g', 'f']);
  });

  it('labels an own chat, a friend chat, and a group chat', () => {
    expect(inboxLabel({ id: 'o', kind: 'own', lastText: '', updatedAt: 0, unread: 0 }, [bob])).toBe('Notes');
    expect(inboxLabel({ id: 'f', kind: 'friend', peerUid: 'bob', lastText: '', updatedAt: 0, unread: 0 }, [bob])).toBe('Bob');
    expect(inboxLabel({ id: 'g', kind: 'group', title: 'Trip', lastText: '', updatedAt: 0, unread: 0 }, [])).toBe('Trip');
  });

  it('hides the signed-in user and current friends from the directory', () => {
    expect(directoryWithoutFriends([ann, bob, cy], ['bob'], 'ann').map((profile) => profile.uid)).toEqual(['cy']);
  });

  it('formats recent activity and initials', () => {
    const now = new Date(2026, 5, 11, 10, 30).getTime();
    const yesterday = new Date(2026, 5, 10, 9, 0).getTime();
    expect(formatActivityTime(yesterday, now)).toBe('Yesterday');
    expect(initials('Mina Chen')).toBe('MC');
  });

  it('knows when a message belongs to the current guest', () => {
    expect(messageIsMine({ id: '1', senderUid: 'ann', text: 'hi', createdAt: 1 }, 'ann')).toBe(true);
  });
});
