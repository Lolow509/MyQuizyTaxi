/** Déroulement du quiz : une question à la fois, correction côté serveur, score recalculé côté serveur. */
(async () => {
  if (!Auth.require()) return;
  const $ = id => document.getElementById(id), app = $('app'), msg = $('msg');
  const el = (t, o = {}, ...k) => { const e = Object.assign(document.createElement(t), o); e.append(...k); return e; };
  const quizId = new URLSearchParams(location.search).get('id');
  const attemptId = crypto.randomUUID(), t0 = Date.now();
  let qs = [], i = 0, locked = false, finishing = false, answers = [], good = 0, inProgress = false;
  window.addEventListener('beforeunload', e => { if (inProgress) { e.preventDefault(); e.returnValue = ''; } });
  const valid = q => q.question_id && q.enonce && (q.type === 'libre' || (q.type === 'qcm' && q.choix.length >= 2));

  try { qs = (await Api.questions(quizId)).filter(valid); } catch (e) { msg.className = 'error'; msg.textContent = 'Chargement impossible : ' + e.message; return; }
  finally { $('loader').remove(); }
  if (!qs.length) { msg.textContent = 'Ce quiz ne contient aucune question valide.'; return; }
  msg.textContent = ''; inProgress = true; show();

  function show() {
    locked = false; const q = qs[i], inputs = [];
    const box = el('div', { className: 'card' });
    box.append(el('p', { className: 'muted', textContent: `Question ${i + 1} sur ${qs.length}` + (i ? ` — ${good} bonne(s) réponse(s)` : '') }),
      el('div', { className: 'progress', role: 'progressbar', 'aria-valuenow': i, 'aria-valuemax': qs.length }, el('div', { style: `width:${100 * i / qs.length}%` })));
    if (q.image_url) box.append(el('img', { className: 'q-img', src: q.image_url, alt: 'Illustration de la question', loading: 'lazy', onerror() { this.remove(); } }));
    box.append(el('h1', { textContent: q.enonce, style: 'font-size:1.3rem' }));
    const form = el('div'); box.append(form);
    if (q.type === 'qcm') {
      form.append(el('p', { className: 'muted', textContent: q.multiple ? 'Plusieurs réponses possibles.' : 'Une seule réponse.' }));
      q.choix.forEach((c, k) => { const inp = el('input', { type: q.multiple ? 'checkbox' : 'radio', name: 'c', value: k + 1 }); inputs.push(inp); form.append(el('label', { className: 'choice' }, inp, c)); });
    } else { form.append(el('label', { htmlFor: 'ans', textContent: 'Votre réponse' }), el('textarea', { id: 'ans', rows: 4 })); }
    const fb = el('div', { role: 'status' }), act = el('div', { className: 'actions' });
    const ok = el('button', { className: 'btn primary', textContent: 'Valider' }), next = el('button', { className: 'btn primary hidden', textContent: i + 1 < qs.length ? 'Question suivante' : 'Voir le résultat' });
    act.append(ok, next); box.append(fb, act); app.replaceChildren(box);

    const record = (answer, self_ok, correct) => { answers.push({ question_id: q.question_id, answer, self_ok }); if (correct) good++; };
    const reveal = () => { ok.classList.add('hidden'); next.classList.remove('hidden'); next.focus(); };
    next.onclick = () => { if (++i < qs.length) show(); else end(); };
    ok.onclick = async () => {
      if (locked) return;
      const answer = q.type === 'qcm' ? inputs.filter(x => x.checked).map(x => Number(x.value)) : $('ans').value.trim();
      if (!answer.length) { fb.className = 'feedback ko'; fb.textContent = 'Répondez avant de valider.'; return; }
      locked = true; ok.disabled = true; form.querySelectorAll('input,textarea').forEach(x => x.disabled = true);
      try {
        const r = await Api.grade(q.question_id, answer);
        const detail = [el('p', { textContent: 'Réponse attendue : ' + r.attendue }), r.explication ? el('p', { textContent: r.explication }) : ''];
        if (r.manual) {
          fb.className = 'feedback'; fb.replaceChildren(el('strong', { textContent: 'Correction à faire vous-même.' }), ...detail, el('p', { textContent: 'Votre réponse était-elle correcte ?' }));
          const y = el('button', { className: 'btn', textContent: 'Oui' }), n = el('button', { className: 'btn', textContent: 'Non' });
          [y, n].forEach(b => b.onclick = () => { if (y.disabled) return; y.disabled = n.disabled = true; record(answer, b === y, b === y); fb.className = 'feedback ' + (b === y ? 'ok' : 'ko'); reveal(); });
          fb.append(y, ' ', n);
        } else {
          record(answer, false, r.correct);
          if (q.type === 'qcm') { const exp = new Set(); inputs.forEach(x => x.closest('label').classList.add(x.checked ? (r.correct ? 'correct' : 'wrong') : 'x')); }
          fb.className = 'feedback ' + (r.correct ? 'ok' : 'ko');
          fb.replaceChildren(el('strong', { textContent: r.correct ? 'Bonne réponse' : 'Réponse incorrecte' }), ...detail); reveal();
        }
      } catch (e) { locked = false; ok.disabled = false; form.querySelectorAll('input,textarea').forEach(x => x.disabled = false); fb.className = 'feedback ko'; fb.textContent = 'Erreur : ' + e.message; }
    };
  }

  async function end() {
    if (finishing) return; finishing = true;
    app.replaceChildren(el('p', { className: 'muted', textContent: 'Enregistrement du résultat…' }));
    try {
      const r = await Api.finish({ quiz_id: quizId, attempt_id: attemptId, answers, duree: Math.round((Date.now() - t0) / 1000) });
      inProgress = false;
      app.replaceChildren(el('div', { className: 'card' }, el('h1', { textContent: 'Quiz terminé' }),
        el('p', { className: 'big', textContent: `${r.score_obtenu}/${r.score_max}` }),
        el('p', { textContent: `Réussite : ${r.pourcentage} %` }), el('p', { textContent: `Bonnes réponses : ${good} sur ${qs.length}` }),
        el('p', { textContent: `Temps : ${Scoring.duration(r.duree_secondes)}` }),
        el('div', { className: 'actions' }, el('a', { className: 'btn primary', href: 'home.html', textContent: "Retour à l'accueil" }), el('a', { className: 'btn', href: location.href, textContent: 'Recommencer' }))));
    } catch (e) {
      finishing = false;
      const b = el('button', { className: 'btn primary', textContent: 'Réessayer l\u2019enregistrement', onclick: end });
      app.replaceChildren(el('p', { className: 'error', textContent: 'Résultat non enregistré : ' + e.message }), b);
    }
  }
})();
