import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateLegacyState } from '../js/state.js';

test('unifica signo legado zodiac/signo em zodiacSign', () => {
  assert.equal(migrateLegacyState({ zodiac: 'Libra' }).zodiacSign, 'Libra');
  assert.equal(migrateLegacyState({ signo: 'Áries' }).zodiacSign, 'Áries');
});

test('preserva registros existentes', () => {
  const s = migrateLegacyState({ checkins: [{ date: '2026-09-17' }], notes: [{ text: 'x' }] });
  assert.equal(s.checkins.length, 1);
  assert.equal(s.notes.length, 1);
});

test('normaliza coleções ausentes', () => {
  const s = migrateLegacyState({});
  assert.deepEqual(s.checkins, []);
  assert.deepEqual(s.notes, []);
  assert.deepEqual(s.events, []);
  assert.deepEqual(s.selfCare, []);
});
