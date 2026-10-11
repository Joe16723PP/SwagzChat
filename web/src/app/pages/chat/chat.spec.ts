import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChatDbService } from '../../core/chat-db.service';
import { GuestService } from '../../core/guest.service';
import { Chat } from './chat';

describe('Chat', () => {
  const watched: string[] = [];
  const unsubscribed: string[] = [];
  const sent: string[] = [];
  const createdFriends: string[] = [];
  let connect: () => Promise<void> = async () => undefined;

  beforeEach(async () => {
    watched.length = 0;
    unsubscribed.length = 0;
    sent.length = 0;
    createdFriends.length = 0;
    connect = async () => undefined;
    await TestBed.configureTestingModule({
      imports: [Chat],
      providers: [
        provideRouter([]),
        {
          provide: GuestService,
          useValue: {
            guest: signal({ id: 'me', name: 'Me' }),
            leave: () => undefined,
          },
        },
        {
          provide: ChatDbService,
          useValue: {
            waitUntilConnected: () => connect(),
            ensureAccount: async () => undefined,
            startPresence: async () => async () => undefined,
            watchInbox: (_uid: string, onData: (rows: unknown[]) => void) => {
              onData([
                { id: 'own_me', kind: 'own', title: 'Notes', lastText: '', updatedAt: 1, unread: 0 },
                { id: 'c_bob', kind: 'friend', peerUid: 'bob', lastText: 'from bob', updatedAt: 20, unread: 0 },
                { id: 'c_ann', kind: 'friend', peerUid: 'ann', lastText: 'from ann', updatedAt: 10, unread: 0 },
              ]);
              return () => undefined;
            },
            watchProfiles: (onData: (rows: unknown[]) => void) => {
              onData([
                { uid: 'ann', nickname: 'Ann', status: true },
                { uid: 'bob', nickname: 'Bob', status: false },
                { uid: 'cy', nickname: 'Cy', status: true },
              ]);
              return () => undefined;
            },
            watchFriends: (_uid: string, onData: (rows: string[]) => void) => {
              onData(['ann', 'bob']);
              return () => undefined;
            },
            watchMessages: (conversationId: string, onData: (rows: unknown[]) => void) => {
              watched.push(conversationId);
              onData([{ id: conversationId, senderUid: 'bob', text: `text ${conversationId}`, createdAt: 20 }]);
              return () => unsubscribed.push(conversationId);
            },
            sendMessage: async (_id: string, _uid: string, text: string) => {
              sent.push(text);
            },
            markRead: async () => undefined,
            addFriend: async () => undefined,
            removeFriend: async () => undefined,
            createFriendConversation: async (_me: string, friendUid: string) => {
              createdFriends.push(friendUid);
              return `c_${friendUid}`;
            },
            createGroup: async () => 'c_group',
          },
        },
      ],
    }).compileComponents();
  });

  async function setup(): Promise<ComponentFixture<Chat>> {
    const fixture = TestBed.createComponent(Chat);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('opens a conversation and drops the previous listener', async () => {
    const fixture = await setup();
    const buttons = () => [...fixture.nativeElement.querySelectorAll('.person')] as HTMLButtonElement[];
    expect(buttons()[0].textContent).toContain('Notes');
    buttons()[1].click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons()[2].click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(unsubscribed).toEqual(['c_bob']);
    expect(fixture.nativeElement.textContent).toContain('text c_ann');
  });

  it('sends the trimmed draft and lists people who are not friends', async () => {
    const fixture = await setup();
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('nav button:last-child') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.textContent).toContain('Cy');
    expect([...root.querySelectorAll('button')].filter((button) => button.textContent?.trim() === 'Add')).toHaveLength(1);

    (root.querySelector('nav button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    (root.querySelectorAll('.person')[1] as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    const input = root.querySelector('#draft') as HTMLInputElement;
    input.value = '  hello  ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (root.querySelector('.composer') as HTMLFormElement).requestSubmit();
    await fixture.whenStable();
    expect(sent).toEqual(['hello']);
  });

  it('creates a friend conversation when that pair has none yet', async () => {
    const fixture = await setup();
    const chatButtons = [...fixture.nativeElement.querySelectorAll('button')].filter(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'Message',
    ) as HTMLButtonElement[];
    chatButtons[0].click();
    await fixture.whenStable();
    expect(createdFriends).toEqual([]);
    expect(watched).toContain('c_ann');
  });

  it('stops the spinners when the database does not connect', async () => {
    connect = async () => {
      throw new Error('offline');
    };
    const fixture = await setup();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Chat cannot load because the chat server is not available.');
    expect(root.textContent).toContain("Couldn't load chats.");
    expect(root.querySelector('mat-spinner, mat-progress-spinner')).toBeNull();
  });
});
