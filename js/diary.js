function normalizeText(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function createDiaryEntry(items = [], input = {}, id = crypto.randomUUID(), now = new Date().toISOString()) {
  const body = String(input.body || '').trim();
  if (!body) return [...items];
  const entry = {
    id,
    entryDate: input.entryDate || now.slice(0, 10),
    body,
    mood: input.mood || '',
    symptoms: Array.isArray(input.symptoms) ? [...input.symptoms] : [],
    createdAt: now,
    updatedAt: now
  };
  return [entry, ...items];
}

export function updateDiaryEntry(items = [], id, patch = {}, now = new Date().toISOString()) {
  return items.map(item => item.id === id ? {
    ...item,
    ...patch,
    body: patch.body !== undefined ? String(patch.body).trim() : item.body,
    updatedAt: now
  } : item);
}

export function deleteDiaryEntry(items = [], id) {
  return items.filter(item => item.id !== id);
}

export function filterDiaryEntries(items = [], filters = {}) {
  const query = normalizeText(filters.query || '');
  const start = filters.start || '';
  const end = filters.end || '';
  return items.filter(item => {
    const date = item.entryDate || item.date?.slice?.(0, 10) || '';
    if (query && !normalizeText(item.body || item.text || '').includes(query)) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  });
}
