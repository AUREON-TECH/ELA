function topValue(values = []) {
  if (!values.length) return null;
  const counts = values.reduce((acc, value) => {
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

export function buildInsights(state = {}) {
  const checkins = Array.isArray(state.checkins) ? state.checkins.filter(Boolean) : [];
  if (checkins.length < 3) return [];
  const recent = checkins.slice(0, 14);
  const insights = [];

  const energyValues = recent.map(x => Number(x.energy)).filter(Number.isFinite);
  if (energyValues.length >= 3) {
    const avg = energyValues.reduce((sum, value) => sum + value, 0) / energyValues.length;
    insights.push({ title:'Energia', text:`Nos seus registros recentes, sua energia média foi ${avg.toFixed(1)}/10.`, kind:'energy' });
  }

  const mood = topValue(recent.map(x => x.mood));
  if (mood) insights.push({ title:'Humor', text:`Nos seus registros recentes, o humor mais frequente foi ${mood}.`, kind:'mood' });

  const symptoms = recent.flatMap(x => Array.isArray(x.symptoms) ? x.symptoms : []);
  const symptom = topValue(symptoms);
  if (symptom) insights.push({ title:'Sintomas', text:`Nos seus registros recentes, o sintoma mais registrado foi ${symptom}.`, kind:'symptom' });

  const cramps = recent.map(x => Number(x.crampIntensity)).filter(Number.isFinite);
  if (cramps.length >= 3) {
    const avg = cramps.reduce((sum, value) => sum + value, 0) / cramps.length;
    insights.push({ title:'Cólica', text:`Nos registros com cólica, a intensidade média recente ficou em ${avg.toFixed(1)}/10.`, kind:'cramp' });
  }

  const sleeps = recent.map(x => Number(x.sleepHours)).filter(value => Number.isFinite(value) && value > 0);
  if (sleeps.length >= 3) {
    const avg = sleeps.reduce((sum, value) => sum + value, 0) / sleeps.length;
    insights.push({ title:'Sono', text:`Nos seus registros recentes, o sono médio ficou em ${avg.toFixed(1)} horas.`, kind:'sleep' });
  }

  const selfCare = Array.isArray(state.selfCare) ? state.selfCare.slice(0, 14) : [];
  const done = selfCare.filter(x => x?.selfCareDone).length;
  if (selfCare.length >= 3) {
    insights.push({ title:'Autocuidado', text:`Nos seus registros recentes, você marcou autocuidado em ${done} de ${selfCare.length} dias registrados.`, kind:'selfCare' });
  }

  return insights;
}
