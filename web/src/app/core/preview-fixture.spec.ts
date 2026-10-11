import { formatActivityTime, sortInbox } from './chat-model';
import { PREVIEW_NOW, previewInbox, previewMessages } from './preview-fixture';

describe('preview fixture', () => {
  it('pins Notes, selects Mina, and keeps the section 10 labels', () => {
    const rows = sortInbox(previewInbox);
    expect(rows.map((item) => item.id)).toEqual([
      'preview_notes',
      'preview_mina',
      'preview_dev',
      'preview_jordan',
      'preview_taylor',
      'preview_nimbus',
      'preview_casey',
      'preview_avery',
    ]);
    expect(rows[1].unread).toBe(2);
    expect(formatActivityTime(rows[1].updatedAt, PREVIEW_NOW, 'en-US')).toBe('10:24 AM');
    expect(formatActivityTime(rows[2].updatedAt, PREVIEW_NOW, 'en-US')).toBe('9:18 AM');
    expect(formatActivityTime(rows[3].updatedAt, PREVIEW_NOW, 'en-US')).toBe('Yesterday');
    expect(formatActivityTime(rows[5].updatedAt, PREVIEW_NOW, 'en-US')).toBe('Tue');
    expect(formatActivityTime(rows[6].updatedAt, PREVIEW_NOW, 'en-US')).toBe('Mon');
    expect(previewMessages('preview_mina').map((message) => message.text)).toContain('Hey Riley! 👋');
    expect(previewMessages('preview_mina').at(-1)?.text).toBe('That sounds great. See you there.');
    expect(previewMessages('preview_notes')).toEqual([]);
  });
});
