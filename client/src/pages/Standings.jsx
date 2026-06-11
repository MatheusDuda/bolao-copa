import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const BREAKDOWN_LABELS = {
  match_points: 'Jogos',
  champion: 'Campeão',
  top_scorer: 'Artilheiro',
  best_attack: 'Melhor ataque',
  best_defense: 'Melhor defesa',
  neymar: 'Neymar',
  brazil: 'Brasil'
};

export default function Standings() {
  const { effectiveUser } = useAuth();
  const [standings, setStandings] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStandings().then(s => { setStandings(s); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold mb-4 text-copa-red">Classificação</h2>
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 text-gray-400 text-left">
              <th className="px-4 py-3 w-10">#</th>
              <th className="px-4 py-3">Participante</th>
              <th className="px-4 py-3 text-right">Pts</th>
              <th className="px-4 py-3 text-right pr-4">Jogos</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((entry, i) => {
              const isMe = entry.id === effectiveUser.id;
              const isExpanded = expanded === entry.id;
              const extraPts = entry.score - (entry.score_breakdown?.match_points ?? 0);
              return (
                <>
                  <tr
                    key={entry.id}
                    onClick={() => setExpanded(isExpanded ? null : entry.id)}
                    className={`border-t border-gray-700 cursor-pointer transition-colors ${
                      isMe ? 'bg-copa-blue/30 hover:bg-copa-blue/40' : 'hover:bg-gray-700/50'
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-gray-300">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : entry.position}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {entry.display_name}
                      {isMe && <span className="ml-2 text-xs text-copa-red">(você)</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-copa-red">{entry.score}</td>
                    <td className="px-4 py-3 text-right text-gray-400 pr-4">{entry.score_breakdown?.match_points ?? 0}</td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${entry.id}-detail`} className="bg-gray-900/50 border-t border-gray-700">
                      <td colSpan={4} className="px-6 py-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {Object.entries(BREAKDOWN_LABELS).map(([key, label]) => (
                            <div key={key} className="bg-gray-800 rounded-lg px-3 py-2">
                              <div className="text-gray-400">{label}</div>
                              <div className="font-bold text-gray-100">{entry.score_breakdown?.[key] ?? 0} pts</div>
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
          <p className="text-center text-gray-400 py-8">Nenhum participante ainda.</p>
        )}
      </div>
    </div>
  );
}
