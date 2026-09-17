export const STORAGE_KEY = 'ela-pwa-v3';

function normalizeNotes(notes = []) {
  return notes.map((item, index) => {
    const createdAt = item.createdAt || item.date || new Date().toISOString();
    return {
      id: item.id || `legacy-note-${index}-${String(createdAt).slice(0, 10)}`,
      entryDate: item.entryDate || String(createdAt).slice(0, 10),
      body: String(item.body ?? item.text ?? '').trim(),
      mood: item.mood || '',
      symptoms: Array.isArray(item.symptoms) ? item.symptoms : [],
      createdAt,
      updatedAt: item.updatedAt || createdAt
    };
  }).filter(item => item.body);
}

function normalizeEvents(events = []) {
  return events.map((item, index) => {
    const createdAt = item.createdAt || new Date().toISOString();
    return {
      id: item.id || `legacy-event-${index}-${item.date || 'unknown'}`,
      date: item.date || '',
      time: item.time || '09:00',
      title: String(item.title ?? item.text ?? '').trim(),
      category: item.category || 'Pessoal',
      notes: String(item.notes || '').trim(),
      reminderEnabled: Boolean(item.reminderEnabled),
      reminderMinutesBefore: Number.isFinite(Number(item.reminderMinutesBefore)) ? Number(item.reminderMinutesBefore) : 30,
      createdAt,
      updatedAt: item.updatedAt || createdAt
    };
  }).filter(item => item.title && item.date);
}

export function migrateLegacyState(raw = {}) {
  return {
    ...raw,
    zodiacSign: raw.zodiacSign || raw.zodiac || raw.signo || '',
    checkins: Array.isArray(raw.checkins) ? raw.checkins : [],
    notes: normalizeNotes(Array.isArray(raw.notes) ? raw.notes : []),
    events: normalizeEvents(Array.isArray(raw.events) ? raw.events : []),
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
  const normalized = migrateLegacyState(state);
  storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}
