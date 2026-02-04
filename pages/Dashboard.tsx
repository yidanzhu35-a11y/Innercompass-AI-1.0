import React from 'react';
import { APP_DATA } from '../data';
import { Module, UserData, Message } from '../types';
import { Button } from '../components/Button';

interface DashboardProps {
  user: UserData;
  onSelectTopic: (moduleId: string, topicId: string) => void;
  onViewReport: () => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onSelectTopic, onViewReport, onLogout }) => {
  // Calculate progress stats
  const totalTopics = APP_DATA.reduce((acc, mod) => acc + mod.topics.length, 0);
  const completedTopics = Object.values(user.progress).filter(p => p.isCompleted).length;
  const progressPercent = Math.round((completedTopics / totalTopics) * 100);

  // Export exploration records to TXT
  const handleExportRecords = () => {
    let exportContent = `InnerCompass AI 探索记录\n`;
    exportContent += `=================================\n`;
    exportContent += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
    exportContent += `探索用户: ${user.username}\n`;
    exportContent += `完成议题: ${completedTopics}/${totalTopics}\n`;
    exportContent += `=================================\n\n`;

    // Export module by module
    APP_DATA.forEach(module => {
      exportContent += `【${module.icon} ${module.title}】\n`;
      exportContent += `${module.description}\n\n`;

      module.topics.forEach(topic => {
        const topicKey = `${module.id}-${topic.id}`;
        const progress = user.progress[topicKey];

        if (progress) {
          exportContent += `  ◆ ${topic.title}\n`;
          exportContent += `  ${topic.mainPrompt}\n\n`;

          // Export messages
          if (progress.messages && progress.messages.length > 0) {
            exportContent += `  对话记录:\n`;
            progress.messages.forEach((msg) => {
              const sender = msg.role === 'user' ? '你' : 'AI';
              exportContent += `  ${sender}: ${msg.content.replace(/\n/g, ' ')}\n`;
            });
            exportContent += `\n`;
          }

          // Export summaries
          if (progress.isCompleted && (progress.userSummary || progress.aiSummary)) {
            if (progress.userSummary) {
              exportContent += `  你的总结:\n`;
              exportContent += `  ${progress.userSummary}\n\n`;
            }
            if (progress.aiSummary) {
              exportContent += `  AI总结:\n`;
              exportContent += `  ${progress.aiSummary.replace(/\n/g, ' ')}\n\n`;
            }
          }

          exportContent += `  ---------------------------------\n\n`;
        }
      });

      exportContent += `=================================\n\n`;
    });

    // Create and download TXT file
    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `InnerCompass-探索记录-${user.username}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-800">InnerCompass AI</h1>
            <p className="text-sm text-slate-500">你好，{user.username}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onLogout}>退出</Button>
            {completedTopics > 0 && (
              <>
                <Button variant="secondary" size="sm" onClick={handleExportRecords}>
                  导出探索记录
                </Button>
                <Button variant="secondary" size="sm" onClick={onViewReport}>
                  查看个人总结
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Progress Bar */}
        <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-lg font-semibold text-slate-800">探索进度</h2>
            <span className="text-2xl font-bold text-primary-600">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div 
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            完成 {completedTopics} / {totalTopics} 个议题
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {APP_DATA.map((module) => (
            <div key={module.id} className="flex flex-col space-y-4">
              {/* Module Header Card */}
              <div className={`p-6 rounded-2xl border ${module.color} shadow-sm h-40 flex flex-col justify-between`}>
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{module.icon}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{module.title}</h3>
                  <p className="text-sm opacity-90 mt-1 line-clamp-2">{module.description}</p>
                </div>
              </div>

              {/* Topics List */}
              <div className="flex flex-col space-y-3">
                {module.topics.map((topic) => {
                  const topicKey = `${module.id}-${topic.id}`;
                  const isDone = user.progress[topicKey]?.isCompleted;
                  
                  return (
                    <button
                      key={topic.id}
                      onClick={() => onSelectTopic(module.id, topic.id)}
                      className={`group relative p-4 bg-white rounded-xl border-2 text-left transition-all duration-200 
                        ${isDone 
                          ? 'border-green-100 hover:border-green-200 bg-green-50/30' 
                          : 'border-white hover:border-primary-100 shadow-sm hover:shadow-md'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${isDone ? 'text-green-800' : 'text-slate-700'}`}>
                          {topic.title}
                        </span>
                        {isDone ? (
                          <span className="text-green-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          </span>
                        ) : (
                          <span className="text-slate-300 group-hover:text-primary-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};