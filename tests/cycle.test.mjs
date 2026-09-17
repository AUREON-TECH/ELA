import test from 'node:test';
import assert from 'node:assert/strict';
import { getPhaseForDay, getCycleInfo } from '../js/cycle.js';

test('classifica fase menstrual', () => {
  assert.equal(getPhaseForDay(3, 28, 5), 'Menstrual');
});

test('classifica período fértil', () => {
  assert.equal(getPhaseForDay(14, 28, 5), 'Fértil');
});

test('calcula dia e próxima menstruação', () => {
  const info = getCycleInfo({ lastPeriod:'2026-09-01', cycleLength:28, periodLength:5 }, new Date('2026-09-17T12:00:00'));
  assert.equal(info.day, 17);
  assert.equal(info.nextPeriod.toISOString().slice(0,10), '2026-09-29');
});
