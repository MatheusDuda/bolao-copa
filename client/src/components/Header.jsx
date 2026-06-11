import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, votingAs, setVotingAs, logout } = useAuth();
  const isVoting = !!votingAs;

  return (
    <header className="sticky top-0 z-50">
      <div className={`${isVoting ? 'bg-orange-900/40 border-b border-orange-700' : 'bg-[#030712] border-b border-slate-800'} transition-colors`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight">
              <span className="text-white">Beto</span><span className="text-copa-green">lão</span>
              <span className="ml-1">⚽</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isVoting ? (
              <>
                <span className="text-sm font-semibold text-orange-200">
                  Votando por <span className="underline">{votingAs.display_name}</span>
                </span>
                <button
                  onClick={() => setVotingAs(null)}
                  className="text-xs bg-orange-700/60 hover:bg-orange-700 text-orange-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Voltar ao admin
                </button>
              </>
            ) : (
              <span className="text-sm text-slate-300">{user?.display_name}</span>
            )}
            <button
              onClick={logout}
              className="text-sm text-slate-300 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-800"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
      <div
        className="h-[3px] w-full"
        style={{ background: 'linear-gradient(90deg, #DC2626 0% 33.33%, #009C3B 33.33% 66.66%, #002776 66.66% 100%)' }}
      />
    </header>
  );
}
