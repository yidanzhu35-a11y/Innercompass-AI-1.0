import React, { useState, useEffect } from 'react';
import { UserData, TopicState, AppView, Message } from './types';
import { Dashboard } from './pages/Dashboard';
import { ChatRoom } from './pages/ChatRoom';
import { Report } from './pages/Report';
import { Button } from './components/Button';
import { APP_DATA } from './data';
import { getCurrentUser, getUserData } from './services/authService';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Selection State
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        const currentUser = await getCurrentUser();
        if (currentUser) {
          const userData = await getUserData(currentUser.uid);
          setUser(userData);
          setView(AppView.DASHBOARD);
        } else {
          setView(AppView.LOGIN);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setView(AppView.LOGIN);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLoginSuccess = async () => {
    try {
      setIsLoading(true);
      setAuthError(null); // Clear any previous errors
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const userData = await getUserData(currentUser.uid);
        setUser(userData);
        setView(AppView.DASHBOARD);
      } else {
        setAuthError('无法获取用户信息，请重试');
      }
    } catch (error: any) {
      console.error('Error after login:', error);
      setAuthError(error.message || '登录后处理失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSuccess = async () => {
    try {
      setIsLoading(true);
      setAuthError(null); // Clear any previous errors
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const userData = await getUserData(currentUser.uid);
        setUser(userData);
        setView(AppView.DASHBOARD);
      } else {
        setAuthError('无法获取新注册的用户信息，请重试');
      }
    } catch (error: any) {
      console.error('Error after registration:', error);
      setAuthError(error.message || '注册后处理失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      // Note: We're not actually logging out here
      // This would require the logout function from authService
      // For now, we'll just clear local state
      setUser(null);
      setView(AppView.LOGIN);
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTopic = (moduleId: string, topicId: string) => {
    setActiveModuleId(moduleId);
    setActiveTopicId(topicId);
    setView(AppView.CHAT);
  };

  const handleSaveProgress = async (
    topicKey: string, 
    messages: Message[], 
    userSummary: string, 
    aiSummary: string, 
    isCompleted: boolean
  ) => {
    if (!user) return;
    
    try {
      const newProgress = { ...user.progress };
      newProgress[topicKey] = {
        isCompleted,
        messages,
        userSummary,
        aiSummary
      };
      
      setUser({ ...user, progress: newProgress });
      
      // Update in Firestore would go here
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // --- Render Logic ---

  if (view === AppView.LOGIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-md">
          {authError && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-center">
              {authError}
            </div>
          )}
          {authMode === 'login' ? (
            <Login onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setAuthMode('register')} />
          ) : (
            <Register onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={() => setAuthMode('login')} />
          )}
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