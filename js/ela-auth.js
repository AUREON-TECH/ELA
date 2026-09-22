/* ELA — adaptador de autenticação Supabase/Google
 * Não contém credenciais. Só inicializa quando a página fornece
 * <meta name="ela-supabase-url"> e <meta name="ela-supabase-anon-key">.
 * Requer @supabase/supabase-js carregado como window.supabase.
 */
(function () {
  'use strict';

  const state = { client: null, session: null, configured: false };

  function meta(name) {
    const el = document.querySelector('meta[name="' + name + '"]');
    return el ? String(el.content || '').trim() : '';
  }

  function config() {
    return {
      url: meta('ela-supabase-url'),
      anonKey: meta('ela-supabase-anon-key')
    };
  }

  function isConfigured() {
    const c = config();
    return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(c.url) && c.anonKey.length > 20;
  }

  async function init() {
    if (state.client) return state;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      return state;
    }
    if (!isConfigured()) return state;

    const c = config();
    state.client = window.supabase.createClient(c.url, c.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    state.configured = true;

    const result = await state.client.auth.getSession();
    state.session = result && result.data ? result.data.session : null;
    state.client.auth.onAuthStateChange(function (_event, session) {
      state.session = session || null;
      window.dispatchEvent(new CustomEvent('ela:auth-change', {
        detail: { signedIn: !!state.session, user: state.session ? state.session.user : null }
      }));
    });
    return state;
  }

  function accountReturnUrl() {
    const base = location.href.split('#')[0].split('?')[0];
    return base.endsWith('conta.html') ? base : new URL('./conta.html', base).href;
  }

  async function signInWithGoogle() {
    await init();
    if (!state.client) throw new Error('ELA_AUTH_NOT_CONFIGURED');
    return state.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: accountReturnUrl() }
    });
  }

  async function signOut() {
    await init();
    if (!state.client) return;
    await state.client.auth.signOut();
  }

  async function currentUser() {
    await init();
    return state.session ? state.session.user : null;
  }

  window.ELAAuth = Object.freeze({ init, isConfigured, signInWithGoogle, signOut, currentUser });
})();
