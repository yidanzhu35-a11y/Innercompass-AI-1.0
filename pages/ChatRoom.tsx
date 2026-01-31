import React, { useState, useEffect, useRef } from 'react';
import { Module, Topic, Message, UserData } from '../types';
import { Button } from '../components/Button';
import { generateCoachResponse, generateTopicSummary } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface ChatRoomProps {
  module: Module;
  topic: Topic;
  user: UserData;
  onSaveProgress: (topicId: string, messages: Message[], userSummary: string, aiSummary: string, isCompleted: boolean) => void;
  onBack: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ module, topic, user, onSaveProgress, onBack }) => {
  const topicKey = `${module.id}-${topic.id}`;
  const savedState = user.progress[topicKey];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState<'chat' | 'summarize'>('chat');
  const [summaryInput, setSummaryInput] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const summaryInputRef = useRef<HTMLTextAreaElement>(null);

  // Determine if this module uses the Questionnaire flow (Talents)
  const isQuestionnaireModule = module.id === 'talents';

  // Initialize chat
  useEffect(() => {
    if (savedState && savedState.messages.length > 0) {
      setMessages(savedState.messages);
      if (savedState.isCompleted) {
        setMode('summarize');
        setSummaryInput(savedState.userSummary);
      }
    } else {
      if (isQuestionnaireModule) {
        // Questionnaire Mode Initialization
        // Message 1: Intro context
        const introMessage: Message = {
          id: 'init-intro',
          role: 'assistant',
          content: `**${topic.title}**\n\n${topic.mainPrompt}\n\n${topic.intro ? `> ${topic.intro}` : ''}`,
          timestamp: Date.now()
        };
        // Message 2: First Question
        const firstQuestionMsg: Message = {
          id: 'init-q1',
          role: 'assistant',
          content: topic.divergingQuestions[0],
          timestamp: Date.now() + 1
        };
        setMessages([introMessage, firstQuestionMsg]);
      } else {
        // Standard Mode Initialization (Values, Passions)
        const initialMessage: Message = {
          id: 'init-1',
          role: 'assistant',
          content: `欢迎来到 **${module.title}** - **${topic.title}**。\n\n**核心议题：**\n${topic.mainPrompt}\n\n${topic.intro ? `> ${topic.intro}\n\n` : ''}**你可以参考以下角度进行思考：**\n${topic.divergingQuestions.map(q => `- ${q}`).join('\n')}\n\n请把你此刻的想法告诉我，我会陪伴你一起深入探索。`,
          timestamp: Date.now()
        };
        setMessages([initialMessage]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module.id, topic.id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, mode]);

  // Auto-resize chat input
  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
      chatInputRef.current.style.height = `${chatInputRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Auto-resize summary input
  useEffect(() => {
    if (summaryInputRef.current) {
      summaryInputRef.current.style.height = 'auto';
      summaryInputRef.current.style.height = `${summaryInputRef.current.scrollHeight}px`;
    }
  }, [summaryInput]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    if (isQuestionnaireModule) {
        // Questionnaire Logic
        // Count how many answers the user has given (including the one just sent)
        const userAnswersCount = newMessages.filter(m => m.role === 'user').length;
        const totalQuestions = topic.divergingQuestions.length;

        if (userAnswersCount < totalQuestions) {
            // Logic: There are still questions to ask
            const nextQuestion = topic.divergingQuestions[userAnswersCount];
            const nextQMsg: Message = {
                id: `q-${userAnswersCount}`,
                role: 'assistant',
                content: nextQuestion,
                timestamp: Date.now()
            };
            
            // Simulate a small delay for natural feel
            setIsTyping(true);
            setTimeout(() => {
                setMessages(prev => [...prev, nextQMsg]);
                setIsTyping(false);
                onSaveProgress(topicKey, [...newMessages, nextQMsg], '', '', false);
            }, 600);

        } else {
            // Logic: All questions answered, trigger AI analysis
            setIsTyping(true);
            try {
                // The AI will see the full Q&A history and provide insights/follow-up
                const aiResponseText = await generateCoachResponse(topic, newMessages, user.username);
                
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: aiResponseText,
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, aiMsg]);
                onSaveProgress(topicKey, [...newMessages, aiMsg], '', '', false);
            } catch (error) {
                console.error("Chat error", error);
            } finally {
                setIsTyping(false);
            }
        }
    } else {
        // Standard Chat Logic (Values/Passions)
        setIsTyping(true);
        try {
            const aiResponseText = await generateCoachResponse(topic, newMessages, user.username);
            
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiResponseText,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, aiMsg]);
            onSaveProgress(topicKey, [...newMessages, aiMsg], '', '', false);
        } catch (error) {
            console.error("Chat error", error);
        } finally {
            setIsTyping(false);
        }
    }
  };

  const handleCompleteTopic = async () => {
    setMode('summarize');
  };

  const handleSubmitSummary = async () => {
    if (!summaryInput.trim()) return;
    setIsGeneratingSummary(true);

    try {
      const aiSummary = await generateTopicSummary(topic, messages, summaryInput);
      
      // Save final state
      onSaveProgress(topicKey, messages, summaryInput, aiSummary, true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (savedState?.isCompleted && !isGeneratingSummary) {
    // Read-only view for completed topics
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>&larr; 返回</Button>
            <div>
              <h2 className="font-bold text-slate-800">{topic.title}</h2>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">已完成</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full">
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">你的总结</h3>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{savedState.userSummary}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-indigo-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🧞‍♂️</span>
                    <h3 className="text-lg font-bold text-indigo-900">AI 教练洞察</h3>
                </div>
                <div className="prose prose-indigo max-w-none text-slate-700">
                    <ReactMarkdown>{savedState.aiSummary}</ReactMarkdown>
                </div>
            </div>
            <div className="mt-8 text-center">
                <Button onClick={onBack}>继续探索其他议题</Button>
            </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </Button>
          <div className="flex flex-col">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <span>{module.icon}</span> {topic.title}
            </h2>
            {isQuestionnaireModule && mode === 'chat' && (
               <span className="text-xs text-slate-500">
                  {Math.min(messages.filter(m => m.role === 'user').length + 1, topic.divergingQuestions.length)} / {topic.divergingQuestions.length} 题
               </span>
            )}
          </div>
        </div>
        {mode === 'chat' && messages.length > 2 && (
          <Button size="sm" variant="outline" onClick={handleCompleteTopic}>
            结束探索并总结
          </Button>
        )}
      </header>

      {/* Chat Area */}
      {mode === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 scrollbar-hide">
            {messages.map((msg) => {
              // Determine if this message is a predefined question (from divergingQuestions or initial prompts)
              const isPredefinedQuestion = msg.role === 'assistant' && 
                                    (topic.divergingQuestions.includes(msg.content) ||
                                     msg.id.startsWith('init-'));
              
              return (
              <div
                key={msg.id}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} p-1`}
              >
                <div className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                  {/* Icon for different message types */}
                  {msg.role === 'assistant' && !isPredefinedQuestion && (
                    <div className="mt-1 text-lg flex-shrink-0">💡</div>
                  )}
                  {isPredefinedQuestion && (
                    <div className="mt-1 text-lg flex-shrink-0">📓</div>
                  )}
                  
                  <div
                    className={`rounded-2xl px-5 py-3 shadow-sm text-sm sm:text-base leading-relaxed prose max-w-none
                      ${msg.role === 'user' 
                        ? 'bg-primary-600 text-white rounded-br-none prose-invert w-auto min-w-[100px] max-w-[90%] sm:max-w-[85%]'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none prose-slate w-auto min-w-[100px] max-w-[90%] sm:max-w-[85%]'
                      }`}
                  >
                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    ) : (
                      <ReactMarkdown 
                        components={{
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
            {isTyping && (
               <div className="flex justify-start w-full">
                 <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center gap-1">
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="max-w-4xl mx-auto flex gap-2 items-end">
              <textarea
                ref={chatInputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    if (!isTyping) {
                      handleSendMessage();
                    }
                  }
                }}
                placeholder="在此输入你的回答... (Cmd + Enter 发送)"
                className="flex-1 resize-none rounded-xl border-slate-300 focus:border-primary-500 focus:ring-primary-500 p-3 text-slate-900 shadow-sm min-h-[50px] overflow-hidden max-h-[50vh]"
                rows={1}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!input.trim() || isTyping}
                className="h-[50px]"
              >
                发送
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Summary Mode Overlay */}
      {mode === 'summarize' && (
        <div className="absolute inset-0 bg-slate-50 z-20 flex flex-col items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 flex flex-col max-h-full">
             <div className="text-center mb-6 shrink-0">
                <span className="text-4xl mb-2 block">📝</span>
                <h3 className="text-2xl font-bold text-slate-800">这一节的探索结束了</h3>
                <p className="text-slate-600 mt-2">请花一点时间，总结你在这次对话中最重要的发现。</p>
             </div>
             
             <textarea
                ref={summaryInputRef}
                value={summaryInput}
                onChange={(e) => setSummaryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    if (!isGeneratingSummary) {
                      handleSubmitSummary();
                    }
                  }
                }}
                placeholder="我的核心发现是... (Cmd + Enter 提交)"
                className="w-full min-h-[160px] max-h-[50vh] rounded-xl border-slate-300 focus:border-primary-500 focus:ring-primary-500 p-4 text-slate-900 mb-6 resize-none overflow-hidden"
             />

             <div className="flex justify-end gap-3 shrink-0">
                <Button variant="ghost" onClick={() => setMode('chat')} disabled={isGeneratingSummary}>返回对话</Button>
                <Button onClick={handleSubmitSummary} isLoading={isGeneratingSummary} disabled={!summaryInput.trim()}>
                   生成 AI 洞察报告
                </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};