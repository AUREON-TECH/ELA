import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEvent, sortEvents, getUpcomingEvents } from '../js/agenda.js';

test('ordena agenda por data e horário', () => {
  const items = [
    { id:'2', date:'2026-09-18', time:'18:00', title:'B' },
    { id:'1', date:'2026-09-18', time:'09:00', title:'A' }
  ];
  assert.equal(sortEvents(items)[0].time, '09:00');
});

test('normaliza valores padrão de lembrete', () => {
  const e = normalizeEvent({ id:'1', date:'2026-09-18', title:'Consulta' });
  assert.equal(e.reminderEnabled, false);
  assert.equal(e.reminderMinutesBefore, 30);
});

test('retorna somente eventos futuros', () => {
  const items = [
    { id:'1', date:'2026-09-16', time:'10:00', title:'Passado' },
    { id:'2', date:'2026-09-18', time:'10:00', title:'Futuro' }
  ];
  assert.deepEqual(getUpcomingEvents(items, '2026-09-17').map(x => x.id), ['2']);
});
