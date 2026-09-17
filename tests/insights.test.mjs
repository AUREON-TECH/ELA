import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInsights } from '../js/insights.js';

test('não cria padrão com menos de três registros', () => {
  const insights = buildInsights({ checkins:[{ energy:4, symptoms:['Cólica'] }, { energy:5, symptoms:['Cólica'] }] });
  assert.equal(insights.length, 0);
});

test('cria insights descritivos com três ou mais registros', () => {
  const insights = buildInsights({ checkins:[
    { energy:4, mood:'Sensível', symptoms:['Cólica'] },
    { energy:6, mood:'Bem', symptoms:['Cólica'] },
    { energy:5, mood:'Bem', symptoms:['Inchaço'] }
  ] });
  assert.equal(insights.some(i => /energia média/i.test(i.text)), true);
  assert.equal(insights.some(i => /sintoma mais registrado/i.test(i.text)), true);
});

test('não usa linguagem diagnóstica', () => {
  const insights = buildInsights({ checkins:[
    { energy:4, mood:'Sensível', symptoms:['Cólica'] },
    { energy:4, mood:'Sensível', symptoms:['Cólica'] },
    { energy:4, mood:'Sensível', symptoms:['Cólica'] }
  ] });
  assert.equal(insights.some(i => /diagnóst|doença|você tem/i.test(i.text)), false);
});
