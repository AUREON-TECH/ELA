import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateLegacyState } from '../js/state.js';

test('normaliza diário e agenda legados sem perder conteúdo', () => {
  const state = migrateLegacyState({
    notes:[{ date:'2026-09-17T10:00:00.000Z', text:'Anotação antiga' }],
    events:[{ date:'2026-09-18', text:'Consulta antiga' }]
  });
  assert.equal(state.notes[0].body, 'Anotação antiga');
  assert.equal(state.notes[0].entryDate, '2026-09-17');
  assert.equal(state.events[0].title, 'Consulta antiga');
  assert.equal(state.events[0].time, '09:00');
});
