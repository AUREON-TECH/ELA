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
  const normalized = migrateLegacyState(state);
  storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}
