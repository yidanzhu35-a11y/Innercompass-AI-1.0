import React, { useEffect, useState } from 'react';
import { UserData, ModuleType } from '../types';
import { APP_DATA } from '../data';
import { Button } from '../components/Button';
import { generateHolisticReport } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface ReportProps {
  user: UserData;
  onBack: () => void;
}

export const Report: React.FC<ReportProps> = ({ user, onBack }) => {
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      // Check if we have cached report in localStorage (optional, avoiding simple string match here)
      // For now, we generate fresh if not in state, or could store in UserData but keeping it simple.
      
      const completedData: Record<string, any> = {};
      let hasData = false;

      APP_DATA.forEach(mod => {
        mod.topics.forEach(topic => {
          const key = `${mod.id}-${topic.id}`;
          if (user.progress[key]?.isCompleted) {
             completedData[key] = {
                moduleTitle: mod.title,
                topicTitle: topic.title,
                userSummary: user.progress[key].userSummary,
                aiSummary: user.progress[key].aiSummary
             };
             hasData = true;
          }
        });
      });

      if (!hasData) {
        setReport("请先完成至少一个议题的探索。");
        return;
      }

      setIsLoading(true);
      const generated = await generateHolisticReport(completedData);
      setReport(generated);
      setIsLoading(false);
    };

    fetchReport();
  }, [user]);

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center gap-4 shrink-0">
            <Button variant="ghost" onClick={onBack}>&larr; 返回仪表盘</Button>
            <h1 className="text-xl font-bold text-slate-800">全维自我发现报告</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sm:p-12">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-6">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <h3 className="text-xl font-medium text-slate-700">AI 正在整合你的生命数据...</h3>
                        <p className="text-slate-500">正在分析价值观、天赋与热情的连接点</p>
                    </div>
                ) : (
                    <div className="prose prose-lg prose-slate max-w-none">
                       {report ? <ReactMarkdown>{report}</ReactMarkdown> : <p>无数据。</p>}
                    </div>
                )}
            </div>
        </main>
    </div>
  );
};