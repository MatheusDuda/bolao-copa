import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { COPA_2026_TEAMS, BRAZIL_PERFORMANCE_OPTIONS, TOP_SCORERS } from '../utils/teams';

function SectionTitle({ children }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-slate-700">
      {children}
    </h2>
  );
}

const PRE_FIELDS = [
  { key: 'champion', label: 'Campeão' },
  { key: 'top_scorer', label: 'Artilheiro' },
  { key: 'brazil_performance', label: 'Desempenho do Brasil' },
  { key: 'neymar_scores', label: 'Neymar marca pelo menos 3 gols?' },
  { key: 'best_attack', label: 'Melhor ataque' },
  { key: 'best_defense', label: 'Melhor defesa' },
];

function formatPickValue(key, value) {
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'neymar_scores') return value === true ? 'Sim' : value === false ? 'Não' : '—';
  return value;
}

export default function PreTournament() {
  const { effectiveUser, user } = useAuth();
  const [pick, setPick] = useState(null);
  const [form, setForm] = useState({
    champion: '', top_scorer: '', best_attack: '', best_defense: '',
    neymar_scores: '', brazil_performance: ''
  });
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [participants, setParticipants] = useState([]);
  const [viewingUser, setViewingUser] = useState(null);
  const [otherPick, setOtherPick] = useState(null);
  const [otherLoading, setOtherLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getPreTournament(effectiveUser.id),
      api.getSettings(),
      api.getStandings()
    ]).then(([p, s, standings]) => {
      if (p) {
        setPick(p);
        setForm({
          champion: p.champion || '',
          top_scorer: p.top_scorer || '',
          best_attack: p.best_attack || '',
          best_defense: p.best_defense || '',
          neymar_scores: p.neymar_scores === true ? 'sim' : p.neymar_scores === false ? 'nao' : '',
          brazil_performance: p.brazil_performance || ''
        });
      }
      const started = Date.now() >= new Date(s.copa_start_date).getTime();
      setLocked(started && user.role !== 'admin');
      setParticipants((standings || []).filter(u => u.id !== effectiveUser.id));
      setLoading(false);
    });
  }, [effectiveUser.id]);

  const selectUser = async (participant) => {
    if (viewingUser?.id === participant.id) {
      setViewingUser(null);
      setOtherPick(null);
      return;
    }
    setViewingUser(participant);
    setOtherLoading(true);
    const p = await api.getPreTournament(participant.id);
    setOtherPick(p || null);
    setOtherLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = {
        ...form,
        neymar_scores: form.neymar_scores === 'sim',
        user_id: effectiveUser.id
      };
      if (pick) {
        await api.updatePreTournament(pick.id, data);
      } else {
        await api.savePreTournament(data);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  if (loading) return <div className="py-16 text-center text-slate-500">Carregando...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-black text-white mb-6 tracking-tight">Pré-torneio</h1>
      {locked ? (
        <p className="text-orange-400 text-sm mb-5">🔒 Torneio iniciado — palpites bloqueados.</p>
      ) : (
        <p className="text-slate-500 text-sm mb-5">Esses palpites ficam bloqueados quando o torneio começa.</p>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-8">

        {/* Seção Geral */}
        <div>
          <SectionTitle>Geral</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label flex items-center gap-2">Campeão <span className="text-xs text-copa-green font-semibold">+10 pts</span></label>
              <select className="input" value={form.champion} onChange={set('champion')} disabled={locked}>
                <option value="">Selecione</option>
                {COPA_2026_TEAMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="label flex items-center gap-2">Artilheiro <span className="text-xs text-copa-green font-semibold">+8 pts</span></label>
              <select className="input" value={form.top_scorer} onChange={set('top_scorer')} disabled={locked}>
                <option value="">Selecione</option>
                {TOP_SCORERS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="label flex items-center gap-2">Desempenho do Brasil <span className="text-xs text-copa-green font-semibold">+17 pts</span></label>
              <select className="input" value={form.brazil_performance} onChange={set('brazil_performance')} disabled={locked}>
                <option value="">Selecione</option>
                {BRAZIL_PERFORMANCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="label flex items-center gap-2">Neymar marca pelo menos 3 gols? <span className="text-xs text-copa-green font-semibold">+3 pts</span></label>
              <div className="flex gap-5 mt-2">
                {['sim', 'nao'].map(v => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio" name="neymar" value={v}
                      checked={form.neymar_scores === v}
                      onChange={set('neymar_scores')}
                      disabled={locked}
                      className="accent-copa-green w-4 h-4"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      {v === 'sim' ? 'Sim' : 'Não'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Seção Fase de Grupos */}
        <div>
          <SectionTitle>Fase de Grupos</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label flex items-center gap-2">Melhor ataque <span className="text-xs text-copa-green font-semibold">+5 pts</span></label>
              <select className="input" value={form.best_attack} onChange={set('best_attack')} disabled={locked}>
                <option value="">Selecione</option>
                {COPA_2026_TEAMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="label flex items-center gap-2">Melhor defesa <span className="text-xs text-copa-green font-semibold">+5 pts</span></label>
              <select className="input" value={form.best_defense} onChange={set('best_defense')} disabled={locked}>
                <option value="">Selecione</option>
                {COPA_2026_TEAMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {!locked && (
          <p className="text-sm text-orange-400 flex items-center gap-2">
            ⚠️ O pré-torneio será encerrado no sábado, 13/06.
          </p>
        )}

        {!locked && (
          <button className="btn-primary w-full" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar palpites'}
          </button>
        )}

        {pick && (
          <div className="text-xs text-slate-600 pt-1 border-t border-slate-800">
            Pontos atuais: <span className="text-slate-300 font-semibold">{pick.points ?? 0} pts</span>
          </div>
        )}
      </form>

      {/* Pré-torneio dos participantes */}
      {participants.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-white mb-4">Pré-torneio dos participantes</h2>

          <div className="flex gap-2 flex-wrap mb-6">
            {participants.map(p => (
              <button
                key={p.id}
                onClick={() => selectUser(p)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  viewingUser?.id === p.id
                    ? 'bg-copa-red/20 text-copa-red border border-copa-red/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {p.display_name}
              </button>
            ))}
          </div>

          {viewingUser && (
            <div className="card p-6">
              <p className="text-slate-400 text-sm mb-5">
                Palpites de <span className="text-white font-semibold">{viewingUser.display_name}</span>
              </p>
              {otherLoading ? (
                <div className="text-slate-500 text-sm">Carregando...</div>
              ) : !otherPick ? (
                <p className="text-slate-500 text-sm">Ainda não preencheu.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PRE_FIELDS.map(({ key, label }) => (
                    <div key={key} className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-4 py-3">
                      <div className="text-slate-500 text-xs mb-1">{label}</div>
                      <div className="text-white font-semibold text-sm">
                        {formatPickValue(key, otherPick[key])}
                      </div>
                    </div>
                  ))}
                  <div className="md:col-span-2 text-xs text-slate-600 pt-1 border-t border-slate-800 mt-1">
                    Pontos: <span className="text-slate-300 font-semibold">{otherPick.points ?? 0} pts</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
