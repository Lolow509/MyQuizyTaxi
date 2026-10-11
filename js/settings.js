/** Paramètres : profil, mot de passe, statistiques, préférences. */
(async () => {
  if (!Auth.require()) return;
  const $ = id => document.getElementById(id), flash = (t, bad) => { $('accMsg').textContent = t; $('accMsg').className = bad ? 'error' : ''; };
  const p = Auth.prefs(); $('theme').value = p.theme; $('size').value = p.taille; $('anim').checked = p.animations;
  const savePrefs = () => Auth.savePrefs({ theme: $('theme').value, taille: $('size').value, animations: $('anim').checked });
  ['theme', 'size', 'anim'].forEach(i => $(i).addEventListener('change', savePrefs));
  if (location.hash === '#tests') Scoring.runTests();
  try {
    const u = await Api.me(); $('mail').textContent = u.email; $('nom').value = u.nom || '';
    const s = Scoring.stats(await Api.results()), f = v => v == null ? '—' : v + ' %';
    $('stats').replaceChildren(...[['Moyenne (tentatives)', f(s.moyenne)], ['Moyenne (meilleurs par quiz)', f(s.moyenneMeilleurs)], ['Meilleure note', f(s.meilleure)], ['Dernière note', f(s.derniere)], ['Quiz terminés', s.quizTermines], ['Tentatives', s.tentatives]]
      .map(([l, v]) => { const d = document.createElement('div'); d.className = 'stat'; d.innerHTML = '<b></b><span></span>'; d.firstChild.textContent = v; d.lastChild.textContent = l; return d; }));
    $('spark').replaceChildren(...s.evolution.map(v => { const i = document.createElement('i'); i.style.height = Math.max(4, v / 2) + 'px'; i.title = v + ' %'; return i; }));
  } catch (e) { flash('Chargement impossible : ' + e.message, true); }
  finally { $('loader').remove(); }
  $('saveNom').onclick = async () => { try { await Api.updateProfile($('nom').value); const s = Auth.get(); s.user.nom = $('nom').value; Auth.set(s); flash('Nom enregistré.'); } catch (e) { flash(e.message, true); } };
  $('savePw').onclick = async () => { try { await Api.changePassword($('old').value, $('new').value); $('old').value = $('new').value = ''; flash('Mot de passe modifié.'); } catch (e) { flash(e.message, true); } };
  $('out').onclick = async () => { await Api.logout(); Auth.clear(); location.replace('index.html'); };
})();
