import { useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FlagImg } from '../utils/flagMap';

function matchIndicator(pred, match) {
  if (match.status !== 'finished') return { icon: '⏳', label: 'Aguardando', color: 'text-slate-500' };
  if (!pred) return { icon: '—', label: 'Sem palpite', color: 'text-slate-600' };
  const win = (a, b) => a > b ? 'a' : b > a ? 'b' : 'draw';
  const matchResult = win(match.score_a, match.score_b);
  const predResult = win(pred.score_a, pred.score_b);
  const exactScore = pred.score_a === match.score_a && pred.score_b === match.score_b;
  if (exactScore) {
    const pts = matchResult === 'draw' ? 4 : 3;
    return { icon: '✅', label: `Placar exato (+${pts})`, color: 'text-green-400' };
  }
  if (predResult === matchResult) {
    const label = matchResult === 'draw' ? 'Empate certo (+1)' : 'Vencedor certo (+1)';
    return { icon: '🟡', label, color: 'text-yellow-400' };
  }
  return { icon: '❌', label: 'Errou', color: 'text-red-400' };
}

function hoursUntil(datetime) {
  return (new Date(datetime) - Date.now()) / 3_600_000;
}

export default function MatchCard({ match, prediction, onSaved, readOnly = false }) {
  const { effectiveUser } = useAuth();
  const [scoreA, setScoreA] = useState(prediction?.score_a ?? 0);
  const [scoreB, setScoreB] = useState(prediction?.score_b ?? 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const hours = hoursUntil(match.datetime);
  const isLocked = hours < (match.lock_hours ?? 0);
  const canEdit = !readOnly && !isLocked && match.status !== 'finished';

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
        user_id: effectiveUser.id
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const indicator = matchIndicator(
    prediction ? { ...prediction, score_a: prediction.score_a, score_b: prediction.score_b } : null,
    match
  );

  const dateStr = new Date(match.datetime).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">

      {/* Header: badge + data + ícone */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full
                           bg-copa-green/15 text-copa-green border border-copa-green/25 whitespace-nowrap">
            {match.phase}
          </span>
          <span className="text-slate-400 text-sm">{dateStr}</span>
        </div>
        <span className={`text-sm flex-shrink-0 ${indicator.color}`} title={indicator.label}>
          {indicator.icon}
        </span>
      </div>

      {/* Times */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 flex-1">
          <FlagImg team={match.team_a} />
          <span className={`font-bold text-white ${match.team_a.length > 12 ? 'text-sm' : 'text-base'}`}>
            {match.team_a}
          </span>
        </div>

        <div className="flex-shrink-0 text-center">
          {match.status === 'finished' ? (
            <span className="text-lg font-bold text-copa-red font-mono whitespace-nowrap">
              {match.score_a} – {match.score_b}
            </span>
          ) : (
            <span className="text-3xl font-black text-slate-700 tracking-widest px-4">VS</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className={`font-bold text-white ${match.team_b.length > 12 ? 'text-sm' : 'text-base'}`}>
            {match.team_b}
          </span>
          <FlagImg team={match.team_b} />
        </div>
      </div>

      {/* Área de palpite */}
      {!readOnly && !isLocked && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-slate-500 text-xs">Seu palpite:</span>

          {/* Spinner A */}
          <div className="flex items-stretch gap-1">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setScoreA(v => Math.min(99, v + 1))}
                disabled={!canEdit}
                className="w-7 h-7 flex items-center justify-center rounded-md
                           bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold
                           disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >+</button>
              <button
                onClick={() => setScoreA(v => Math.max(0, v - 1))}
                disabled={!canEdit}
                className="w-7 h-7 flex items-center justify-center rounded-md
                           bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold
                           disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >−</button>
            </div>
            <div
              className="w-12 flex items-center justify-center
                         bg-slate-800 border border-slate-600 rounded-lg
                         text-white font-mono text-2xl font-bold"
              style={{ minHeight: '62px' }}
            >
              {scoreA}
            </div>
          </div>

          <span className="self-center text-slate-500 font-bold text-lg">×</span>

          {/* Spinner B */}
          <div className="flex items-stretch gap-1">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setScoreB(v => Math.min(99, v + 1))}
                disabled={!canEdit}
                className="w-7 h-7 flex items-center justify-center rounded-md
                           bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold
                           disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >+</button>
              <button
                onClick={() => setScoreB(v => Math.max(0, v - 1))}
                disabled={!canEdit}
                className="w-7 h-7 flex items-center justify-center rounded-md
                           bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold
                           disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >−</button>
            </div>
            <div
              className="w-12 flex items-center justify-center
                         bg-slate-800 border border-slate-600 rounded-lg
                         text-white font-mono text-2xl font-bold"
              style={{ minHeight: '62px' }}
            >
              {scoreB}
            </div>
          </div>

          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving || alreadySaved}
              className={`ml-2 self-center px-5 py-2.5 font-semibold rounded-lg transition-colors
                          disabled:cursor-not-allowed
                          ${alreadySaved
                            ? 'bg-slate-700 text-slate-400'
                            : 'bg-copa-green hover:bg-green-600 text-white disabled:opacity-50'
                          }`}
            >
              {saving ? '...' : alreadySaved ? '✓ Salvo' : 'Salvar'}
            </button>
          )}
        </div>
      )}

      {/* Indicador de bloqueio */}
      {!readOnly && isLocked && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-500">{match.status === 'finished' ? '✅ Encerrado' : '🔒 Fechado'}</span>
          <span className="text-xs text-slate-500">
            Meu palpite:{' '}
            {prediction
              ? <span className="text-slate-300 font-semibold font-mono">{prediction.score_a} × {prediction.score_b}</span>
              : <span className="text-slate-600">—</span>
            }
          </span>
        </div>
      )}

      {/* Palpite somente leitura */}
      {readOnly && prediction && (
        <div className="flex items-center gap-2 text-sm text-slate-500 pt-1 border-t border-slate-800">
          <span>Palpite:</span>
          <span className="font-semibold text-slate-200 font-mono">{prediction.score_a} × {prediction.score_b}</span>
          <span className={`ml-auto text-xs ${indicator.color}`}>{indicator.icon} {indicator.label}</span>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

      {/* Aviso de fechamento */}
      {!readOnly && hours > 0 && hours < 24 && !isLocked && (
        <p className="text-yellow-400 text-xs mt-3">
          ⚠ Fecha em {hours < 1 ? `${Math.round(hours * 60)}min` : `${Math.round(hours)}h`}
        </p>
      )}
    </div>
  );
}
