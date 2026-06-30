import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FlagImg } from '../utils/flagMap';

const KNOCKOUT_PHASES = ['Rodada de 32', 'Oitavas', 'Quartas', 'Semifinal', 'Final'];
const CARD_H = 96;
const CARD_W = 204;
const GAP = 8;
const SLOT = CARD_H + GAP;
const CONNECTOR_W = 52;
const COL_W = CARD_W + CONNECTOR_W;

function BracketNode({ match, prediction, onSaved }) {
  const { effectiveUser } = useAuth();
  const [scoreA, setScoreA] = useState(prediction?.score_a ?? 0);
  const [scoreB, setScoreB] = useState(prediction?.score_b ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const hours = (new Date(match.datetime) - Date.now()) / 3_600_000;
  const isLocked = hours < (match.lock_hours ?? 0);
  const canEdit = !isLocked && match.status !== 'finished';
  const isDirty = scoreA !== (prediction?.score_a ?? 0) || scoreB !== (prediction?.score_b ?? 0);
  const alreadySaved = prediction !== undefined && !isDirty;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.savePrediction({
        match_id: match.id,
        score_a: Number(scoreA),
        score_b: Number(scoreB),
        user_id: effectiveUser.id,
      });
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const dateStr = new Date(match.datetime).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  const teamA = match.team_a || 'A definir';
  const teamB = match.team_b || 'A definir';

  function Spinner({ value, onChange }) {
    return (
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={() => onChange(v => Math.max(0, v - 1))}
          className="w-4 h-4 bg-slate-700 hover:bg-slate-600 rounded text-white text-[10px] font-bold leading-none"
        >−</button>
        <span className="w-5 text-center font-mono text-white text-xs font-bold">{value}</span>
        <button
          onClick={() => onChange(v => Math.min(99, v + 1))}
          className="w-4 h-4 bg-slate-700 hover:bg-slate-600 rounded text-white text-[10px] font-bold leading-none"
        >+</button>
      </div>
    );
  }

  return (
    <div
      className="bg-[#0f172a] border border-slate-700 rounded-lg overflow-hidden"
      style={{ width: CARD_W, height: CARD_H }}
    >
      {/* Date / status row */}
      <div className="px-2 pt-1.5 pb-1 flex items-center justify-between border-b border-slate-800">
        <span className="text-[10px] text-slate-500">{dateStr}</span>
        {match.status === 'finished' && <span className="text-[10px] text-green-500 font-medium">Encerrado</span>}
        {match.status === 'live' && <span className="text-[10px] text-yellow-400 font-medium">Ao vivo</span>}
        {isLocked && match.status === 'scheduled' && <span className="text-[10px] text-slate-600">🔒</span>}
      </div>

      {/* Teams */}
      <div className="px-2 py-1 flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <FlagImg team={teamA} className="!w-5 !h-4" />
          <span className="flex-1 text-white text-xs font-medium truncate">{teamA}</span>
          {match.status === 'finished' ? (
            <span className="font-mono text-xs font-bold text-copa-red flex-shrink-0 w-4 text-right">{match.score_a}</span>
          ) : canEdit ? (
            <Spinner value={scoreA} onChange={setScoreA} />
          ) : (
            <span className="font-mono text-xs text-slate-400 flex-shrink-0 w-8 text-right">
              {prediction?.score_a ?? '—'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <FlagImg team={teamB} className="!w-5 !h-4" />
          <span className="flex-1 text-white text-xs font-medium truncate">{teamB}</span>
          {match.status === 'finished' ? (
            <span className="font-mono text-xs font-bold text-copa-red flex-shrink-0 w-4 text-right">{match.score_b}</span>
          ) : canEdit ? (
            <Spinner value={scoreB} onChange={setScoreB} />
          ) : (
            <span className="font-mono text-xs text-slate-400 flex-shrink-0 w-8 text-right">
              {prediction?.score_b ?? '—'}
            </span>
          )}
        </div>
      </div>

      {/* Save */}
      {canEdit && (
        <div className="px-2 pb-1.5">
          <button
            onClick={handleSave}
            disabled={saving || alreadySaved}
            className={`w-full py-0.5 rounded text-[10px] font-semibold transition-colors ${
              alreadySaved
                ? 'bg-slate-700 text-slate-400 cursor-default'
                : 'bg-copa-green hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {saving ? '...' : alreadySaved ? '✓ Salvo' : 'Salvar'}
          </button>
          {error && <p className="text-red-400 text-[9px] mt-0.5 truncate">{error}</p>}
        </div>
      )}
    </div>
  );
}

function computePositions(phaseMatches, phases) {
  const result = {};
  if (phases.length === 0) return result;

  result[phases[0]] = phaseMatches[phases[0]].map((_, i) => i * SLOT);

  for (let k = 1; k < phases.length; k++) {
    const prev = phases[k - 1];
    const curr = phases[k];
    const prevY = result[prev];
    result[curr] = phaseMatches[curr].map((_, j) => {
      const y0 = prevY[j * 2] ?? prevY[prevY.length - 1];
      const y1 = prevY[j * 2 + 1];
      if (y1 === undefined) return y0;
      return (y0 + CARD_H / 2 + y1 + CARD_H / 2) / 2 - CARD_H / 2;
    });
  }

  return result;
}

export default function Bracket() {
  const { effectiveUser } = useAuth();
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [m, p] = await Promise.all([
      api.getMatches(),
      api.getPredictions(effectiveUser.id),
    ]);
    setMatches(m);
    setPredictions(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, [effectiveUser.id]);

  if (loading) return <div className="py-16 text-center text-slate-500">Carregando...</div>;

  const predMap = Object.fromEntries(predictions.map(p => [p.match_id, p]));

  const phaseMatches = {};
  for (const phase of [...KNOCKOUT_PHASES, 'Terceiro Lugar']) {
    phaseMatches[phase] = matches
      .filter(m => m.phase === phase || (phase === 'Rodada de 32' && m.phase === 'LAST_32'))
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  }

  const activePhases = KNOCKOUT_PHASES.filter(p => phaseMatches[p]?.length > 0);
  const thirdPlace = phaseMatches['Terceiro Lugar'] || [];

  if (activePhases.length === 0 && thirdPlace.length === 0) {
    return (
      <div className="py-16 text-center text-slate-500">
        Nenhum jogo de mata-mata cadastrado ainda. Peça ao admin para fazer o sync.
      </div>
    );
  }

  const positions = computePositions(phaseMatches, activePhases);
  const firstPhase = activePhases[0];
  const bracketHeight = firstPhase ? phaseMatches[firstPhase].length * SLOT : 0;
  const bracketWidth = activePhases.length > 0
    ? (activePhases.length - 1) * COL_W + CARD_W
    : 0;

  return (
    <div>
      <h1 className="text-3xl font-black text-white mb-6 tracking-tight">2ª Fase — Chaveamento</h1>

      {activePhases.length > 0 && (
        <div className="overflow-auto rounded-xl border border-slate-800 bg-[#080f1e] p-6">
          {/* Phase headers */}
          <div className="flex mb-4" style={{ minWidth: bracketWidth }}>
            {activePhases.map((phase, k) => (
              <div
                key={phase}
                className="text-center"
                style={{ width: k < activePhases.length - 1 ? COL_W : CARD_W }}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{phase}</span>
              </div>
            ))}
          </div>

          {/* Bracket body */}
          <div className="relative" style={{ width: bracketWidth, height: bracketHeight }}>
            {/* SVG connector lines */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={bracketWidth}
              height={bracketHeight}
              overflow="visible"
            >
              {activePhases.slice(0, -1).map((phase, k) => {
                const nextPhase = activePhases[k + 1];
                const phaseX = k * COL_W;
                const prevY = positions[phase] || [];
                const nextY = positions[nextPhase] || [];

                return nextY.map((ny, j) => {
                  const y0 = prevY[j * 2];
                  const y1 = prevY[j * 2 + 1];
                  if (y0 === undefined) return null;

                  const x1 = phaseX + CARD_W;
                  const xMid = phaseX + CARD_W + CONNECTOR_W / 2;
                  const x2 = phaseX + COL_W;
                  const cy0 = y0 + CARD_H / 2;
                  const cy1 = y1 !== undefined ? y1 + CARD_H / 2 : cy0;
                  const cyTarget = ny + CARD_H / 2;

                  return (
                    <g key={`${k}-${j}`} stroke="#1e3a5f" strokeWidth="1.5" fill="none">
                      <line x1={x1} y1={cy0} x2={xMid} y2={cy0} />
                      {y1 !== undefined && (
                        <>
                          <line x1={x1} y1={cy1} x2={xMid} y2={cy1} />
                          <line x1={xMid} y1={cy0} x2={xMid} y2={cy1} />
                        </>
                      )}
                      <line x1={xMid} y1={cyTarget} x2={x2} y2={cyTarget} />
                    </g>
                  );
                });
              })}
            </svg>

            {/* Match nodes */}
            {activePhases.map((phase, k) => {
              const phaseX = k * COL_W;
              const phaseY = positions[phase] || [];
              return phaseMatches[phase].map((match, j) => (
                <div
                  key={match.id}
                  className="absolute"
                  style={{ left: phaseX, top: phaseY[j] ?? j * SLOT }}
                >
                  <BracketNode
                    match={match}
                    prediction={predMap[match.id]}
                    onSaved={load}
                  />
                </div>
              ));
            })}
          </div>
        </div>
      )}

      {/* Third Place */}
      {thirdPlace.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Terceiro Lugar</h2>
          <div className="flex flex-col gap-2" style={{ maxWidth: CARD_W }}>
            {thirdPlace.map(match => (
              <BracketNode
                key={match.id}
                match={match}
                prediction={predMap[match.id]}
                onSaved={load}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
