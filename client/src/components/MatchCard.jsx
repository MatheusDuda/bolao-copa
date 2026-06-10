import { useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function matchIndicator(pred, match) {
  if (match.status !== 'finished') return { icon: '⏳', label: 'Aguardando', color: 'text-gray-400' };
  if (!pred) return { icon: '—', label: 'Sem palpite', color: 'text-gray-500' };
  if (pred.score_a === match.score_a && pred.score_b === match.score_b)
    return { icon: '✅', label: 'Placar exato (+3)', color: 'text-green-400' };
  const winner = (a, b) => a > b ? 'a' : b > a ? 'b' : 'draw';
  if (winner(pred.score_a, pred.score_b) === winner(match.score_a, match.score_b))
    return { icon: '🟡', label: 'Vencedor certo (+1)', color: 'text-yellow-400' };
  return { icon: '❌', label: 'Errou', color: 'text-red-400' };
}

function hoursUntil(datetime) {
  return (new Date(datetime) - Date.now()) / 3_600_000;
}

export default function MatchCard({ match, prediction, onSaved, readOnly = false }) {
  const { effectiveUser } = useAuth();
  const [scoreA, setScoreA] = useState(prediction?.score_a ?? '');
  const [scoreB, setScoreB] = useState(prediction?.score_b ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const hours = hoursUntil(match.datetime);
  const isLocked = hours < (match.lock_hours ?? 1);
  const canEdit = !readOnly && !isLocked && match.status !== 'finished';

  const handleSave = async () => {
    if (scoreA === '' || scoreB === '') return;
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
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{match.phase} · {dateStr}</span>
        <span className={`text-sm ${indicator.color}`} title={indicator.label}>{indicator.icon}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex-1 text-right font-semibold text-sm">{match.team_a}</span>

        <div className="flex items-center gap-1">
          {match.status === 'finished' ? (
            <span className="text-lg font-bold text-copa-yellow">
              {match.score_a} – {match.score_b}
            </span>
          ) : (
            <span className="text-gray-500 text-sm">vs</span>
          )}
        </div>

        <span className="flex-1 text-left font-semibold text-sm">{match.team_b}</span>
      </div>

      {/* Prediction inputs */}
      {!readOnly && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-gray-400 mr-1">Seu palpite:</span>
          <input
            type="number" min="0" max="99"
            value={scoreA}
            onChange={e => setScoreA(e.target.value)}
            disabled={!canEdit}
            className="w-14 text-center input text-sm py-1 disabled:opacity-50"
            placeholder="0"
          />
          <span className="text-gray-400">×</span>
          <input
            type="number" min="0" max="99"
            value={scoreB}
            onChange={e => setScoreB(e.target.value)}
            disabled={!canEdit}
            className="w-14 text-center input text-sm py-1 disabled:opacity-50"
            placeholder="0"
          />
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving || scoreA === '' || scoreB === ''}
              className="btn-primary text-xs py-1 px-3 ml-1"
            >
              {saving ? '...' : saved ? '✓' : 'Salvar'}
            </button>
          )}
          {isLocked && match.status !== 'finished' && (
            <span className="text-xs text-orange-400 ml-1">🔒 Fechado</span>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Show existing prediction read-only */}
      {readOnly && prediction && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Palpite:</span>
          <span className="font-semibold text-gray-200">{prediction.score_a} × {prediction.score_b}</span>
          <span className={`ml-auto ${indicator.color}`}>{indicator.icon} {indicator.label}</span>
        </div>
      )}

      {!readOnly && hours > 0 && hours < 24 && !isLocked && (
        <p className="text-xs text-orange-300">
          ⚠ Fecha em {hours < 1 ? `${Math.round(hours * 60)}min` : `${Math.round(hours)}h`}
        </p>
      )}
    </div>
  );
}
