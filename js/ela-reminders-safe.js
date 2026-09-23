/* ELA — preferências de lembretes usando armazenamento defensivo. */
(function () {
  'use strict';

  const DEFAULT_TIME = '20:00';

  function storage() {
    return window.ELAStorageSafe && typeof window.ELAStorageSafe.read === 'function'
      ? window.ELAStorageSafe
      : null;
  }

  function validTime(value) {
    return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
      ? value
      : DEFAULT_TIME;
  }

  function normalize(raw) {
    const value = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    return {
      checkin: value.checkin === true,
      cycle: value.cycle === true,
      wellbeing: value.wellbeing === true,
      agenda: value.agenda === true,
      time: validTime(value.time)
    };
  }

  function read() {
    const safe = storage();
    if (!safe) return { ok: false, reminders: normalize({}) };
    const state = safe.read();
    return { ok: true, reminders: normalize(state.reminders) };
  }

  function save(reminders) {
    const safe = storage();
    const clean = normalize(reminders);
    if (!safe) return { ok: false, reminders: clean };

    const result = safe.update(function (next) {
      next.reminders = clean;
    });

    return {
      ok: !!result.ok,
      reminders: result.ok ? clean : normalize(result.state && result.state.reminders)
    };
  }

  window.ELARemindersSafe = Object.freeze({ read, save, normalize, validTime });
})();
