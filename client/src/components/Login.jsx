import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loginAsGuest } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚽</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Betolão</h1>
          <p className="text-slate-500 mt-1 text-sm">Copa do Mundo 2026</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">Usuário</label>
            <input className="input" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label">Senha</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <button
            type="button"
            onClick={loginAsGuest}
            className="w-full text-sm text-slate-400 hover:text-white transition-colors py-2 text-center"
          >
            Visualizar sem login →
          </button>
        </form>
        <div className="h-0.5 w-full mt-0 rounded-b-xl overflow-hidden" style={{ background: 'linear-gradient(90deg, #DC2626 0%, #DC2626 33%, #009C3B 33%, #009C3B 66%, #002776 66%, #002776 100%)' }} />
      </div>
    </div>
  );
}
