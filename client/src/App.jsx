import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Header from './components/Header';
import TabNav from './components/TabNav';
import Predictions from './pages/Predictions';
import Matches from './pages/Matches';
import PreTournament from './pages/PreTournament';
import Standings from './pages/Standings';
import Admin from './pages/Admin';

export default function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('predictions');

  if (!user) return <Login />;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'predictions' && <Predictions />}
        {activeTab === 'matches' && <Matches />}
        {activeTab === 'pre-tournament' && <PreTournament />}
        {activeTab === 'standings' && <Standings />}
        {activeTab === 'admin' && user.role === 'admin' && <Admin />}
      </main>
    </div>
  );
}
