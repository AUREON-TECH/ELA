/* ELA — acesso defensivo ao estado local.
 * Evita que JSON corrompido ou falhas do armazenamento derrubem telas do app.
 * Mantém uma cópia local de recuperação antes de sobrescrever o estado atual.
 * Não envia nem sincroniza dados.
 */
(function () {
  'use strict';

  const KEYS = Object.freeze(['ela-pwa-v2', 'ela-pwa-v1']);
  const CURRENT_KEY = KEYS[0];
  const BACKUP_KEY = CURRENT_KEY + '-backup';

  function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function parseObject(raw) {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return isObject(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function read() {
    for (const key of KEYS) {
      let raw = '';
      try { raw = localStorage.getItem(key) || ''; } catch (_) { return {}; }
      const parsed = parseObject(raw);
      if (parsed) return parsed;
      // Se o estado atual estiver corrompido, preserva-o e tenta outras fontes.
    }

    // Último recurso: cópia local criada antes da gravação mais recente.
    try {
      return parseObject(localStorage.getItem(BACKUP_KEY) || '') || {};
    } catch (_) {
      return {};
    }
  }

  function write(state) {
    if (!isObject(state)) return false;
    try {
      const previous = localStorage.getItem(CURRENT_KEY);
      // Só cria backup quando o estado anterior é JSON válido; nunca substitui um
      // backup recuperável por conteúdo corrompido.
      if (parseObject(previous)) localStorage.setItem(BACKUP_KEY, previous);
      localStorage.setItem(CURRENT_KEY, JSON.stringify(state));
      return true;
    } catch (_) {
      // Mantém o app utilizável em modo privado, quota cheia ou storage bloqueado.
      return false;
    }
  }

  function cloneState(state) {
    try {
      const cloned = JSON.parse(JSON.stringify(state));
      return isObject(cloned) ? cloned : {};
    } catch (_) {
      return {};
    }
  }

  // Atualiza o estado em uma única operação: lê a fonte recuperável mais recente,
  // trabalha sobre uma cópia e só então persiste. Se a função de atualização falhar,
  // o estado anterior permanece intacto.
  function update(mutator) {
    if (typeof mutator !== 'function') return { ok: false, state: read() };
    const current = read();
    const next = cloneState(current);
    try {
      const result = mutator(next);
      const candidate = isObject(result) ? result : next;
      if (!write(candidate)) return { ok: false, state: current };
      return { ok: true, state: candidate };
    } catch (_) {
      return { ok: false, state: current };
    }
  }

  function list(state, name, limit) {
    const source = isObject(state) && Array.isArray(state[name]) ? state[name] : [];
    const max = Math.max(0, Math.min(Number(limit) || 30, 100));
    return source.filter(isObject).slice(0, max);
  }

  window.ELAStorageSafe = Object.freeze({ read, write, update, list });
})();
