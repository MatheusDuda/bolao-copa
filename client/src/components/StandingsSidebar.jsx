import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function StandingsSidebar() {
  const { effectiveUser } = useAuth();
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStandings().then(s => { setStandings(s); setLoading(false); });
  }, []);

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 sticky top-24">
      <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
        🏆 Classificação
      </h2>
      {loading ? (
        <p className="text-slate-500 text-xs py-2">Carregando...</p>
      ) : (
        <div className="space-y-0.5">
          {standings.map((entry, i) => {
            const isMe = entry.id === effectiveUser.id;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors ${
                  isMe
                    ? 'bg-copa-blue/25 border border-copa-blue/40'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <span className="w-5 text-xs font-bold text-slate-500 flex-shrink-0">
                  {medal || (i + 1)}
                </span>
                <span className="flex-1 text-sm font-medium text-white truncate">
                  {entry.display_name}
                </span>
                {isMe && <span className="text-xs text-slate-500">(você)</span>}
                <span className="text-sm font-bold text-white flex-shrink-0">
                  {entry.score} <span className="text-slate-500 font-normal text-xs">pts</span>
                </span>
              </div>
            );
          })}
          {standings.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">Nenhum participante ainda</p>
          )}
        </div>
      )}
    </div>
  );
}
