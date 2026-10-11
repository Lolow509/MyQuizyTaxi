/** Calculs de scores et statistiques. Moyenne = moyenne arithmétique des pourcentages de TOUTES les tentatives terminées. */
const Scoring = (() => {
  const done = rs => rs.filter(r => r.statut === 'Terminé');
  const avg = a => a.length ? Math.round(10 * a.reduce((s, x) => s + x, 0) / a.length) / 10 : null;
  function bestByQuiz(rs) {
    const m = {}; done(rs).forEach(r => { m[r.quiz_id] = Math.max(m[r.quiz_id] ?? 0, Number(r.pourcentage)); }); return m;
  }
  function stats(rs) {
    const d = done(rs).sort((a, b) => new Date(a.date) - new Date(b.date)), pct = d.map(r => Number(r.pourcentage)), best = bestByQuiz(d);
    return {
      moyenne: avg(pct),                                 // moyenne des tentatives
      moyenneMeilleurs: avg(Object.values(best)),        // moyenne des meilleurs scores par quiz (distincte)
      meilleure: pct.length ? Math.max(...pct) : null, derniere: pct.length ? pct[pct.length - 1] : null,
      quizTermines: Object.keys(best).length, tentatives: d.length, evolution: pct.slice(-10), bestByQuiz: best
    };
  }
  const percent = (got, max) => max ? Math.round(1000 * got / max) / 10 : 0;
  const duration = s => `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
  /** Tests : Scoring.runTests() dans la console (ou settings.html#tests). */
  function runTests() {
    const eq = (a, b, n) => console.assert(JSON.stringify(a) === JSON.stringify(b), `ÉCHEC ${n}:`, a, b);
    eq(percent(16, 20), 80, 'pourcentage'); eq(duration(755), '12 min 35 s', 'durée');
    const rs = [{ quiz_id: 'a', pourcentage: 50, statut: 'Terminé', date: '2026-01-01' }, { quiz_id: 'a', pourcentage: 100, statut: 'Terminé', date: '2026-01-02' }, { quiz_id: 'b', pourcentage: 60, statut: 'Terminé', date: '2026-01-03' }];
    const s = stats(rs); eq(s.moyenne, 70, 'moyenne tentatives'); eq(s.moyenneMeilleurs, 80, 'moyenne meilleurs');
    eq(s.quizTermines, 2, 'quiz terminés'); eq(stats([]).moyenne, null, 'aucune tentative');
    console.log('Tests scoring terminés');
  }
  return { stats, percent, duration, runTests };
})();
