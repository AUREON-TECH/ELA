/* ELA — padrões pessoais privados de bem-estar.
 * Analisa somente dados já registrados no aparelho. Não envia dados para serviços externos.
 * Correlações descritivas não são diagnóstico médico nem relação de causa e efeito.
 */
(function () {
  'use strict';

  const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0));
  const arr = value => Array.isArray(value) ? value : [];
  const norm = value => typeof value === 'string' ? value.trim() : '';

  function wellbeing(state) {
    return arr(state.wellbeing).length ? arr(state.wellbeing) : (arr(state.bemEstar).length ? arr(state.bemEstar) : arr(state.tpmCramps));
  }

  function byDate(items) {
    const map = new Map();
    arr(items).forEach(item => { if (item && /^\d{4}-\d{2}-\d{2}$/.test(item.date || '')) map.set(item.date, item); });
    return map;
  }

  function analyze(state) {
    state = state || {};
    const checks = arr(state.checkins).filter(x => x && /^\d{4}-\d{2}-\d{2}$/.test(x.date || ''));
    const wellbeingMap = byDate(wellbeing(state));
    const symptomCounts = new Map(), moodCounts = new Map();
    let energyTotal = 0, energyCount = 0, pmsTotal = 0, crampTotal = 0, bodyCount = 0;

    checks.forEach(c => {
      const energy = Number(c.energy);
      if (Number.isFinite(energy)) { energyTotal += clamp(energy, 0, 10); energyCount++; }
      const mood = norm(c.mood);
      if (mood) moodCounts.set(mood, (moodCounts.get(mood) || 0) + 1);
      arr(c.symptoms).forEach(s => { const v = norm(s); if (v) symptomCounts.set(v, (symptomCounts.get(v) || 0) + 1); });
    });

    wellbeingMap.forEach(w => {
      pmsTotal += clamp(w.pms ?? w.tpm, 0, 4);
      crampTotal += clamp(w.cramp ?? w.colica, 0, 4);
      bodyCount++;
    });

    const top = map => [...map.entries()].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0,3).map(([name,count]) => ({name,count}));
    const insights = [];
    if (energyCount >= 3) insights.push({ icon:'⚡', title:'Energia média', text:(energyTotal/energyCount).toFixed(1) + '/10 nos últimos registros.' });
    const symptoms = top(symptomCounts);
    if (symptoms.length && checks.length >= 3) insights.push({ icon:'🌿', title:'Sintomas mais registrados', text:symptoms.map(x => x.name + ' (' + x.count + ')').join(', ') + '.' });
    const moods = top(moodCounts);
    if (moods.length && checks.length >= 3) insights.push({ icon:'💗', title:'Humor mais frequente', text:moods[0].name + ' apareceu em ' + moods[0].count + ' check-in' + (moods[0].count === 1 ? '' : 's') + '.' });
    if (bodyCount >= 3) insights.push({ icon:'🌷', title:'TPM e cólicas', text:'Médias registradas: TPM ' + (pmsTotal/bodyCount).toFixed(1) + '/4 e cólica ' + (crampTotal/bodyCount).toFixed(1) + '/4.' });

    return Object.freeze({
      ready: checks.length >= 3 || bodyCount >= 3,
      checkinCount: checks.length,
      wellbeingCount: bodyCount,
      insights: Object.freeze(insights),
      disclaimer: 'São padrões dos seus próprios registros, não diagnóstico nem relação de causa e efeito.'
    });
  }

  window.ELAPersonalPatterns = Object.freeze({ analyze });
})();
