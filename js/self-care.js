export function saveSelfCareEntry(items = [], input = {}, id = crypto.randomUUID(), now = new Date().toISOString()) {
  const date = input.date || now.slice(0, 10);
  const existing = items.find(item => item.date === date);
  const entry = {
    id: existing?.id || id,
    date,
    water: Number(input.water || 0),
    sleepHours: input.sleepHours === '' || input.sleepHours == null ? null : Number(input.sleepHours),
    exerciseMinutes: input.exerciseMinutes === '' || input.exerciseMinutes == null ? null : Number(input.exerciseMinutes),
    skin: input.skin || '',
    hair: input.hair || '',
    selfCareDone: Boolean(input.selfCareDone),
    notes: String(input.notes || '').trim(),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
  return [entry, ...items.filter(item => item.date !== date)];
}

export function getSelfCareForDate(items = [], date) {
  return items.find(item => item.date === date) || null;
}
