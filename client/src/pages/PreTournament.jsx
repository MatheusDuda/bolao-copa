import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { COPA_2026_TEAMS, BRAZIL_PERFORMANCE_OPTIONS, TOP_SCORERS } from '../utils/teams';

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

  useEffect(() => {
    Promise.all([api.getPreTournament(effectiveUser.id), api.getSettings()]).then(([p, s]) => {
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
      setLoading(false);
    });
  }, [effectiveUser.id]);

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

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* 2-column grid on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-5">
            <div>
              <label className="label">Campeão</label>
              <select className="input" value={form.champion} onChange={set('champion')} disabled={locked}>
                <option value="">Selecione</option>
                {COPA_2026_TEAMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Melhor ataque da fase de grupos</label>
              <select className="input" value={form.best_attack} onChange={set('best_attack')} disabled={locked}>
                <option value="">Selecione</option>
                {COPA_2026_TEAMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Neymar marca pelo menos 1 gol?</label>
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

          {/* Right column */}
          <div className="space-y-5">
            <div>
              <label className="label">Artilheiro</label>
              <select className="input" value={form.top_scorer} onChange={set('top_scorer')} disabled={locked}>
                <option value="">Selecione</option>
                {TOP_SCORERS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Melhor defesa da fase de grupos</label>
              <select className="input" value={form.best_defense} onChange={set('best_defense')} disabled={locked}>
                <option value="">Selecione</option>
                {COPA_2026_TEAMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Desempenho do Brasil</label>
              <select className="input" value={form.brazil_performance} onChange={set('brazil_performance')} disabled={locked}>
                <option value="">Selecione</option>
                {BRAZIL_PERFORMANCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

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
    </div>
  );
}
