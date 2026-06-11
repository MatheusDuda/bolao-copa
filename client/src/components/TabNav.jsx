import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const TABS = [
  { id: 'predictions', label: 'Palpites', authRequired: true },
  { id: 'pre-tournament', label: 'Pré-torneio', authRequired: true },
  { id: 'standings', label: 'Classificação' },
  { id: 'rules', label: 'Regras' },
  { id: 'report', label: 'Reportar erro', authRequired: true },
  { id: 'admin', label: 'Admin', adminOnly: true },
];

export default function TabNav({ activeTab, setActiveTab }) {
  const { user, effectiveUser } = useAuth();
  const isGuest = user?.role === 'guest';
  const tabs = TABS.filter(t => {
    if (t.adminOnly && user?.role !== 'admin') return false;
    if (t.authRequired && isGuest) return false;
    return true;
  });
  const [pretournamentDone, setPretournamentDone] = useState(true);

  useEffect(() => {
    if (!effectiveUser?.id) return;
    api.getPreTournament(effectiveUser.id).then(pick => {
      setPretournamentDone(pick !== null);
    });
  }, [effectiveUser?.id, activeTab]);

  return (
    <nav className="bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-copa-red text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-white font-medium'
            }`}
          >
            <span className="flex items-center gap-1">
              {tab.label}
              {tab.id === 'pre-tournament' && !pretournamentDone && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold leading-none">
                  !
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
