export type ModuleType = 'values' | 'talents' | 'passions';

export interface DivergingQuestion {
  id: string;
  text: string;
}

export interface Topic {
  id: string;
  title: string;
  mainPrompt: string;
  intro?: string; // Added optional intro text
  divergingQuestions: string[]; // Simple array of strings for list display
}

export interface Module {
  id: ModuleType;
  title: string;
  description: string;
  icon: string; // Emoji char
  color: string;
  topics: Topic[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface TopicState {
  isCompleted: boolean;
  userSummary: string;
  aiSummary: string;
  messages: Message[];
}

export interface UserData {
  username: string;
  email?: string;
  uid?: string;
  progress: Record<string, TopicState>; // Key is composite "moduleId-topicId"
}

export enum AppView {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  REPORT = 'REPORT'
}