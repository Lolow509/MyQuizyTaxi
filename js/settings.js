/** Paramètres : profil, mot de passe, statistiques, préférences. */
(async () => {
  if (!Auth.require()) return;
  const $ = id => document.getElementById(id);
  const flash = (t, bad) => { $('accMsg').textContent = t; $('accMsg').className = bad ? 'error' : ''; };
  const hideLoader = () => document.getElementById('loader')?.remove();

  // Préférences d'affichage (locales)
  const p = Auth.prefs(); $('theme').value = p.theme; $('size').value = p.taille; $('anim').checked = p.animations;
  const savePrefs = () => Auth.savePrefs({ theme: $('theme').value, taille: $('size').value, animations: $('anim').checked });
  ['theme', 'size', 'anim'].forEach(i => $(i).addEventListener('change', savePrefs));
  if (location.hash === '#tests') Scoring.runTests();

  /** Appelée avec la copie locale (si elle existe), puis avec les données fraîches. */
  function show(d) {
    $('mail').textContent = d.user.email;
    if (document.activeElement !== $('nom')) $('nom').value = d.user.nom || '';
    const s = Scoring.stats(d.results), f = v => v == null ? '—' : v + ' %';
    $('stats').replaceChildren(...[['Moyenne (tentatives)', f(s.moyenne)], ['Moyenne (meilleurs par quiz)', f(s.moyenneMeilleurs)], ['Meilleure note', f(s.meilleure)], ['Dernière note', f(s.derniere)], ['Quiz terminés', s.quizTermines], ['Tentatives', s.tentatives]]
      .map(([l, v]) => { const div = document.createElement('div'); div.className = 'stat'; div.innerHTML = '<b></b><span></span>'; div.firstChild.textContent = v; div.lastChild.textContent = l; return div; }));
    $('spark').replaceChildren(...s.evolution.map(v => { const i = document.createElement('i'); i.style.height = Math.max(4, v / 2) + 'px'; i.title = v + ' %'; return i; }));
    hideLoader();
  }
  try { await Api.swr('home', Api.home, show); }
  catch (e) { flash('Chargement impossible : ' + e.message, true); }
  finally { hideLoader(); }

  $('saveNom').onclick = async () => {
    try { await Api.updateProfile($('nom').value); const s = Auth.get(); s.user.nom = $('nom').value; Auth.set(s); flash('Nom enregistré.'); }
    catch (e) { flash(e.message, true); }
  };
  $('savePw').onclick = async () => {
    try { await Api.changePassword($('old').value, $('new').value); $('old').value = $('new').value = ''; flash('Mot de passe modifié.'); }
    catch (e) { flash(e.message, true); }
  };
  $('out').onclick = async () => { await Api.logout(); Auth.clear(); location.replace('index.html'); };
})();
