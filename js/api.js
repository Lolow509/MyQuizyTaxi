/** Couche de communication avec Apps Script, indépendante de l'interface. */
const Api = (() => {
  async function call(action, payload = {}) {
    // text/plain évite la requête préliminaire CORS (non supportée par Apps Script).
    const res = await fetch(CONFIG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(Object.assign({ action, token: Auth.token() }, payload)) });
    const data = await res.json();
    if (!data.ok) {
      if (data.error === 'SESSION_EXPIREE') { Auth.clear(); location.replace('index.html'); }
      throw new Error(data.error || 'Erreur serveur');
    }
    return data;
  }
  return {
    login: (email, password) => call('login', { email, password }),
    register: (nom, email, password) => call('register', { nom, email, password }),
    logout: () => call('logout').catch(() => {}),
    me: () => call('me').then(d => d.user),
    quizzes: () => call('quizzes').then(d => d.quizzes),
    questions: quiz_id => call('questions', { quiz_id }).then(d => d.questions),
    grade: (question_id, answer) => call('grade', { question_id, answer }),
    finish: p => call('finish', p).then(d => d.result),
    results: () => call('results').then(d => d.results),
    createQuiz: payload => call('createQuiz', payload),
    updateQuiz: payload => call('updateQuiz', payload),
    myQuizzes: () => call('myQuizzes').then(d => d.quizzes),
    getQuiz: quiz_id => call('getQuiz', { quiz_id }).then(d => d.quiz),
    toggleQuiz: (quiz_id, actif) => call('toggleQuiz', { quiz_id, actif }),
    deleteQuiz: quiz_id => call('deleteQuiz', { quiz_id }),
    updateProfile: nom => call('updateProfile', { nom }),
    changePassword: (ancien, nouveau) => call('changePassword', { ancien, nouveau })
  };
})();
