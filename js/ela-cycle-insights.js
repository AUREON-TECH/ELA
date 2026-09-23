/* ELA — motor local de insights de ciclo.
 * Calcula estimativas a partir do histórico salvo no aparelho.
 * Não envia dados, não diagnostica e não deve ser usado como contraceptivo.
 */
(function () {
  'use strict';

  const DAY = 86400000;
  const iso = /^\d{4}-\d{2}-\d{2}$/;

  function day(value) {
    if (typeof value !== 'string' || !iso.test(value)) return null;
    const d = new Date(value + 'T12:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function dateISO(d) {
    return d.toISOString().slice(0, 10);
  }

  function addDays(d, amount) {
    const next = new Date(d.getTime());
    next.setDate(next.getDate() + amount);
    return next;
  }

  function diffDays(a, b) {
    return Math.round((b.getTime() - a.getTime()) / DAY);
  }

  function median(values) {
    const list = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!list.length) return null;
    const m = Math.floor(list.length / 2);
    return list.length % 2 ? list[m] : Math.round((list[m - 1] + list[m]) / 2);
  }

  function normalizeStarts(values) {
    return Array.from(new Set((Array.isArray(values) ? values : [])
      .map(day).filter(Boolean).map(dateISO))).sort();
  }

  function analyze(starts, fallbackLength) {
    const dates = normalizeStarts(starts).map(day);
    const intervals = [];
    for (let i = 1; i < dates.length; i += 1) {
      const n = diffDays(dates[i - 1], dates[i]);
      if (n >= 15 && n <= 60) intervals.push(n);
    }

    const observed = median(intervals);
    const fallback = Math.max(21, Math.min(Number(fallbackLength) || 28, 40));
    const cycleLength = observed || fallback;
    const last = dates.length ? dates[dates.length - 1] : null;
    if (!last) return { ready: false, cycleLength, confidence: 'insuficiente' };

    const next = addDays(last, cycleLength);
    const ovulation = addDays(next, -14);
    const fertileStart = addDays(ovulation, -5);
    const fertileEnd = addDays(ovulation, 1);
    const pmsStart = addDays(next, -7);
    const confidence = intervals.length >= 3 ? 'melhor' : intervals.length ? 'limitada' : 'insuficiente';

    return {
      ready: true,
      cycleLength,
      confidence,
      lastPeriodStart: dateISO(last),
      nextPeriodEstimate: dateISO(next),
      fertileWindow: { start: dateISO(fertileStart), end: dateISO(fertileEnd) },
      ovulationEstimate: dateISO(ovulation),
      pmsEstimate: { start: dateISO(pmsStart), end: dateISO(addDays(next, -1)) },
      disclaimer: 'Estimativas de bem-estar baseadas no histórico. Não são diagnóstico nem método contraceptivo.'
    };
  }

  window.ELACycleInsights = Object.freeze({ analyze, normalizeStarts });
})();
