/** Gestion des quiz créés par l'utilisateur : modifier, activer/désactiver, supprimer. */
(async () => {
  if (!Auth.require()) return;
  const $ = id => document.getElementById(id), msg = $('msg'), list = $('list');
  const el = (t, o = {}, ...k) => { const e = Object.assign(document.createElement(t), o); e.append(...k); return e; };
  let quizzes = [];
  function render() {
    list.replaceChildren(...quizzes.map(q => {
      const toggle = el('button', { className: 'btn', textContent: q.actif ? 'Désactiver' : 'Activer' });
      const del = el('button', { className: 'btn danger', textContent: 'Supprimer' });
      const all = [toggle, del];
      const run = async fn => { all.forEach(b => b.disabled = true); msg.className = 'muted'; msg.textContent = ''; try { await fn(); } catch (e) { msg.className = 'error'; msg.textContent = e.message; } render(); };
      toggle.onclick = () => run(async () => { await Api.toggleQuiz(q.quiz_id, !q.actif); q.actif = !q.actif; });
      del.onclick = () => { if (confirm(`Supprimer « ${q.nom} » et ses questions ? Cette action est définitive.`)) run(async () => { await Api.deleteQuiz(q.quiz_id); quizzes = quizzes.filter(x => x !== q); }); };
      return el('article', { className: 'card quiz-card' },
        el('h3', { textContent: q.nom, style: 'margin:0' }),
        el('span', { className: 'badge ' + (q.actif ? 'on' : 'off'), textContent: q.actif ? 'Actif' : 'Désactivé' }),
        el('p', { className: 'muted', textContent: q.description || '' }),
        el('p', { textContent: `${q.nb_questions} question${q.nb_questions > 1 ? 's' : ''}` }),
        el('div', { className: 'mrow' }, el('a', { className: 'btn primary', href: `add.html?id=${encodeURIComponent(q.quiz_id)}`, textContent: 'Modifier' }), toggle, del));
    }));
    msg.textContent = quizzes.length ? msg.textContent : "Vous n'avez pas encore créé de quiz. Utilisez le bouton + pour en ajouter un.";
  }
  try { quizzes = await Api.myQuizzes(); render(); }
  catch (e) { msg.className = 'error'; msg.textContent = 'Impossible de charger vos quiz : ' + e.message; }
  finally { $('loader').remove(); }
})();
