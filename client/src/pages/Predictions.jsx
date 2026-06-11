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
  const [showAll, setShowAll] = useState(false);

  const [participants, setParticipants] = useState([]);
  const [viewingUser, setViewingUser] = useState(null);
  const [otherPreds, setOtherPreds] = useState([]);
  const [otherLoading, setOtherLoading] = useState(false);

  const load = async () => {
    const [m, p, standings] = await Promise.all([
      api.getMatches(),
      api.getPredictions(effectiveUser.id),
      api.getStandings()
    ]);
    setMatches(m);
    setPredictions(p);
    setParticipants((standings || []).filter(u => u.id !== effectiveUser.id));
    setLoading(false);
  };

  useEffect(() => { load(); }, [effectiveUser.id]);

  const selectUser = async (participant) => {
    if (viewingUser?.id === participant.id) {
      setViewingUser(null);
      setOtherPreds([]);
      return;
    }
    setViewingUser(participant);
    setOtherLoading(true);
    const preds = await api.getPredictions(participant.id);
    setOtherPreds(preds || []);
    setOtherLoading(false);
  };

  const phases = PHASES.filter(ph => matches.some(m => m.phase === ph));
  const currentPhase = activePhase || phases[0];
  const predMap = Object.fromEntries(predictions.map(p => [p.match_id, p]));

  const phaseMatches = matches
    .filter(m => m.phase === currentPhase)
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  const todayStr = new Date().toDateString();
  const todayMatches = phaseMatches.filter(m => new Date(m.datetime).toDateString() === todayStr);
  const otherMatches = phaseMatches.filter(m => new Date(m.datetime).toDateString() !== todayStr);
  const hasToday = todayMatches.length > 0;

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
          ) : hasToday ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                {todayMatches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={predMap[match.id]}
                    onSaved={load}
                  />
                ))}
              </div>

              {otherMatches.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowAll(v => !v)}
                    className="w-full flex items-center gap-3 text-slate-500 hover:text-white transition-colors py-2"
                  >
                    <div className="flex-1 h-px bg-slate-700" />
                    <span className="text-sm whitespace-nowrap">
                      {showAll ? 'Ver menos' : `Ver todos os jogos (${otherMatches.length})`}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <div className="flex-1 h-px bg-slate-700" />
                  </button>

                  {showAll && (
                    <div className="grid gap-5 sm:grid-cols-2 mt-5">
                      {otherMatches.map(match => (
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
              )}
            </>
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

      {/* Palpites dos participantes */}
      {participants.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-white mb-4">Palpites dos participantes</h2>

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
            <div>
              <p className="text-slate-400 text-sm mb-4">
                Palpites de <span className="text-white font-semibold">{viewingUser.display_name}</span> — {currentPhase}
              </p>
              {otherLoading ? (
                <div className="text-slate-500 text-sm py-4">Carregando...</div>
              ) : (() => {
                const otherPredMap = Object.fromEntries(otherPreds.map(p => [p.match_id, p]));
                return (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {phaseMatches.map(match => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        prediction={otherPredMap[match.id]}
                        readOnly={true}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
