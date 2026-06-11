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
    <nav className="bg-gray-900 border-b border-gray-700">
      <div className="max-w-4xl mx-auto px-4 flex overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-copa-red text-copa-red'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
