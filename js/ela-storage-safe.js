/* ELA — leitura defensiva do estado local.
 * Evita que JSON corrompido no localStorage derrube telas do app.
 * Não envia nem sincroniza dados.
 */
(function () {
  'use strict';

  const KEYS = Object.freeze(['ela-pwa-v2', 'ela-pwa-v1']);

  function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function read() {
    for (const key of KEYS) {
      let raw = '';
      try { raw = localStorage.getItem(key) || ''; } catch (_) { return {}; }
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (isObject(parsed)) return parsed;
      } catch (_) {
        // Tenta a versão anterior sem apagar o dado inválido.
      }
    }
    return {};
  }

  function list(state, name, limit) {
    const source = isObject(state) && Array.isArray(state[name]) ? state[name] : [];
    const max = Math.max(0, Math.min(Number(limit) || 30, 100));
    return source.filter(isObject).slice(0, max);
  }

  window.ELAStorageSafe = Object.freeze({ read, list });
})();
