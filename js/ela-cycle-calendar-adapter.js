/* ELA — adaptador do motor de insights para o calendário visual.
 * Lê somente o estado local já existente e não envia dados para serviços externos.
 */
(function () {
  'use strict';

  function uniq(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function collectPeriodStarts(state) {
    const s = state && typeof state === 'object' ? state : {};
    const starts = [];
    if (typeof s.lastPeriod === 'string') starts.push(s.lastPeriod);

    ['periodStarts', 'periodHistory', 'periods', 'cycles'].forEach(function (key) {
      const list = Array.isArray(s[key]) ? s[key] : [];
      list.forEach(function (item) {
        if (typeof item === 'string') starts.push(item);
        else if (item && typeof item === 'object') {
          starts.push(item.start || item.startDate || item.date || item.firstDay || '');
        }
      });
    });

    return uniq(starts);
  }

  function analyze(state) {
    if (!window.ELACycleInsights || typeof window.ELACycleInsights.analyze !== 'function') {
      return { ready: false, confidence: 'indisponível' };
    }
    const s = state && typeof state === 'object' ? state : {};
    return window.ELACycleInsights.analyze(collectPeriodStarts(s), s.cycleLength);
  }

  function inRange(date, range) {
    return !!(range && date >= range.start && date <= range.end);
  }

  function marksForDate(date, insight) {
    if (!insight || !insight.ready || typeof date !== 'string') return [];
    const marks = [];
    if (inRange(date, insight.fertileWindow)) marks.push('fertile');
    if (date === insight.ovulationEstimate) marks.push('ovulation');
    if (inRange(date, insight.pmsEstimate)) marks.push('tpm');
    return marks;
  }

  window.ELACycleCalendar = Object.freeze({ collectPeriodStarts, analyze, marksForDate });
})();
