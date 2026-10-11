/** Création ou modification d'un quiz (add.html, ou add.html?id=… pour modifier). Chaque champ = une colonne de la feuille « Questions ». */
(async () => {
  if (!Auth.require()) return;
  const $ = id => document.getElementById(id), list = $('qlist'), err = $('err');
  const editId = new URLSearchParams(location.search).get('id');
  const el = (t, o = {}, ...k) => { const e = Object.assign(document.createElement(t), o); e.append(...k); return e; };
  const field = (label, ctrl, note) => el('div', {}, el('label', { textContent: label }), ctrl, note ? el('p', { className: 'sheetnote', textContent: note }) : '');
  const cards = [], saveLabel = editId ? 'Enregistrer les modifications' : 'Enregistrer dans Google Sheets';

  function addQuestion(d) {
    const type = el('select', {}, new Option('QCM', 'qcm'), new Option('Réponse libre', 'libre'));
    const enonce = el('textarea', { rows: 2 }), img = el('input', { type: 'text', placeholder: 'https://…' });
    const pts = el('input', { type: 'text', inputMode: 'numeric', value: '1' }), expl = el('textarea', { rows: 2 });
    const opts = el('div'), addOpt = el('button', { type: 'button', className: 'btn', textContent: '+ Proposition' });
    const newOpt = (text = '', ok = false) => { const row = el('div', { className: 'opt' }, el('input', { type: 'checkbox', checked: ok, 'aria-label': 'Bonne réponse' }),
      el('input', { type: 'text', value: text, placeholder: 'Proposition', 'aria-label': 'Texte de la proposition' }), el('button', { type: 'button', className: 'btn', textContent: '✕', 'aria-label': 'Supprimer la proposition', onclick: () => opts.children.length > 2 && row.remove() })); opts.append(row); };
    addOpt.onclick = () => newOpt();
    const qcm = el('div', {}, el('p', { className: 'muted', textContent: 'Cochez la ou les bonnes réponses.' }), opts, addOpt);
    const att = el('input', { type: 'text' }), corr = el('select', {}, new Option('Automatique', 'auto'), new Option('Manuelle (auto-évaluation)', 'manuelle'));
    const libre = el('div', { className: 'hidden' }, field('Réponse attendue', att, 'Plusieurs variantes acceptées : séparez-les par |'), field('Mode de correction', corr));
    type.onchange = () => { qcm.classList.toggle('hidden', type.value !== 'qcm'); libre.classList.toggle('hidden', type.value !== 'libre'); };
    if (d) { // pré-remplissage en mode modification
      type.value = d.type; enonce.value = d.enonce; img.value = d.image_url; pts.value = d.points; expl.value = d.explication;
      if (d.type === 'qcm') d.choix.forEach((c, i) => newOpt(c, d.bonnes.includes(i + 1))); else { att.value = d.reponse_attendue; corr.value = d.correction_type; }
      type.onchange();
    }
    if (!opts.children.length) { newOpt(); newOpt(); }
    const legend = el('legend'), del = el('button', { type: 'button', className: 'btn', textContent: 'Supprimer cette question' });
    const card = el('fieldset', { className: 'qcard' }, legend, field('Type', type), field('Énoncé', enonce), field('Image (URL, facultatif)', img), qcm, libre,
      el('div', { className: 'row2' }, field('Points', pts), field('Explication (facultatif)', expl)), el('p', {}, del));
    const entry = { legend, data: () => ({ type: type.value, enonce: enonce.value, image_url: img.value.trim(), points: pts.value, explication: expl.value,
      choix: [...opts.children].map(r => r.children[1].value), bonnes: [...opts.children].map((r, i) => r.children[0].checked ? i + 1 : 0).filter(Boolean),
      reponse_attendue: att.value, correction_type: corr.value }) };
    del.onclick = () => { if (cards.length > 1) { cards.splice(cards.indexOf(entry), 1); card.remove(); renumber(); } };
    cards.push(entry); list.append(card); renumber();
  }
  const renumber = () => cards.forEach((c, i) => c.legend.textContent = `Question ${i + 1}`);
  $('addQ').onclick = () => addQuestion();
  $('save').textContent = saveLabel;

  if (editId) {
    $('title').textContent = 'Modifier le quiz'; $('loader').classList.remove('hidden');
    try { const q = await Api.getQuiz(editId); $('nom').value = q.nom; $('desc').value = q.description || ''; q.questions.forEach(addQuestion); }
    catch (x) { err.textContent = 'Chargement impossible : ' + x.message; $('save').disabled = true; $('addQ').disabled = true; }
    finally { $('loader').classList.add('hidden'); }
  } else addQuestion();

  $('f').addEventListener('submit', async e => {
    e.preventDefault(); err.textContent = '';
    if (!$('nom').value.trim()) { err.textContent = 'Le nom du quiz est obligatoire.'; return; }
    const btn = $('save'); btn.disabled = true; btn.textContent = 'Enregistrement…'; $('loader').classList.remove('hidden');
    const payload = { nom: $('nom').value, description: $('desc').value, questions: cards.map(c => c.data()) };
    try {
      if (editId) await Api.updateQuiz(Object.assign(payload, { quiz_id: editId })); else await Api.createQuiz(payload);
      location.href = editId ? 'manage.html' : 'home.html';
    } catch (x) { err.textContent = x.message; $('loader').classList.add('hidden'); btn.disabled = false; btn.textContent = saveLabel; }
  });
})();
