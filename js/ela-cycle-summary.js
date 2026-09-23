/* ELA — resumo visual privado do ciclo.
 * Complementa o calendário com estimativas do ELACycleInsights.
 * Dados permanecem no aparelho; estimativas não são diagnóstico nem contraceptivo.
 */
(function () {
  'use strict';

  const LABELS = {
    melhor: 'boa base de histórico',
    limitada: 'histórico em formação',
    insuficiente: 'poucos dados',
    indisponível: 'indisponível'
  };

  function brDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '—';
    const d = new Date(value + 'T12:00:00');
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  function item(icon, title, value) {
    const box = document.createElement('div');
    box.className = 'ela-insight-item';
    const strong = document.createElement('strong');
    strong.textContent = icon + ' ' + title;
    const span = document.createElement('span');
    span.textContent = value;
    box.append(strong, span);
    return box;
  }

  function render(state, target) {
    if (!target || !window.ELACycleCalendar) return false;
    const insight = window.ELACycleCalendar.analyze(state || {});
    target.replaceChildren();

    const title = document.createElement('h3');
    title.textContent = 'Seu ciclo em perspectiva';
    target.appendChild(title);

    if (!insight.ready) {
      const p = document.createElement('p');
      p.className = 'empty';
      p.textContent = 'Registre o primeiro dia das menstruações para o ELA aprender seus padrões com mais contexto.';
      target.appendChild(p);
      return true;
    }

    const grid = document.createElement('div');
    grid.className = 'ela-insight-grid';
    grid.append(
      item('🩸', 'Próxima menstruação', brDate(insight.nextPeriodEstimate)),
      item('🌱', 'Janela fértil', brDate(insight.fertileWindow.start) + ' – ' + brDate(insight.fertileWindow.end)),
      item('✨', 'Ovulação estimada', brDate(insight.ovulationEstimate)),
      item('🌷', 'TPM estimada', brDate(insight.pmsEstimate.start) + ' – ' + brDate(insight.pmsEstimate.end))
    );
    target.appendChild(grid);

    const meta = document.createElement('p');
    meta.className = 'empty';
    meta.textContent = 'Ciclo típico: ' + insight.cycleLength + ' dias · Confiança: ' + (LABELS[insight.confidence] || insight.confidence) + '. ' + insight.disclaimer;
    target.appendChild(meta);
    return true;
  }

  window.ELACycleSummary = Object.freeze({ render, brDate });
})();
