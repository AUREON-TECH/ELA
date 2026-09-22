/* ELA — preferência de signo usando a camada segura de armazenamento.
 * Migra o campo legado `signo` para `zodiac` sem apagar o estado anterior
 * quando o armazenamento estiver indisponível.
 */
(function () {
  'use strict';

  const VALID_SIGNS = Object.freeze([
    'Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
    'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'
  ]);

  function normalize(value) {
    return typeof value === 'string' && VALID_SIGNS.includes(value) ? value : '';
  }

  function storage() {
    return window.ELAStorageSafe && typeof window.ELAStorageSafe.read === 'function'
      ? window.ELAStorageSafe
      : null;
  }

  function read() {
    const safe = storage();
    if (!safe) return { zodiac: '', state: {}, migrated: false, ok: false };

    const state = safe.read();
    const current = normalize(state.zodiac);
    if (current) return { zodiac: current, state, migrated: false, ok: true };

    const legacy = normalize(state.signo);
    if (!legacy) return { zodiac: '', state, migrated: false, ok: true };

    const result = safe.update(function (next) {
      next.zodiac = legacy;
      delete next.signo;
    });

    return {
      zodiac: legacy,
      state: result.state,
      migrated: !!result.ok,
      ok: !!result.ok
    };
  }

  function save(value) {
    const zodiac = normalize(value);
    const safe = storage();
    if (!safe) return { ok: false, zodiac: '' };

    const result = safe.update(function (next) {
      if (zodiac) next.zodiac = zodiac;
      else delete next.zodiac;
      delete next.signo;
    });

    return { ok: !!result.ok, zodiac: result.ok ? zodiac : normalize(result.state.zodiac) };
  }

  window.ELAZodiacSafe = Object.freeze({ signs: VALID_SIGNS, normalize, read, save });
})();
