import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import MatchCard from '../components/MatchCard';
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

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando...</div>;
  if (phases.length === 0) return (
    <div className="p-8 text-center text-gray-400">Nenhum jogo cadastrado ainda.</div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold mb-4 text-copa-red">Palpites</h2>

      {/* Phase tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {phases.map(ph => (
          <button
            key={ph}
            onClick={() => setActivePhase(ph)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              currentPhase === ph
                ? 'bg-copa-green text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {ph}
          </button>
        ))}
      </div>

      {phaseMatches.length === 0 ? (
        <p className="text-gray-400">Nenhum jogo nesta fase.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
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
  );
}
