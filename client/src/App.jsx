import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Header from './components/Header';
import TabNav from './components/TabNav';
import BrazilCountdown from './components/BrazilCountdown';
import Predictions from './pages/Predictions';
import Matches from './pages/Matches';
import PreTournament from './pages/PreTournament';
import Standings from './pages/Standings';
import Admin from './pages/Admin';
import Report from './pages/Report';
import Rules from './pages/Rules';

export default function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('predictions');

  useEffect(() => {
    if (user?.role === 'guest') setActiveTab('standings');
  }, [user?.role]);

  if (!user) return <Login />;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-50">
        <Header />
        <BrazilCountdown />
        <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'predictions' && <Predictions />}
        {activeTab === 'pre-tournament' && <PreTournament />}
        {activeTab === 'standings' && <Standings />}
        {activeTab === 'rules' && <Rules />}
        {activeTab === 'report' && <Report />}
        {activeTab === 'admin' && user.role === 'admin' && <Admin />}
      </main>
    </div>
  );
}
