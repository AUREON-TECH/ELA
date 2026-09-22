(function (global) {
  'use strict';

  function appendParagraph(container, parts) {
    var p = document.createElement('p');
    parts.forEach(function (part) {
      if (part && part.bold) {
        var strong = document.createElement('strong');
        strong.textContent = String(part.text == null ? '' : part.text);
        p.appendChild(strong);
      } else {
        p.appendChild(document.createTextNode(String(part && part.text != null ? part.text : '')));
      }
    });
    container.appendChild(p);
  }

  function safeEnergy(value) {
    var n = Number(value);
    if (!Number.isFinite(n)) return '—';
    return Math.min(10, Math.max(1, Math.round(n)));
  }

  function safeSymptoms(value) {
    if (!Array.isArray(value)) return [];
    return value
      .filter(function (item) { return typeof item === 'string'; })
      .map(function (item) { return item.trim(); })
      .filter(Boolean)
      .slice(0, 20);
  }

  function renderHistorySafe(container, state) {
    if (!container) return;
    container.replaceChildren();

    var checkins = Array.isArray(state && state.checkins) ? state.checkins.slice(0, 5) : [];
    var notes = Array.isArray(state && state.notes) ? state.notes.slice(0, 3) : [];

    checkins.forEach(function (entry) {
      entry = entry && typeof entry === 'object' ? entry : {};
      var symptoms = safeSymptoms(entry.symptoms);
      var energy = safeEnergy(entry.energy);
      appendParagraph(container, [
        { text: entry.date || '—', bold: true },
        { text: ' · ' + (entry.mood || '—') + ' · Energia ' + energy + '/10' + (symptoms.length ? ' · ' + symptoms.join(', ') : '') }
      ]);
    });

    notes.forEach(function (entry) {
      entry = entry && typeof entry === 'object' ? entry : {};
      var date = new Date(entry.date);
      var label = Number.isNaN(date.getTime()) ? 'data não informada' : date.toLocaleDateString('pt-BR');
      appendParagraph(container, [
        { text: '✍️ ' + label + ' · ' + (entry.text || '') }
      ]);
    });

    if (!checkins.length && !notes.length) {
      container.textContent = 'Nenhum registro ainda.';
    }
  }

  global.ELAHistorySafe = Object.freeze({ renderHistorySafe: renderHistorySafe });
})(window);
