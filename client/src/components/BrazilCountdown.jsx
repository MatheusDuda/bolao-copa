import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function pad(n) { return String(n).padStart(2, '0'); }

function useCountdown(datetime) {
  const [ms, setMs] = useState(() => new Date(datetime) - Date.now());
  useEffect(() => {
    const id = setInterval(() => setMs(new Date(datetime) - Date.now()), 1000);
    return () => clearInterval(id);
  }, [datetime]);
  return ms;
}

function Tile({ value, label }) {
  return (
    <span className="flex items-baseline gap-0.5">
      <span className="text-copa-green font-mono font-bold text-base tabular-nums">{pad(value)}</span>
      <span className="text-slate-500 text-xs">{label}</span>
    </span>
  );
}

function Countdown({ datetime }) {
  const ms = useCountdown(datetime);
  if (ms <= 0) return <span className="text-copa-green font-bold animate-pulse">AGORA!</span>;
  const s = Math.floor(ms / 1000);
  const days  = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins  = Math.floor((s % 3600) / 60);
  const secs  = s % 60;
  return (
    <span className="flex items-center gap-2">
      {days > 0 && <Tile value={days} label="d" />}
      <Tile value={hours} label="h" />
      <Tile value={mins} label="min" />
      <Tile value={secs} label="seg" />
    </span>
  );
}

export default function BrazilCountdown() {
  const [match, setMatch] = useState(undefined);

  useEffect(() => {
    api.getMatches().then(matches => {
      const now = new Date();
      const next = matches
        .filter(m =>
          (m.team_a === 'Brasil' || m.team_b === 'Brasil') &&
          m.status !== 'finished' &&
          new Date(m.datetime) > now
        )
        .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))[0];
      setMatch(next ?? null);
    });
  }, []);

  if (match === undefined || match === null) return null;

  const isLive = match.status === 'live' || match.status === 'in_progress';
  const opponent = match.team_a === 'Brasil' ? match.team_b : match.team_a;
  const dateStr = new Date(match.datetime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const timeStr = new Date(match.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="border-b border-green-900/60" style={{ background: 'linear-gradient(90deg, #011a08 0%, #022b10 50%, #011a08 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-3 text-sm flex-wrap">
        <span className="text-base">🇧🇷</span>
        <span className="text-white font-semibold">Brasil × {opponent}</span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-400 text-xs">{dateStr} às {timeStr}</span>
        <span className="text-slate-600">·</span>
        {isLive
          ? <span className="text-red-400 font-bold animate-pulse flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-ping" />AO VIVO</span>
          : <Countdown datetime={match.datetime} />
        }
      </div>
    </div>
  );
}
