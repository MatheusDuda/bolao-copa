import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const BREAKDOWN_LABELS = {
  match_points: 'Pts de Jogos',
  champion: 'Campeão',
  top_scorer: 'Artilheiro',
  best_attack: 'Melhor ataque',
  best_defense: 'Melhor defesa',
  neymar: 'Neymar',
  brazil: 'Brasil',
  bonus: 'Bônus'
};

export default function Standings() {
  const { effectiveUser } = useAuth();
  const [standings, setStandings] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStandings().then(s => { setStandings(s); setLoading(false); });
  }, []);

  if (loading) return <div className="py-16 text-center text-slate-500">Carregando...</div>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-black text-white mb-6 tracking-tight">Classificação</h1>
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/50 text-slate-400 text-left">
              <th className="px-5 py-3.5 w-12">#</th>
              <th className="px-5 py-3.5">Participante</th>
              <th className="px-5 py-3.5 text-right">Pts</th>
              <th className="px-5 py-3.5 text-right">Jogos</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((entry, i) => {
              const isMe = entry.id === effectiveUser.id;
              const isExpanded = expanded === entry.id;
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
              return (
                <>
                  <tr
                    key={entry.id}
                    onClick={() => setExpanded(isExpanded ? null : entry.id)}
                    className={`border-t border-slate-800 cursor-pointer transition-colors ${
                      isMe
                        ? 'bg-copa-blue/20 hover:bg-copa-blue/30'
                        : i < 3
                          ? 'bg-slate-800/20 hover:bg-slate-800/40'
                          : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-5 py-4 font-bold text-slate-300">
                      {medal ?? <span className="text-slate-500 text-xs">{entry.position}</span>}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-100">
                      {entry.display_name}
                      {isMe && <span className="ml-2 text-xs text-copa-red">(você)</span>}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-copa-red">{entry.score}</td>
                    <td className="px-5 py-4 text-right text-slate-500">{entry.score_breakdown?.games_played ?? 0}</td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${entry.id}-detail`} className="border-t border-slate-800 bg-[#070d1a]">
                      <td colSpan={4} className="px-5 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {Object.entries(BREAKDOWN_LABELS).map(([key, label]) => (
                            <div key={key} className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2.5">
                              <div className="text-slate-500 text-xs mb-1">{label}</div>
                              <div className="font-bold text-slate-100 text-sm">{entry.score_breakdown?.[key] ?? 0} pts</div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        {standings.length === 0 && (
          <p className="text-center text-slate-500 py-12">Nenhum participante ainda.</p>
        )}
      </div>
    </div>
  );
}
