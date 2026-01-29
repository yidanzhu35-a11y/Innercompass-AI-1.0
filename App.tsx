import React, { useState, useEffect } from 'react';
import { UserData, TopicState, AppView, Message } from './types';
import { Dashboard } from './pages/Dashboard';
import { ChatRoom } from './pages/ChatRoom';
import { Report } from './pages/Report';
import { Button } from './components/Button';
import { APP_DATA } from './data';

const STORAGE_KEY = 'inner_compass_data';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [user, setUser] = useState<UserData | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  
  // Selection State
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  // Load user from storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setUser(JSON.parse(saved));
      setView(AppView.DASHBOARD);
    }
  }, []);

  // Save user to storage whenever user object changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  }, [user]);

  const handleLogin = () => {
    if (!usernameInput.trim()) return;
    const newUser: UserData = {
      username: usernameInput,
      progress: {}
    };
    setUser(newUser);
    setView(AppView.DASHBOARD);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setView(AppView.LOGIN);
    setUsernameInput('');
  };

  const handleSelectTopic = (moduleId: string, topicId: string) => {
    setActiveModuleId(moduleId);
    setActiveTopicId(topicId);
    setView(AppView.CHAT);
  };

  const handleSaveProgress = (
    topicKey: string, 
    messages: Message[], 
    userSummary: string, 
    aiSummary: string, 
    isCompleted: boolean
  ) => {
    if (!user) return;
    
    const newProgress = { ...user.progress };
    newProgress[topicKey] = {
      isCompleted,
      messages,
      userSummary,
      aiSummary
    };
    
    setUser({ ...user, progress: newProgress });
  };

  // --- Render Logic ---

  if (view === AppView.LOGIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <div className="mb-6 text-6xl">🧭</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">InnerCompass AI</h1>
          <p className="text-slate-500 mb-8">开始你的自我发现之旅：价值观、天赋与热情。</p>
          
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="请输入你的名字" 
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button onClick={handleLogin} className="w-full py-3 text-lg">开始旅程</Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === AppView.CHAT && user && activeModuleId && activeTopicId) {
    const module = APP_DATA.find(m => m.id === activeModuleId);
    const topic = module?.topics.find(t => t.id === activeTopicId);

    if (module && topic) {
      return (
        <ChatRoom 
          module={module} 
          topic={topic} 
          user={user}
          onSaveProgress={handleSaveProgress}
          onBack={() => setView(AppView.DASHBOARD)}
        />
      );
    }
  }

  if (view === AppView.REPORT && user) {
      return <Report user={user} onBack={() => setView(AppView.DASHBOARD)} />
  }

  if (view === AppView.DASHBOARD && user) {
    return (
      <Dashboard 
        user={user} 
        onSelectTopic={handleSelectTopic} 
        onViewReport={() => setView(AppView.REPORT)}
        onLogout={handleLogout}
      />
    );
  }

  return <div>Loading...</div>;
};

export default App;