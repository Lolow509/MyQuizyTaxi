/** Session côté client : seul un jeton opaque est conservé (jamais le mot de passe). */
const Auth = (() => {
  const K = 'quiz_session', P = 'quiz_prefs';
  const get = () => { try { return JSON.parse(localStorage.getItem(K)); } catch { return null; } };
  const set = s => localStorage.setItem(K, JSON.stringify(s));
  /** Déconnexion : supprime la session ET les copies locales de données (clés « c_… »). */
  const clear = () => {
    localStorage.removeItem(K);
    Object.keys(localStorage).filter(k => k.startsWith('c_')).forEach(k => localStorage.removeItem(k));
  };
  const token = () => (get() || {}).token;
  function require() { if (!token()) { location.replace('index.html'); return false; } return true; }
  function prefs() { try { return Object.assign({ theme: 'light', animations: true, taille: 'normal' }, JSON.parse(localStorage.getItem(P))); } catch { return { theme: 'light', animations: true, taille: 'normal' }; } }
  function savePrefs(p) { localStorage.setItem(P, JSON.stringify(p)); applyPrefs(); }
  function applyPrefs() {
    const p = prefs(), d = document.documentElement;
    d.dataset.theme = p.theme; d.dataset.anim = p.animations ? 'on' : 'off'; d.dataset.size = p.taille;
  }
  applyPrefs();
  return { get, set, clear, token, require, prefs, savePrefs };
})();
