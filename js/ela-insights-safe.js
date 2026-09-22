/* ELA — renderização segura para Insights/Meus padrões.
 * Use estas funções para qualquer valor vindo de check-ins/localStorage/Supabase.
 * Nenhuma função interpreta HTML fornecido pela usuária.
 */
(function () {
  'use strict';

  function clear(el) {
    if (!el) return null;
    while (el.firstChild) el.removeChild(el.firstChild);
    return el;
  }

  function text(el, value) {
    if (!el) return null;
    el.textContent = value == null ? '' : String(value);
    return el;
  }

  function appendText(parent, value) {
    if (!parent) return null;
    parent.appendChild(document.createTextNode(value == null ? '' : String(value)));
    return parent;
  }

  function line(parent, parts, className) {
    if (!parent) return null;
    const el = document.createElement('div');
    if (className) el.className = className;
    (parts || []).forEach(function (part) {
      if (part && typeof part === 'object' && part.strong) {
        const b = document.createElement('b');
        b.textContent = String(part.strong);
        el.appendChild(b);
      } else {
        appendText(el, part);
      }
    });
    parent.appendChild(el);
    return el;
  }

  function symptom(parent, name, count, total) {
    if (!parent) return null;
    const p = document.createElement('p');
    const b = document.createElement('b');
    b.textContent = String(name == null ? '' : name);
    p.appendChild(b);
    appendText(p, ' · ' + Number(count || 0) + 'x');
    parent.appendChild(p);

    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('i');
    const denominator = Math.max(1, Number(total || 0));
    const pct = Math.max(0, Math.min(100, Number(count || 0) / denominator * 100));
    fill.style.width = pct + '%';
    bar.appendChild(fill);
    parent.appendChild(bar);
    return bar;
  }

  window.ELAInsightsSafe = Object.freeze({ clear, text, appendText, line, symptom });
})();
