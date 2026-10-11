import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseHandle } from './store.js';

test('uses a slug of the display name', () => {
  assert.equal(chooseHandle('Mina Chen', 'guest_1', new Set()), 'minachen');
});

test('keeps an existing handle distinct', () => {
  const handle = chooseHandle('Mina Chen', 'guest_abcd99', new Set(['minachen']));
  assert.equal(handle, 'minachen_gues');
  assert.equal(chooseHandle('Mina Chen', 'guest_abcd99', new Set(['minachen', 'minachen_gues'])), 'minachen_gues2');
});
