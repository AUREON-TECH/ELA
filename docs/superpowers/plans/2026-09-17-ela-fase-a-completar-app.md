# ELA Fase A — Completar o app atual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar as funcionalidades locais já existentes do ELA até uma versão consistente, completa e testável antes da conexão com o Supabase.

**Architecture:** Manter o ELA como PWA estática em GitHub Pages, mas separar regras de negócio em módulos JavaScript reutilizáveis e testáveis. `localStorage` continua como fonte local nesta fase, com um único estado canônico `ela-pwa-v3`, preparado para futura sincronização com Supabase sem quebrar dados existentes.

**Tech Stack:** HTML5, CSS3, JavaScript ES Modules, Web Storage, Service Worker, Web App Manifest, Node.js `node:test` para testes de regras puras.

**Spec:** `docs/superpowers/specs/2026-09-17-ela-supabase-backend-design.md`

## Global Constraints

- Não misturar dados do ELA com CaptaPro.
- Não expor `service_role` ou segredos no frontend.
- Não remover suporte offline já existente.
- Não transformar previsões de ciclo em orientação contraceptiva ou diagnóstico.
- Não implantar ELA IA antes da base de autenticação, dados e privacidade estar validada.
- Nesta fase, manter compatibilidade com dados legados `ela-pwa-v1` e `ela-pwa-v2`.

---

### Task 1: Criar estado canônico e migrar dados locais

**Files:**
- Create: `js/state.js`
- Create: `tests/state.test.mjs`
- Modify: `index.html`
- Modify: `calendar.html`
- Modify: `signos.html`

**Interfaces:**
- Produces: `loadState(): ElaState`, `saveState(state): void`, `migrateLegacyState(raw): ElaState`.
- Canonical key: `ela-pwa-v3`.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/state.test.mjs`

Expected: FAIL because `js/state.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement `js/state.js` with:

```js
export const STORAGE_KEY = 'ela-pwa-v3';
export function migrateLegacyState(raw = {}) {
  return {
    ...raw,
    zodiacSign: raw.zodiacSign || raw.zodiac || raw.signo || '',
    checkins: Array.isArray(raw.checkins) ? raw.checkins : [],
    notes: Array.isArray(raw.notes) ? raw.notes : [],
    events: Array.isArray(raw.events) ? raw.events : [],
    selfCare: Array.isArray(raw.selfCare) ? raw.selfCare : []
  };
}
export function loadState(storage = localStorage) {
  const current = storage.getItem(STORAGE_KEY);
  if (current) return migrateLegacyState(JSON.parse(current));
  const legacy = storage.getItem('ela-pwa-v2') || storage.getItem('ela-pwa-v1') || '{}';
  const state = migrateLegacyState(JSON.parse(legacy));
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}
export function saveState(state, storage = localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(migrateLegacyState(state)));
}
```

Update all three pages to use `zodiacSign` and the new module.

- [ ] **Step 4: Run tests**

Run: `node --test tests/state.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/state.js tests/state.test.mjs index.html calendar.html signos.html
git commit -m "refactor: centralize ELA local state"
```

---

### Task 2: Fortalecer ciclo, fluxo, cólica e sintomas

**Files:**
- Create: `js/cycle.js`
- Create: `tests/cycle.test.mjs`
- Modify: `index.html`
- Modify: `calendar.html`

**Interfaces:**
- Consumes: canonical state from `js/state.js`.
- Produces: `getCycleInfo(state, date)`, `getPhaseForDay(cycleDay, cycleLength, periodLength)`.

- [ ] **Step 1: Write failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getPhaseForDay } from '../js/cycle.js';

test('classifica fase menstrual', () => {
  assert.equal(getPhaseForDay(3, 28, 5), 'Menstrual');
});

test('classifica período fértil', () => {
  assert.equal(getPhaseForDay(14, 28, 5), 'Fértil');
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `node --test tests/cycle.test.mjs`

Expected: FAIL.

- [ ] **Step 3: Implement cycle module and UI fields**

Add check-in inputs for:

```text
Fluxo: Leve | Moderado | Intenso
Cólica: 0–10
Sono: Ruim | Regular | Bom
Libido: Baixa | Média | Alta
```

Persist them inside each daily check-in. Add symptom intensity map with values `1`, `2`, `3` for leve/moderado/intenso.

- [ ] **Step 4: Render these fields in day detail**

Calendar day detail must show flow, cramp intensity, sleep, libido and symptom intensities when available.

- [ ] **Step 5: Run tests**

Run: `node --test tests/cycle.test.mjs tests/state.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/cycle.js tests/cycle.test.mjs index.html calendar.html
git commit -m "feat: enrich cycle and symptom tracking"
```

---

### Task 3: Completar diário com editar, excluir, busca e filtro

**Files:**
- Modify: `index.html`
- Create: `js/diary.js`
- Create: `tests/diary.test.mjs`

**Interfaces:**
- Produces: `createDiaryEntry`, `updateDiaryEntry`, `deleteDiaryEntry`, `filterDiaryEntries`.

- [ ] **Step 1: Write failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { filterDiaryEntries } from '../js/diary.js';

test('filtra diário por texto', () => {
  const items = [{ id:'1', body:'Dia leve', entryDate:'2026-09-17' }, { id:'2', body:'Muita cólica', entryDate:'2026-09-16' }];
  assert.equal(filterDiaryEntries(items, { query:'cólica' }).length, 1);
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `node --test tests/diary.test.mjs`

Expected: FAIL.

- [ ] **Step 3: Implement diary actions**

Each entry must have `id`, `entryDate`, `body`, `mood`, `symptoms`, `createdAt`, `updatedAt`.

Add UI controls:

```text
Buscar no diário
Filtrar por data inicial/final
Editar
Excluir
```

Deletion requires an in-app confirmation before mutating state.

- [ ] **Step 4: Run tests**

Run: `node --test tests/diary.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/diary.js tests/diary.test.mjs index.html
git commit -m "feat: complete ELA diary controls"
```

---

### Task 4: Completar agenda e lembretes locais

**Files:**
- Create: `js/agenda.js`
- Create: `tests/agenda.test.mjs`
- Modify: `index.html`

**Interfaces:**
- Produces: `normalizeEvent`, `sortEvents`, `getUpcomingEvents`.

- [ ] **Step 1: Write failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { sortEvents } from '../js/agenda.js';

test('ordena agenda por data e horário', () => {
  const items = [
    { date:'2026-09-18', time:'18:00' },
    { date:'2026-09-18', time:'09:00' }
  ];
  assert.equal(sortEvents(items)[0].time, '09:00');
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `node --test tests/agenda.test.mjs`

Expected: FAIL.

- [ ] **Step 3: Expand agenda model**

Each event must support:

```js
{
  id,
  date,
  time,
  title,
  category,
  notes,
  reminderEnabled,
  reminderMinutesBefore,
  createdAt,
  updatedAt
}
```

Categories: `Saúde`, `Autocuidado`, `Trabalho`, `Pessoal`, `Outro`.

- [ ] **Step 4: Add edit/delete UX and reminder permission banner**

The app may request Notification permission only after explicit user action. In Phase A, scheduled reminders are local best-effort while the PWA is active; real background push is reserved for Phase C.

- [ ] **Step 5: Run tests**

Run: `node --test tests/agenda.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/agenda.js tests/agenda.test.mjs index.html
git commit -m "feat: complete ELA agenda model and controls"
```

---

### Task 5: Criar área Autocuidado & Beleza

**Files:**
- Create: `js/self-care.js`
- Create: `tests/self-care.test.mjs`
- Modify: `index.html`
- Modify: `calendar.html`

**Interfaces:**
- Produces: `saveSelfCareEntry`, `getSelfCareForDate`.

- [ ] **Step 1: Write failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getSelfCareForDate } from '../js/self-care.js';

test('retorna autocuidado do dia', () => {
  const items = [{ date:'2026-09-17', water:6, skin:'Boa' }];
  assert.equal(getSelfCareForDate(items, '2026-09-17').water, 6);
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `node --test tests/self-care.test.mjs`

Expected: FAIL.

- [ ] **Step 3: Implement optional daily fields**

Track:

```text
Água: copos
Sono: horas
Exercício: minutos
Pele: Ruim | Normal | Boa
Cabelo: Ruim | Normal | Bom
Autocuidado realizado: sim/não
Observação livre
```

Add a dedicated `Autocuidado` view reachable from the bottom navigation or `Eu` section without exceeding six primary navigation items.

- [ ] **Step 4: Show self-care in calendar day detail**

Render only fields actually filled by the user.

- [ ] **Step 5: Run tests**

Run: `node --test tests/self-care.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/self-care.js tests/self-care.test.mjs index.html calendar.html
git commit -m "feat: add self care and beauty tracking"
```

---

### Task 6: Melhorar insights pessoais sem diagnóstico

**Files:**
- Create: `js/insights.js`
- Create: `tests/insights.test.mjs`
- Modify: `index.html`

**Interfaces:**
- Produces: `buildInsights(state): Insight[]` where `Insight = { title, text, kind }`.

- [ ] **Step 1: Write failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInsights } from '../js/insights.js';

test('não cria insight diagnóstico', () => {
  const insights = buildInsights({ checkins:[{ energy:4, symptoms:['Cólica'] }] });
  assert.equal(insights.some(i => /diagnóst|doença|tem\s/i.test(i.text)), false);
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `node --test tests/insights.test.mjs`

Expected: FAIL.

- [ ] **Step 3: Implement descriptive insights**

Generate only when sample size is sufficient:

```text
Energia média recente
Humor mais frequente
Sintoma mais frequente
Cólica média registrada
Sono médio
Autocuidado recente
```

Require at least 3 records before showing pattern language. Use phrasing such as “Nos seus registros recentes...” and never “Você tem...”.

- [ ] **Step 4: Run tests**

Run: `node --test tests/insights.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/insights.js tests/insights.test.mjs index.html
git commit -m "feat: improve personal non-diagnostic insights"
```

---

### Task 7: Fechar PWA, offline e instalação

**Files:**
- Modify: `manifest.webmanifest`
- Modify: `sw.js`
- Modify: `index.html`
- Modify: `calendar.html`
- Modify: `signos.html`
- Create: `offline.html`

**Interfaces:**
- Service worker cache version: `ela-shell-v2`.

- [ ] **Step 1: Expand app shell**

Cache exactly:

```js
[
  './',
  './index.html',
  './calendar.html',
  './signos.html',
  './offline.html',
  './manifest.webmanifest',
  './icon-192.svg',
  './icon-512.svg',
  './js/state.js',
  './js/cycle.js',
  './js/diary.js',
  './js/agenda.js',
  './js/self-care.js',
  './js/insights.js'
]
```

- [ ] **Step 2: Keep sensitive-request bypass**

Preserve the existing rule that authenticated/cookie/token-bearing requests are never cached.

- [ ] **Step 3: Improve navigation fallback**

For navigation requests: network first; fallback to cached requested page; then `offline.html`.

- [ ] **Step 4: Verify manifest consistency**

Ensure:

```json
{
  "name": "ELA • Ciclo, Humor & Bem-estar",
  "short_name": "ELA",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait-primary"
}
```

Keep 192x192 and 512x512 maskable icons.

- [ ] **Step 5: Browser verification**

Run a local static server and verify:

```bash
python -m http.server 8080
```

Checks:

```text
- index opens without console errors
- cycle data persists after reload
- calendar opens offline after first load
- signos page opens offline after first load
- app shell shows no broken links
- PWA manifest is detected
- service worker reaches activated state
```

- [ ] **Step 6: Commit**

```bash
git add manifest.webmanifest sw.js index.html calendar.html signos.html offline.html js/*.js
git commit -m "feat: complete ELA phase A PWA experience"
```

---

### Task 8: Final regression and acceptance pass

**Files:**
- Modify only files that fail validation.

- [ ] **Step 1: Run all rule tests**

```bash
node --test tests/*.test.mjs
```

Expected: all PASS.

- [ ] **Step 2: Manual mobile acceptance**

Validate at 360px, 390px and 412px widths:

```text
Hoje
Ciclo
Calendário
Humor/energia/sintomas
Diário
Agenda
Autocuidado
Signo
Insights
Offline
```

- [ ] **Step 3: Regression on legacy data**

Populate `ela-pwa-v2`, reload the app, confirm it migrates to `ela-pwa-v3` with no loss of cycle, notes, agenda, check-ins or sign.

- [ ] **Step 4: Commit fixes if any**

```bash
git add .
git commit -m "fix: close ELA phase A regressions"
```

## Phase A Definition of Done

Phase A is complete only when:

- one canonical local state is used;
- sign is consistent across all pages;
- cycle and daily symptoms are richer;
- diary supports CRUD and search/filter;
- agenda supports time, category, edit/delete and reminder preferences;
- self-care/beauty exists;
- insights are descriptive and non-diagnostic;
- all primary pages are available offline after first load;
- manifest and service worker support standalone PWA behavior;
- all automated tests pass;
- mobile regression is clean.
