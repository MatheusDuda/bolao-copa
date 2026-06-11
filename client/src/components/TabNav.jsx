import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'predictions', label: 'Palpites' },
  { id: 'matches', label: 'Jogos' },
  { id: 'pre-tournament', label: 'Pré-torneio' },
  { id: 'standings', label: 'Classificação' },
  { id: 'admin', label: 'Admin', adminOnly: true },
];

export default function TabNav({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  const tabs = TABS.filter(t => !t.adminOnly || user?.role === 'admin');

  return (
    <nav className="bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-800 sticky top-[52px] z-40">
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
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
