import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, votingAs, setVotingAs, logout } = useAuth();
  const isVoting = !!votingAs;

  return (
    <header className={`sticky top-0 z-50 ${isVoting ? 'bg-orange-600' : 'bg-gray-900'} border-b border-gray-700 transition-colors`}>
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚽</span>
          <span className="font-bold text-copa-yellow text-lg">Betolão</span>
        </div>
        <div className="flex items-center gap-3">
          {isVoting ? (
            <>
              <span className="text-sm font-semibold text-white">
                Votando por <span className="underline">{votingAs.display_name}</span>
              </span>
              <button
                onClick={() => setVotingAs(null)}
                className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg transition-colors"
              >
                Voltar ao admin
              </button>
            </>
          ) : (
            <span className="text-sm text-gray-300">{user?.display_name}</span>
          )}
          <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-200 transition-colors">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
