import { loadState, saveState } from './state.js';
import { getCycleInfo } from './cycle.js';
import { createDiaryEntry, updateDiaryEntry, deleteDiaryEntry, filterDiaryEntries } from './diary.js';
import { getUpcomingEvents, upsertEvent, deleteEvent } from './agenda.js';
import { saveSelfCareEntry, getSelfCareForDate } from './self-care.js';
import { buildInsights } from './insights.js';

let state = loadState();
const $ = id => document.getElementById(id);
const todayKey = () => new Date().toISOString().slice(0, 10);
const uuid = () => crypto.randomUUID ? crypto.randomUUID() : `ela-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const formatDate = value => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '—';

function persist() {
  state = saveState(state);
}

function showView(id) {
  document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === id));
  document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id === 'eu') renderDiary();
  if (id === 'agenda') renderAgenda();
  if (id === 'autocuidado') loadSelfCareForm();
}

function selectedMood() {
  return document.querySelector('#moods button.on')?.dataset.v || state.mood || '';
}

function selectedSymptoms() {
  return [...document.querySelectorAll('#symptoms button.on')].map(button => button.dataset.v);
}

function selectedSymptomLevel() {
  return Number(document.querySelector('#symptomLevels button.on')?.dataset.level || 1);
}

function renderCheckinFromToday() {
  const checkin = (state.checkins || []).find(item => item.date === todayKey());
  document.querySelectorAll('#moods button').forEach(button => button.classList.toggle('on', button.dataset.v === checkin?.mood));
  document.querySelectorAll('#symptoms button').forEach(button => button.classList.toggle('on', (checkin?.symptoms || []).includes(button.dataset.v)));
  const intensityValues = Object.values(checkin?.symptomIntensity || {});
  const level = intensityValues[0] || 1;
  document.querySelectorAll('#symptomLevels button').forEach(button => button.classList.toggle('on', Number(button.dataset.level) === Number(level)));
  $('energy').value = checkin?.energy || 5;
  $('energyVal').textContent = $('energy').value;
  $('cramp').value = checkin?.crampIntensity ?? 0;
  $('crampVal').textContent = $('cramp').value;
  $('flow').value = checkin?.flow || '';
  $('sleepQuality').value = checkin?.sleepQuality || '';
  $('sleepHours').value = checkin?.sleepHours ?? '';
  $('libido').value = checkin?.libido || '';
}

function saveCheckin() {
  const symptoms = selectedSymptoms();
  const level = selectedSymptomLevel();
  const entry = {
    date: todayKey(),
    mood: selectedMood(),
    energy: Number($('energy').value),
    symptoms,
    symptomIntensity: Object.fromEntries(symptoms.map(symptom => [symptom, level])),
    flow: $('flow').value,
    crampIntensity: Number($('cramp').value),
    sleepQuality: $('sleepQuality').value,
    sleepHours: $('sleepHours').value === '' ? null : Number($('sleepHours').value),
    libido: $('libido').value,
    updatedAt: new Date().toISOString()
  };
  state.checkins = (state.checkins || []).filter(item => item.date !== entry.date);
  state.checkins.unshift(entry);
  state.mood = entry.mood;
  state.moodDate = entry.date;
  persist();
  $('checkSaved').textContent = 'Check-in de hoje salvo ✓';
  renderAll();
}

function saveCycle() {
  state.lastPeriod = $('lastPeriod').value;
  state.cycleLength = Number($('cycleLength').value) || 28;
  state.periodLength = Number($('periodLength').value) || 5;
  persist();
  renderCycle();
  $('cycleSaved').textContent = 'Ciclo atualizado ✓';
}

function renderCycle() {
  $('lastPeriod').value = state.lastPeriod || '';
  $('cycleLength').value = state.cycleLength || 28;
  $('periodLength').value = state.periodLength || 5;
  const info = getCycleInfo(state, new Date());
  if (!info) {
    $('cycle').textContent = '—';
    $('phase').textContent = '—';
    $('nextPeriod').textContent = 'Registre seu ciclo';
    $('fertile').textContent = 'Estimativa pessoal';
    $('cycleDetails').innerHTML = '<p class="muted">Adicione a data da última menstruação para ver as estimativas.</p>';
    return;
  }
  $('cycle').textContent = `Dia ${info.day}`;
  $('phase').textContent = info.phase;
  $('nextPeriod').textContent = `Próxima: ${info.nextPeriod.toLocaleDateString('pt-BR')}`;
  $('fertile').textContent = `Janela estimada: dias ${info.fertileStart}–${info.fertileEnd}`;
  $('cycleDetails').innerHTML = `
    <div class="metric-row"><span>Dia do ciclo</span><b>${info.day}</b></div>
    <div class="metric-row"><span>Fase estimada</span><b>${escapeHtml(info.phase)}</b></div>
    <div class="metric-row"><span>Ovulação estimada</span><b>Dia ${info.ovulationDay}</b></div>
    <div class="metric-row"><span>Janela fértil estimada</span><b>Dias ${info.fertileStart}–${info.fertileEnd}</b></div>
    <div class="metric-row"><span>Próxima menstruação</span><b>${info.nextPeriod.toLocaleDateString('pt-BR')}</b></div>`;
}

const zodiacMessages = [
  'Seu ritmo também merece respeito.',
  'Escute seu corpo sem julgamento.',
  'Pequenos cuidados também contam.',
  'Hoje, escolha algo que faça bem a você.',
  'Conhecer seus padrões é uma forma de autocuidado.',
  'Reserve alguns minutos para você hoje.',
  'Nem todo dia precisa ter o mesmo ritmo.',
  'Sua energia não precisa ser igual todos os dias.',
  'Observe antes de se cobrar: como você realmente está?'
];

function renderSign() {
  $('zodiac').value = state.zodiacSign || '';
  const seed = (new Date().getDate() + (state.zodiacSign || 'ELA').length) % zodiacMessages.length;
  $('sign').textContent = zodiacMessages[seed];
  $('signLabel').textContent = state.zodiacSign ? `${state.zodiacSign} · mensagem do dia` : 'Escolha seu signo';
}

function saveZodiac() {
  state.zodiacSign = $('zodiac').value;
  persist();
  renderSign();
  $('zodiacSaved').textContent = 'Signo salvo ✓';
}

function saveDiary() {
  const body = $('note').value.trim();
  if (!body) return;
  const id = $('editingNoteId').value;
  if (id) {
    state.notes = updateDiaryEntry(state.notes || [], id, { body, entryDate: $('diaryDate').value || todayKey() });
  } else {
    state.notes = createDiaryEntry(state.notes || [], {
      body,
      entryDate: $('diaryDate').value || todayKey(),
      mood: state.mood || '',
      symptoms: (state.checkins || []).find(item => item.date === ($('diaryDate').value || todayKey()))?.symptoms || []
    }, uuid());
  }
  persist();
  resetDiaryForm();
  renderDiary();
  $('saved').textContent = 'Anotação salva ✓';
}

function resetDiaryForm() {
  $('editingNoteId').value = '';
  $('note').value = '';
  $('diaryDate').value = todayKey();
  $('saveNoteButton').textContent = 'Salvar anotação';
}

function editDiary(id) {
  const item = (state.notes || []).find(note => note.id === id);
  if (!item) return;
  $('editingNoteId').value = id;
  $('diaryDate').value = item.entryDate;
  $('note').value = item.body;
  $('saveNoteButton').textContent = 'Atualizar anotação';
  $('note').focus();
}

function removeDiary(id) {
  if (!confirm('Excluir esta anotação?')) return;
  state.notes = deleteDiaryEntry(state.notes || [], id);
  persist();
  renderDiary();
}

function renderDiary() {
  const filters = { query: $('diarySearch').value, start: $('diaryStart').value, end: $('diaryEnd').value };
  const items = filterDiaryEntries(state.notes || [], filters);
  $('history').innerHTML = items.length ? items.map(item => `
    <article class="list-item">
      <div class="list-top"><b>${formatDate(item.entryDate)}</b><span>${escapeHtml(item.mood || '')}</span></div>
      <p>${escapeHtml(item.body)}</p>
      ${item.symptoms?.length ? `<div class="mini-tags">${item.symptoms.map(symptom => `<span>${escapeHtml(symptom)}</span>`).join('')}</div>` : ''}
      <div class="actions"><button data-edit-note="${escapeHtml(item.id)}">Editar</button><button class="danger" data-delete-note="${escapeHtml(item.id)}">Excluir</button></div>
    </article>`).join('') : '<p class="muted">Nenhuma anotação encontrada.</p>';
  document.querySelectorAll('[data-edit-note]').forEach(button => button.onclick = () => editDiary(button.dataset.editNote));
  document.querySelectorAll('[data-delete-note]').forEach(button => button.onclick = () => removeDiary(button.dataset.deleteNote));
}

function resetAgendaForm() {
  $('editingEventId').value = '';
  $('eventDate').value = todayKey();
  $('eventTime').value = '09:00';
  $('eventTitle').value = '';
  $('eventCategory').value = 'Pessoal';
  $('eventNotes').value = '';
  $('eventReminder').checked = false;
  $('eventReminderMinutes').value = '30';
  $('saveEventButton').textContent = 'Adicionar compromisso';
}

function saveAgendaEvent() {
  if (!$('eventDate').value || !$('eventTitle').value.trim()) return;
  const previous = $('editingEventId').value ? (state.events || []).find(item => item.id === $('editingEventId').value) : null;
  const now = new Date().toISOString();
  const event = {
    ...(previous || {}),
    id: previous?.id || uuid(),
    date: $('eventDate').value,
    time: $('eventTime').value || '09:00',
    title: $('eventTitle').value.trim(),
    category: $('eventCategory').value,
    notes: $('eventNotes').value.trim(),
    reminderEnabled: $('eventReminder').checked,
    reminderMinutesBefore: Number($('eventReminderMinutes').value) || 30,
    createdAt: previous?.createdAt || now,
    updatedAt: now
  };
  state.events = upsertEvent(state.events || [], event);
  persist();
  scheduleEventReminder(event);
  resetAgendaForm();
  renderAgenda();
  $('eventSaved').textContent = 'Compromisso salvo ✓';
}

function editAgendaEvent(id) {
  const item = (state.events || []).find(event => event.id === id);
  if (!item) return;
  $('editingEventId').value = id;
  $('eventDate').value = item.date;
  $('eventTime').value = item.time;
  $('eventTitle').value = item.title;
  $('eventCategory').value = item.category;
  $('eventNotes').value = item.notes;
  $('eventReminder').checked = item.reminderEnabled;
  $('eventReminderMinutes').value = String(item.reminderMinutesBefore || 30);
  $('saveEventButton').textContent = 'Atualizar compromisso';
}

function removeAgendaEvent(id) {
  if (!confirm('Excluir este compromisso?')) return;
  state.events = deleteEvent(state.events || [], id);
  persist();
  renderAgenda();
}

function renderAgenda() {
  const items = getUpcomingEvents(state.events || [], todayKey());
  $('events').innerHTML = items.length ? items.map(item => `
    <article class="list-item">
      <div class="list-top"><b>${formatDate(item.date)} · ${escapeHtml(item.time)}</b><span class="tag">${escapeHtml(item.category)}</span></div>
      <h3>${escapeHtml(item.title)}</h3>
      ${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ''}
      <div class="mini-tags">${item.reminderEnabled ? `<span>🔔 ${item.reminderMinutesBefore} min antes</span>` : '<span>Sem lembrete</span>'}</div>
      <div class="actions"><button data-edit-event="${escapeHtml(item.id)}">Editar</button><button class="danger" data-delete-event="${escapeHtml(item.id)}">Excluir</button></div>
    </article>`).join('') : '<p class="muted">Nenhum compromisso futuro.</p>';
  document.querySelectorAll('[data-edit-event]').forEach(button => button.onclick = () => editAgendaEvent(button.dataset.editEvent));
  document.querySelectorAll('[data-delete-event]').forEach(button => button.onclick = () => removeAgendaEvent(button.dataset.deleteEvent));
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    $('notificationStatus').textContent = 'Este navegador não suporta notificações.';
    return;
  }
  const result = await Notification.requestPermission();
  $('notificationStatus').textContent = result === 'granted' ? 'Notificações permitidas ✓' : 'Permissão não concedida.';
  if (result === 'granted') scheduleActiveReminders();
}

function scheduleEventReminder(event) {
  if (!event?.reminderEnabled || Notification.permission !== 'granted') return;
  const eventAt = new Date(`${event.date}T${event.time || '09:00'}:00`);
  const delay = eventAt.getTime() - Date.now() - (Number(event.reminderMinutesBefore || 30) * 60000);
  if (delay <= 0 || delay > 2147483647) return;
  setTimeout(() => {
    navigator.serviceWorker?.ready.then(registration => registration.showNotification('ELA · Lembrete', {
      body: event.title,
      icon: './icon-192.svg',
      badge: './icon-192.svg',
      tag: `ela-event-${event.id}`
    })).catch(() => new Notification('ELA · Lembrete', { body:event.title }));
  }, delay);
}

function scheduleActiveReminders() {
  getUpcomingEvents(state.events || [], todayKey()).forEach(scheduleEventReminder);
}

function saveSelfCare() {
  const date = $('selfCareDate').value || todayKey();
  state.selfCare = saveSelfCareEntry(state.selfCare || [], {
    date,
    water: $('water').value,
    sleepHours: $('selfSleep').value,
    exerciseMinutes: $('exercise').value,
    skin: $('skin').value,
    hair: $('hair').value,
    selfCareDone: $('selfCareDone').checked,
    notes: $('selfCareNotes').value
  }, uuid());
  persist();
  $('selfCareSaved').textContent = 'Autocuidado salvo ✓';
  renderInsights();
}

function loadSelfCareForm() {
  const date = $('selfCareDate').value || todayKey();
  $('selfCareDate').value = date;
  const item = getSelfCareForDate(state.selfCare || [], date);
  $('water').value = item?.water || '';
  $('selfSleep').value = item?.sleepHours ?? '';
  $('exercise').value = item?.exerciseMinutes ?? '';
  $('skin').value = item?.skin || '';
  $('hair').value = item?.hair || '';
  $('selfCareDone').checked = Boolean(item?.selfCareDone);
  $('selfCareNotes').value = item?.notes || '';
}

function renderInsights() {
  const insights = buildInsights(state);
  $('insights').innerHTML = insights.length ? insights.map(item => `<article class="insight"><b>${escapeHtml(item.title)}</b><p>${escapeHtml(item.text)}</p></article>`).join('') : '<div class="insight">Faça pelo menos 3 check-ins para o ELA começar a mostrar padrões pessoais.</div>';
}

function renderAll() {
  renderCycle();
  renderSign();
  renderCheckinFromToday();
  renderDiary();
  renderAgenda();
  renderInsights();
  $('moodLabel').textContent = state.mood || 'Como está?';
}

document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
document.querySelectorAll('#moods button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('#moods button').forEach(item => item.classList.remove('on'));
  button.classList.add('on');
  $('moodLabel').textContent = button.dataset.v;
}));
document.querySelectorAll('#symptoms button').forEach(button => button.addEventListener('click', () => button.classList.toggle('on')));
document.querySelectorAll('#symptomLevels button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('#symptomLevels button').forEach(item => item.classList.remove('on'));
  button.classList.add('on');
}));
$('energy').addEventListener('input', event => $('energyVal').textContent = event.target.value);
$('cramp').addEventListener('input', event => $('crampVal').textContent = event.target.value);
$('saveCheckinButton').addEventListener('click', saveCheckin);
$('saveCycleButton').addEventListener('click', saveCycle);
$('saveZodiacButton').addEventListener('click', saveZodiac);
$('saveNoteButton').addEventListener('click', saveDiary);
$('cancelNoteButton').addEventListener('click', resetDiaryForm);
['diarySearch','diaryStart','diaryEnd'].forEach(id => $(id).addEventListener('input', renderDiary));
$('saveEventButton').addEventListener('click', saveAgendaEvent);
$('cancelEventButton').addEventListener('click', resetAgendaForm);
$('requestNotifications').addEventListener('click', requestNotificationPermission);
$('selfCareDate').addEventListener('change', loadSelfCareForm);
$('saveSelfCareButton').addEventListener('click', saveSelfCare);

$('diaryDate').value = todayKey();
$('eventDate').value = todayKey();
$('selfCareDate').value = todayKey();
$('symptomLevels').querySelector('[data-level="1"]').classList.add('on');
renderAll();
loadSelfCareForm();

if ('Notification' in window) $('notificationStatus').textContent = Notification.permission === 'granted' ? 'Notificações permitidas ✓' : 'Ative para receber lembretes enquanto o app estiver ativo.';
if (Notification?.permission === 'granted') scheduleActiveReminders();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js', { updateViaCache:'none' }).then(registration => registration.update().catch(() => {}));
