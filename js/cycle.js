const DAY_MS = 86400000;

export function getPhaseForDay(day, cycleLength = 28, periodLength = 5) {
  if (!day || day < 1) return '';
  const len = Number(cycleLength) || 28;
  const period = Number(periodLength) || 5;
  const ovulationDay = Math.max(1, len - 14);
  const fertileStart = Math.max(1, ovulationDay - 5);
  const fertileEnd = Math.min(len, ovulationDay + 1);

  if (day <= period) return 'Menstrual';
  if (day < fertileStart) return 'Folicular';
  if (day <= fertileEnd) return 'Fértil';
  if (day < len - 4) return 'Lútea';
  return 'Pré-menstrual';
}

export function getCycleInfo(state = {}, date = new Date()) {
  if (!state.lastPeriod) return null;
  const cycleLength = Number(state.cycleLength) || 28;
  const periodLength = Number(state.periodLength) || 5;
  const start = new Date(`${state.lastPeriod}T12:00:00`);
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const elapsed = Math.floor((current - start) / DAY_MS);
  if (elapsed < 0) return null;

  const completedCycles = Math.floor(elapsed / cycleLength);
  const day = (elapsed % cycleLength) + 1;
  const ovulationDay = Math.max(1, cycleLength - 14);
  const fertileStart = Math.max(1, ovulationDay - 5);
  const fertileEnd = Math.min(cycleLength, ovulationDay + 1);
  const nextPeriod = new Date(start);
  nextPeriod.setDate(start.getDate() + ((completedCycles + 1) * cycleLength));

  return {
    day,
    phase: getPhaseForDay(day, cycleLength, periodLength),
    cycleLength,
    periodLength,
    ovulationDay,
    fertileStart,
    fertileEnd,
    nextPeriod
  };
}

export function getCycleDay(state = {}, date = new Date()) {
  const info = getCycleInfo(state, date);
  return info ? info.day : null;
}
