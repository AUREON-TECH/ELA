import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiaryEntry, updateDiaryEntry, deleteDiaryEntry, filterDiaryEntries } from '../js/diary.js';

test('filtra diário por texto sem diferenciar maiúsculas e acentos básicos', () => {
  const items = [
    { id:'1', body:'Dia leve', entryDate:'2026-09-17' },
    { id:'2', body:'Muita cólica', entryDate:'2026-09-16' }
  ];
  assert.equal(filterDiaryEntries(items, { query:'CÓLICA' }).length, 1);
});

test('cria, edita e exclui uma entrada', () => {
  const created = createDiaryEntry([], { body:'Meu dia', entryDate:'2026-09-17' }, 'id-1', '2026-09-17T12:00:00.000Z');
  assert.equal(created[0].id, 'id-1');
  const edited = updateDiaryEntry(created, 'id-1', { body:'Meu dia melhor' }, '2026-09-17T13:00:00.000Z');
  assert.equal(edited[0].body, 'Meu dia melhor');
  assert.equal(deleteDiaryEntry(edited, 'id-1').length, 0);
});
