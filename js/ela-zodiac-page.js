/* ELA — integração da tela Signo do dia com armazenamento seguro.
 * Carregar depois de ela-storage-safe.js e ela-zodiac-safe.js.
 * Não envia dados para serviços externos.
 */
(function () {
  'use strict';

  function init() {
    const zodiac = window.ELAZodiacSafe;
    const select = document.getElementById('signo');
    const saveButton = document.getElementById('save');
    if (!zodiac || !select || !saveButton) return false;

    const current = zodiac.read();
    select.value = current.zodiac || '';

    // Compatibilidade com a implementação atual da página: quando existir um
    // estado global mutável, mantém a renderização sincronizada sem duplicar dados.
    function syncLegacyView(value) {
      try {
        if (typeof state === 'object' && state) {
          state.zodiac = value || '';
          delete state.signo;
        }
        if (typeof render === 'function') render();
      } catch (_) {}
    }

    syncLegacyView(current.zodiac);

    saveButton.onclick = function () {
      const result = zodiac.save(select.value);
      if (!result.ok) {
        select.value = result.zodiac || '';
        saveButton.setAttribute('aria-label', 'Não foi possível salvar o signo neste aparelho');
        syncLegacyView(result.zodiac);
        return;
      }
      saveButton.removeAttribute('aria-label');
      syncLegacyView(result.zodiac);
    };

    return true;
  }

  window.ELAZodiacPage = Object.freeze({ init });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
