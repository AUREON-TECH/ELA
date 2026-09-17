import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('index expõe todas as áreas e controles principais', () => {
  const html = read('index.html');
  const requiredIds = [
    'hoje','ciclo','eu','agenda','autocuidado','ia',
    'saveCheckinButton','saveCycleButton','saveZodiacButton','saveNoteButton','saveEventButton','saveSelfCareButton',
    'diarySearch','eventTime','eventCategory','requestNotifications','selfCareDate','insights'
  ];
  for (const id of requiredIds) assert.match(html, new RegExp(`id=["']${id}["']`), `faltando #${id}`);
  assert.match(html, /<script type="module" src="\.\/js\/app\.js"><\/script>/);
});

test('calendário e signo usam o estado canônico', () => {
  const calendar = read('calendar.html');
  const signs = read('signos.html');
  assert.match(calendar, /from '\.\/js\/state\.js'/);
  assert.match(calendar, /from '\.\/js\/cycle\.js'/);
  assert.match(signs, /from '\.\/js\/state\.js'/);
  assert.match(signs, /zodiacSign/);
});

test('service worker guarda o shell completo e fallback offline', () => {
  const sw = read('sw.js');
  for (const asset of ['./index.html','./calendar.html','./signos.html','./offline.html','./js/app.js','./js/state.js','./js/cycle.js','./js/diary.js','./js/agenda.js','./js/self-care.js','./js/insights.js']) {
    assert.ok(sw.includes(`'${asset}'`), `cache sem ${asset}`);
  }
  assert.match(sw, /sensitive\(request,url\)/);
  assert.match(sw, /\.\/offline\.html/);
});

test('manifest está configurado para PWA standalone', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.short_name, 'ELA');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.some(icon => String(icon.sizes).includes('192x192')));
  assert.ok(manifest.icons.some(icon => String(icon.sizes).includes('512x512')));
});
