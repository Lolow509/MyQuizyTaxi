/** Page d'accueil : chargement dynamique et recherche en temps réel. */
(async () => {
  if (!Auth.require()) return;
  const $ = id => document.getElementById(id), msg = $('msg'), list = $('list');
  const el = (t, o = {}, ...k) => { const e = Object.assign(document.createElement(t), o); e.append(...k); return e; };
  $('hello').textContent = `Bonjour ${(Auth.get().user || {}).nom || ''}`.trim();
  let quizzes = [], best = {};
  function render() {
    const term = $('q').value.trim().toLowerCase();
    const shown = quizzes.filter(q => q.nom.toLowerCase().includes(term));
    list.replaceChildren(...shown.map(q => el('article', { className: 'card quiz-card' },
      el('h3', { textContent: q.nom, style: 'margin:0' }), el('p', { className: 'muted', textContent: q.description || '' }),
      el('p', { textContent: `${q.nb_questions} question${q.nb_questions > 1 ? 's' : ''}` + (best[q.quiz_id] != null ? ` — meilleur score : ${best[q.quiz_id]} %` : '') }),
      q.nb_questions ? el('a', { className: 'btn primary', href: `quiz.html?id=${encodeURIComponent(q.quiz_id)}`, textContent: best[q.quiz_id] != null ? 'Reprendre' : 'Commencer' })
        : el('span', { className: 'muted', textContent: 'Aucune question pour le moment' }))));
    msg.textContent = shown.length ? '' : (term ? 'Aucun quiz ne correspond à votre recherche.' : 'Aucun quiz disponible.');
  }
  try {
    const [qs, rs] = await Promise.all([Api.quizzes(), Api.results()]);
    quizzes = qs; const s = Scoring.stats(rs); best = s.bestByQuiz;
    $('stats').replaceChildren(...[['Moyenne', s.moyenne != null ? s.moyenne + ' %' : '—'], ['Quiz terminés', s.quizTermines], ['Tentatives', s.tentatives]]
      .map(([l, v]) => el('div', { className: 'stat' }, el('b', { textContent: v }), l)));
    render(); $('q').addEventListener('input', render);
  } catch (e) { msg.className = 'error'; msg.textContent = 'Impossible de charger les quiz : ' + e.message; }
  finally { $('loader').remove(); }
})();
