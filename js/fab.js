/** Bouton d'action flottant : ajouter un quiz / gérer mes quiz. */
(() => {
  const el = (t, o = {}, ...k) => { const e = Object.assign(document.createElement(t), o); e.append(...k); return e; };
  const btn = el('button', { className: 'fab', type: 'button', textContent: '+', title: 'Actions', 'aria-label': 'Actions sur les quiz', 'aria-expanded': 'false', 'aria-controls': 'fab-menu' });
  const menu = el('div', { className: 'fab-menu hidden', id: 'fab-menu' },
    el('a', { className: 'btn primary', href: 'add.html', textContent: 'Ajouter un quiz' }),
    el('a', { className: 'btn', href: 'manage.html', textContent: 'Gérer mes quiz' }));
  const wrap = el('div', { className: 'fab-wrap' }, menu, btn);
  const toggle = open => { btn.setAttribute('aria-expanded', open); menu.classList.toggle('hidden', !open); };
  btn.onclick = () => toggle(btn.getAttribute('aria-expanded') !== 'true');
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { toggle(false); btn.focus(); } });
  document.addEventListener('click', e => { if (!wrap.contains(e.target)) toggle(false); });
  document.body.append(wrap);
})();
