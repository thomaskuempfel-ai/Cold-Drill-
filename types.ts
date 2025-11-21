

export enum AppState {
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  GENERATING = 'GENERATING',
  CALLING = 'CALLING',
  DEBRIEF = 'DEBRIEF',
}

export enum DifficultyLevel {
  MERCY = 'MERCY',      // Avg Score < 5
  BRUTAL = 'BRUTAL',    // Avg Score 5-8 (Default)
  NIGHTMARE = 'NIGHTMARE' // Avg Score > 8
}

export interface UserContext {
  contextString: string; // "SaaS cybersecurity -> CISOs -> never closed"
  fieldOfWork?: string;
  experience?: string;
  language?: string; // 'English (US)', 'Spanish', etc.
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  description: string;
  voiceName: string; // 'Puck', 'Kore', 'Fenrir', etc.
  systemInstruction: string;
  avatarUrl?: string;
  linkedinStats?: string;
  attitude?: string;
}

export interface CallResult {
  score: number;
  roast: string;
  fix: string;
  specificFix?: string; // Specific sentence to say
  transcript: TranscriptItem[];
  fillerCount: number;
  timestamp: number;
  terminationReason?: string; // e.g. 'Silence', 'User Ended', 'AI Ended'
  terminationAnalysis?: string; // AI explanation of why it ended
}

export interface TranscriptItem {
  speaker: 'user' | 'ai';
  text: string;
}

export interface LeaderboardEntry {
  rank: number;
  score: number;
  name: string;
}

export interface CallHistoryItem {
  score: number;
  date: number;
  transcript?: TranscriptItem[]; // Added for Advisor context
}
