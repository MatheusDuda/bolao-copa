import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import MatchCard from '../components/MatchCard';
import StandingsSidebar from '../components/StandingsSidebar';
import { PHASES } from '../utils/teams';

export default function Predictions() {
  const { effectiveUser } = useAuth();
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [activePhase, setActivePhase] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [m, p] = await Promise.all([
      api.getMatches(),
      api.getPredictions(effectiveUser.id)
    ]);
    setMatches(m);
    setPredictions(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, [effectiveUser.id]);

  const phases = PHASES.filter(ph => matches.some(m => m.phase === ph));
  const currentPhase = activePhase || phases[0];
  const predMap = Object.fromEntries(predictions.map(p => [p.match_id, p]));

  const phaseMatches = matches
    .filter(m => m.phase === currentPhase)
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  if (loading) return <div className="py-16 text-center text-slate-500">Carregando...</div>;
  if (phases.length === 0) return (
    <div className="py-16 text-center text-slate-500">Nenhum jogo cadastrado ainda.</div>
  );

  return (
    <div>
      <h1 className="text-3xl font-black text-white mb-6 tracking-tight">Palpites</h1>

      {/* Phase tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {phases.map(ph => (
          <button
            key={ph}
            onClick={() => setActivePhase(ph)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              currentPhase === ph
                ? 'bg-copa-green/20 text-copa-green border border-copa-green/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            {ph}
          </button>
        ))}
      </div>

      <div className="flex gap-6 items-start">
        {/* Main column */}
        <div className="flex-1 min-w-0">
          {phaseMatches.length === 0 ? (
            <p className="text-slate-500">Nenhum jogo nesta fase.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {phaseMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predMap[match.id]}
                  onSaved={load}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar — desktop only */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <StandingsSidebar />
        </aside>
      </div>

      {/* Sidebar — mobile */}
      <div className="lg:hidden mt-8">
        <StandingsSidebar />
      </div>
    </div>
  );
}
