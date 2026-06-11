import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('betolao_session') || 'null'); } catch { return null; }
  });
  const [votingAs, setVotingAsState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('betolao_voting_as') || 'null'); } catch { return null; }
  });

  const login = useCallback(async (username, password) => {
    const data = await api.login(username, password);
    localStorage.setItem('betolao_session', JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('betolao_session');
    localStorage.removeItem('betolao_voting_as');
    setUser(null);
    setVotingAsState(null);
  }, []);

  const setVotingAs = useCallback((targetUser) => {
    if (targetUser) {
      localStorage.setItem('betolao_voting_as', JSON.stringify(targetUser));
    } else {
      localStorage.removeItem('betolao_voting_as');
    }
    setVotingAsState(targetUser);
  }, []);

  const loginAsGuest = useCallback(() => {
    setUser({ id: null, role: 'guest', display_name: 'Visitante' });
  }, []);

  const effectiveUser = votingAs || user;

  return (
    <AuthContext.Provider value={{ user, votingAs, effectiveUser, login, logout, loginAsGuest, setVotingAs }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
