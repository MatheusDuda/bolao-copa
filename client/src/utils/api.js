const getSession = () => {
  try { return JSON.parse(localStorage.getItem('betolao_session') || 'null'); } catch { return null; }
};

const getVotingAs = () => {
  try { return JSON.parse(localStorage.getItem('betolao_voting_as') || 'null'); } catch { return null; }
};

async function request(path, options = {}) {
  const session = getSession();
  const votingAs = getVotingAs();

  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (session) headers['X-User-Id'] = votingAs ? votingAs.id : session.id;
  if (votingAs && session) headers['X-Admin-Id'] = session.id;

  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  login: (username, password) => request('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getUsers: () => request('/api/users'),
  createUser: (data) => request('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),

  getMatches: () => request('/api/matches'),
  createMatch: (data) => request('/api/matches', { method: 'POST', body: JSON.stringify(data) }),
  updateMatch: (id, data) => request(`/api/matches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMatch: (id) => request(`/api/matches/${id}`, { method: 'DELETE' }),

  getPredictions: (userId) => request(`/api/predictions?userId=${userId}`),
  savePrediction: (data) => request('/api/predictions', { method: 'POST', body: JSON.stringify(data) }),

  getPreTournament: (userId) => request(`/api/pre-tournament?userId=${userId}`),
  savePreTournament: (data) => request('/api/pre-tournament', { method: 'POST', body: JSON.stringify(data) }),
  updatePreTournament: (id, data) => request(`/api/pre-tournament/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getExtraResults: () => request('/api/extra-results'),
  updateExtraResults: (data) => request('/api/extra-results', { method: 'PUT', body: JSON.stringify(data) }),

  getSettings: () => request('/api/settings'),
  updateSettings: (data) => request('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),

  getStandings: () => request('/api/standings'),
  sync: () => request('/api/sync', { method: 'POST' }),
};
