import test from 'node:test';
import assert from 'node:assert/strict';
import { saveSelfCareEntry, getSelfCareForDate } from '../js/self-care.js';

test('salva e retorna autocuidado do dia', () => {
  const items = saveSelfCareEntry([], { date:'2026-09-17', water:6, skin:'Boa' }, 'id-1');
  const entry = getSelfCareForDate(items, '2026-09-17');
  assert.equal(entry.water, 6);
  assert.equal(entry.skin, 'Boa');
});

test('substitui registro do mesmo dia em vez de duplicar', () => {
  const a = saveSelfCareEntry([], { date:'2026-09-17', water:4 }, 'id-1');
  const b = saveSelfCareEntry(a, { date:'2026-09-17', water:8 }, 'id-1');
  assert.equal(b.length, 1);
  assert.equal(b[0].water, 8);
});
