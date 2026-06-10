import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { COPA_2026_TEAMS, BRAZIL_PERFORMANCE_OPTIONS, PHASES } from '../utils/teams';

// ---- Users Tab ----
function UserModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({
    username: user?.username || '',
    display_name: user?.display_name || '',
    password: '',
    role: user?.role || 'user'
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (user) await api.updateUser(user.id, data);
      else await api.createUser(data);
      onSave();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-sm space-y-4">
        <h3 className="font-bold text-lg">{user ? 'Editar usuário' : 'Novo usuário'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="label">Username</label><input className="input" value={form.username} onChange={set('username')} required /></div>
          <div><label className="label">Nome de exibição</label><input className="input" value={form.display_name} onChange={set('display_name')} /></div>
          <div><label className="label">{user ? 'Nova senha (deixe em branco p/ manter)' : 'Senha'}</label><input className="input" type="password" value={form.password} onChange={set('password')} required={!user} /></div>
          <div>
            <label className="label">Perfil</label>
            <select className="input" value={form.role} onChange={set('role')}>
              <option value="user">Participante</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? '...' : 'Salvar'}</button>
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsersTab() {
  const { user: adminUser, setVotingAs } = useAuth();
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);

  const load = () => api.getUsers().then(setUsers);
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Remover este usuário?')) return;
    await api.deleteUser(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-200">Usuários</h3>
        <button className="btn-primary text-sm" onClick={() => setModal({})}>+ Novo usuário</button>
      </div>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="card flex items-center justify-between gap-2 py-3">
            <div>
              <span className="font-medium">{u.display_name}</span>
              <span className="text-gray-400 text-sm ml-2">@{u.username}</span>
              {u.role === 'admin' && <span className="ml-2 text-xs bg-copa-blue/50 text-blue-300 px-2 py-0.5 rounded-full">admin</span>}
            </div>
            <div className="flex gap-2">
              {u.id !== adminUser.id && (
                <button
                  className="text-xs bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 px-3 py-1 rounded-lg"
                  onClick={() => setVotingAs(u)}
                >
                  Votar por
                </button>
              )}
              <button className="text-xs btn-secondary py-1 px-3" onClick={() => setModal(u)}>Editar</button>
              {u.id !== adminUser.id && (
                <button className="text-xs btn-danger py-1 px-3" onClick={() => handleDelete(u.id)}>Remover</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {modal !== null && <UserModal user={modal?.id ? modal : null} onSave={() => { load(); setModal(null); }} onClose={() => setModal(null)} />}
    </div>
  );
}

// ---- Matches Tab ----
function MatchModal({ match, onSave, onClose }) {
  const [form, setForm] = useState({
    phase: match?.phase || 'Fase de Grupos',
    team_a: match?.team_a || '',
    team_b: match?.team_b || '',
    datetime: match?.datetime ? match.datetime.slice(0, 16) : '',
    score_a: match?.score_a ?? '',
    score_b: match?.score_b ?? '',
    status: match?.status || 'scheduled'
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        datetime: new Date(form.datetime).toISOString(),
        score_a: form.score_a !== '' ? Number(form.score_a) : null,
        score_b: form.score_b !== '' ? Number(form.score_b) : null,
      };
      if (match) await api.updateMatch(match.id, data);
      else await api.createMatch(data);
      onSave();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 overflow-y-auto py-4">
      <div className="card w-full max-w-sm space-y-3 my-auto">
        <h3 className="font-bold text-lg">{match ? 'Editar jogo' : 'Novo jogo'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Fase</label>
            <select className="input" value={form.phase} onChange={set('phase')}>
              {PHASES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Time A</label>
              <input className="input" value={form.team_a} onChange={set('team_a')} required list="teams-list" />
            </div>
            <div>
              <label className="label">Time B</label>
              <input className="input" value={form.team_b} onChange={set('team_b')} required list="teams-list" />
            </div>
          </div>
          <datalist id="teams-list">{COPA_2026_TEAMS.map(t => <option key={t} value={t} />)}</datalist>
          <div>
            <label className="label">Data/Hora</label>
            <input className="input" type="datetime-local" value={form.datetime} onChange={set('datetime')} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Placar A</label><input className="input" type="number" min="0" value={form.score_a} onChange={set('score_a')} placeholder="—" /></div>
            <div><label className="label">Placar B</label><input className="input" type="number" min="0" value={form.score_b} onChange={set('score_b')} placeholder="—" /></div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={set('status')}>
              <option value="scheduled">Agendado</option>
              <option value="live">Ao vivo</option>
              <option value="finished">Finalizado</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? '...' : 'Salvar'}</button>
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MatchesTab() {
  const [matches, setMatches] = useState([]);
  const [modal, setModal] = useState(null);
  const [filterPhase, setFilterPhase] = useState('all');

  const load = () => api.getMatches().then(m => setMatches(m.sort((a, b) => new Date(a.datetime) - new Date(b.datetime))));
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Remover este jogo?')) return;
    await api.deleteMatch(id);
    load();
  };

  const phases = ['all', ...PHASES.filter(ph => matches.some(m => m.phase === ph))];
  const filtered = filterPhase === 'all' ? matches : matches.filter(m => m.phase === filterPhase);

  const statusLabel = { scheduled: '📅', live: '🔴', finished: '✅' };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-200">Jogos</h3>
        <button className="btn-primary text-sm" onClick={() => setModal({})}>+ Novo jogo</button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {phases.map(ph => (
          <button
            key={ph}
            onClick={() => setFilterPhase(ph)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${filterPhase === ph ? 'bg-copa-green text-white' : 'bg-gray-700 text-gray-400'}`}
          >
            {ph === 'all' ? 'Todos' : ph}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(m => (
          <div key={m.id} className="card flex items-center justify-between gap-2 py-2.5">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {statusLabel[m.status]} {m.team_a} {m.score_a !== null ? `${m.score_a}×${m.score_b}` : 'vs'} {m.team_b}
              </div>
              <div className="text-xs text-gray-400">
                {m.phase} · {new Date(m.datetime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="text-xs btn-secondary py-1 px-2" onClick={() => setModal(m)}>Editar</button>
              <button className="text-xs btn-danger py-1 px-2" onClick={() => handleDelete(m.id)}>✕</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-gray-500 text-sm">Nenhum jogo.</p>}
      </div>
      {modal !== null && <MatchModal match={modal?.id ? modal : null} onSave={() => { load(); setModal(null); }} onClose={() => setModal(null)} />}
    </div>
  );
}

// ---- Results Tab ----
function ResultsTab() {
  const [extra, setExtra] = useState(null);
  const [form, setForm] = useState({
    champion: '', top_scorer: '', best_attack: '', best_defense: '',
    neymar_scored: '', brazil_performance: ''
  });
  const [syncState, setSyncState] = useState('idle'); // idle|loading|success|error
  const [syncMsg, setSyncMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    const e = await api.getExtraResults();
    setExtra(e);
    setForm({
      champion: e.champion || '',
      top_scorer: e.top_scorer || '',
      best_attack: e.best_attack || '',
      best_defense: e.best_defense || '',
      neymar_scored: e.neymar_scored === true ? 'sim' : e.neymar_scored === false ? 'nao' : '',
      brazil_performance: e.brazil_performance || ''
    });
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await api.updateExtraResults({
      ...form,
      neymar_scored: form.neymar_scored === 'sim' ? true : form.neymar_scored === 'nao' ? false : null
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const handleSync = async () => {
    setSyncState('loading');
    setSyncMsg('');
    try {
      const res = await api.sync();
      setSyncState('success');
      setSyncMsg(res.message);
      load();
    } catch (err) {
      setSyncState('error');
      setSyncMsg(err.message);
    }
  };

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  return (
    <div className="space-y-6">
      {/* Sync button */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-gray-200">Sincronização Automática</h3>
        <p className="text-xs text-gray-400">Busca resultados da football-data.org e recalcula todas as pontuações.</p>
        <button
          onClick={handleSync}
          disabled={syncState === 'loading'}
          className={`btn-primary ${syncState === 'loading' ? 'opacity-70' : ''}`}
        >
          {syncState === 'loading' ? '⏳ Sincronizando...' : '🔄 Sincronizar Resultados'}
        </button>
        {syncState === 'success' && <p className="text-green-400 text-sm">✅ {syncMsg}</p>}
        {syncState === 'error' && <p className="text-red-400 text-sm">❌ {syncMsg}</p>}
      </div>

      {/* Manual overrides */}
      <form onSubmit={handleSave} className="card space-y-4">
        <h3 className="font-semibold text-gray-200">Resultados Manuais</h3>

        <div>
          <label className="label">Campeão</label>
          <select className="input" value={form.champion} onChange={set('champion')}>
            <option value="">Não definido</option>
            {COPA_2026_TEAMS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Artilheiro</label>
          <input className="input" value={form.top_scorer} onChange={set('top_scorer')} placeholder="Nome do jogador" />
        </div>

        <div>
          <label className="label">Melhor ataque (fase de grupos)</label>
          <select className="input" value={form.best_attack} onChange={set('best_attack')}>
            <option value="">Não definido</option>
            {COPA_2026_TEAMS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Melhor defesa (fase de grupos)</label>
          <select className="input" value={form.best_defense} onChange={set('best_defense')}>
            <option value="">Não definido</option>
            {COPA_2026_TEAMS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Neymar marcou pelo menos 1 gol?</label>
          <div className="flex gap-4 mt-1">
            {[['sim', 'Sim'], ['nao', 'Não'], ['', 'Indefinido']].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="neymar_r" value={v} checked={form.neymar_scored === v} onChange={set('neymar_scored')} className="accent-copa-green" />
                <span className="text-sm">{l}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Desempenho do Brasil</label>
          <select className="input" value={form.brazil_performance} onChange={set('brazil_performance')}>
            <option value="">Não definido</option>
            {BRAZIL_PERFORMANCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? '...' : saved ? '✓ Salvo!' : 'Salvar resultados'}
        </button>
      </form>
    </div>
  );
}

// ---- Settings Tab ----
function SettingsTab() {
  const [form, setForm] = useState({ hours_before_lock: 1, football_data_api_key: '', copa_start_date: '2026-06-11' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then(s => setForm({ ...s }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await api.updateSettings({ ...form, hours_before_lock: Number(form.hours_before_lock) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 max-w-sm">
      <h3 className="font-semibold text-gray-200">Configurações</h3>
      <div>
        <label className="label">Horas antes do fechamento de palpites</label>
        <input className="input" type="number" min="0" step="0.5" value={form.hours_before_lock} onChange={set('hours_before_lock')} />
      </div>
      <div>
        <label className="label">Data de início do torneio (bloqueio pré-torneio)</label>
        <input className="input" type="date" value={form.copa_start_date} onChange={set('copa_start_date')} />
      </div>
      <div>
        <label className="label">API Key — football-data.org</label>
        <input className="input" type="password" value={form.football_data_api_key} onChange={set('football_data_api_key')} placeholder="Sua chave de API" />
        <p className="text-xs text-gray-500 mt-1">Necessária para sincronização automática de resultados.</p>
      </div>
      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? '...' : saved ? '✓ Salvo!' : 'Salvar configurações'}
      </button>
    </form>
  );
}

// ---- Main Admin Page ----
const ADMIN_TABS = [
  { id: 'users', label: 'Usuários' },
  { id: 'matches', label: 'Jogos' },
  { id: 'results', label: 'Resultados' },
  { id: 'settings', label: 'Configurações' },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold mb-4 text-copa-yellow">Painel Admin</h2>
      <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-xl w-fit">
        {ADMIN_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'matches' && <MatchesTab />}
      {activeTab === 'results' && <ResultsTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  );
}
