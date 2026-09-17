export function normalizeEvent(input = {}) {
  return {
    id: input.id || crypto.randomUUID(),
    date: input.date || '',
    time: input.time || '09:00',
    title: String(input.title || input.text || '').trim(),
    category: input.category || 'Pessoal',
    notes: String(input.notes || '').trim(),
    reminderEnabled: Boolean(input.reminderEnabled),
    reminderMinutesBefore: Number.isFinite(Number(input.reminderMinutesBefore)) ? Number(input.reminderMinutesBefore) : 30,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || new Date().toISOString()
  };
}

export function sortEvents(items = []) {
  return [...items].map(normalizeEvent).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
}

export function getUpcomingEvents(items = [], today = new Date().toISOString().slice(0, 10)) {
  return sortEvents(items).filter(item => item.date >= today);
}

export function upsertEvent(items = [], input = {}) {
  const event = normalizeEvent(input);
  const exists = items.some(item => item.id === event.id);
  const next = exists ? items.map(item => item.id === event.id ? event : item) : [...items, event];
  return sortEvents(next);
}

export function deleteEvent(items = [], id) {
  return items.filter(item => item.id !== id);
}
