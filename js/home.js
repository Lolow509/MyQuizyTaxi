/** Page d'accueil : copie locale instantanée + rafraîchissement, recherche en temps réel. */
(async () => {
  if (!Auth.require()) return;
  const $ = id => document.getElementById(id), msg = $('msg'), list = $('list');
  const el = (t, o = {}, ...k) => { const e = Object.assign(document.createElement(t), o); e.append(...k); return e; };
  const hideLoader = () => document.getElementById('loader')?.remove();
  $('hello').textContent = `Bonjour ${(Auth.get().user || {}).nom || ''}`.trim();
  let quizzes = [], best = {};

  function render() {
    const term = $('q').value.trim().toLowerCase();
    const shown = quizzes.filter(q => String(q.nom).toLowerCase().includes(term));
    list.replaceChildren(...shown.map(q => el('article', { className: 'card quiz-card' },
      el('h3', { textContent: q.nom, style: 'margin:0' }), el('p', { className: 'muted', textContent: q.description || '' }),
      el('p', { textContent: `${q.nb_questions} question${q.nb_questions > 1 ? 's' : ''}` + (best[q.quiz_id] != null ? ` — meilleur score : ${best[q.quiz_id]} %` : '') }),
      q.nb_questions ? el('a', { className: 'btn primary', href: `quiz.html?id=${encodeURIComponent(q.quiz_id)}`, textContent: best[q.quiz_id] != null ? 'Reprendre' : 'Commencer' })
        : el('span', { className: 'muted', textContent: 'Aucune question pour le moment' }))));
    msg.className = 'muted';
    msg.textContent = shown.length ? '' : (term ? 'Aucun quiz ne correspond à votre recherche.' : 'Aucun quiz disponible.');
  }

  /** Appelée une fois avec la copie locale (si elle existe), puis avec les données fraîches. */
  function show(d) {
    quizzes = d.quizzes; const s = Scoring.stats(d.results); best = s.bestByQuiz;
    $('stats').replaceChildren(...[['Moyenne', s.moyenne != null ? s.moyenne + ' %' : '—'], ['Quiz terminés', s.quizTermines], ['Tentatives', s.tentatives]]
      .map(([l, v]) => el('div', { className: 'stat' }, el('b', { textContent: v }), l)));
    render(); hideLoader();
  }

  $('q').addEventListener('input', render);
  try { await Api.swr('home', Api.home, show); }
  catch (e) { if (!quizzes.length) { msg.className = 'error'; msg.textContent = 'Impossible de charger les quiz : ' + e.message; } }
  finally { hideLoader(); }
})();
