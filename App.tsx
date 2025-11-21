import React, { useState, useEffect } from 'react';
import { AppState, UserContext, Persona, CallResult, TranscriptItem, CallHistoryItem, DifficultyLevel } from './types';
import { CALL_TARGETS, PERSONAS, OBJECTION_SCENARIOS } from './constants';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { ActiveCall } from './components/ActiveCall';
import { Debrief } from './components/Debrief';
import { Advisor } from './components/Advisor';
import { generatePersona } from './utils/generator';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.ONBOARDING);
  const [userContext, setUserContext] = useState<UserContext>({ contextString: '', fieldOfWork: '', experience: '', language: 'English (US)' });
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
  const [lastResult, setLastResult] = useState<CallResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [failStreak, setFailStreak] = useState(0);
  const [isPenaltyActive, setIsPenaltyActive] = useState(true);
  const [latestTranscript, setLatestTranscript] = useState<TranscriptItem[]>([]);
  const [lastCallReason, setLastCallReason] = useState<string>('');
  const [history, setHistory] = useState<CallHistoryItem[]>([]);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isProMode, setIsProMode] = useState(false);
  const [currentTarget, setCurrentTarget] = useState(() => CALL_TARGETS[Math.floor(Math.random() * CALL_TARGETS.length)]);
  const [selectedScenario, setSelectedScenario] = useState<string>('default');

  useEffect(() => {
    const stored = localStorage.getItem('cold_drill_context_v2');
    const oldStored = localStorage.getItem('cold_drill_context');
    const storedHistory = localStorage.getItem('cold_drill_history_v2');
    const storedPro = localStorage.getItem('cold_drill_pro_mode');
    
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (parsed) {
                setUserContext(parsed);
                setAppState(AppState.DASHBOARD);
            }
        } catch(e) {
             if (oldStored) {
                 setUserContext({ contextString: oldStored, fieldOfWork: '', experience: '', language: 'English (US)' });
                 setAppState(AppState.DASHBOARD);
             }
        }
    } else if (oldStored) {
        setUserContext({ contextString: oldStored, fieldOfWork: '', experience: '', language: 'English (US)' });
        setAppState(AppState.DASHBOARD);
    }

    if (storedHistory) {
        try {
            const parsed = JSON.parse(storedHistory);
            if (Array.isArray(parsed)) {
                setHistory(parsed);
            } else {
                setHistory([]);
            }
        } catch (e) { 
            console.error(e); 
            setHistory([]);
        }
    }

    if (storedPro === 'true') {
        setIsProMode(true);
    }
  }, []);

  const handleTogglePro = () => {
      const newVal = !isProMode;
      setIsProMode(newVal);
      localStorage.setItem('cold_drill_pro_mode', String(newVal));
  };

  const getDifficulty = (): DifficultyLevel => {
    if (isProMode) return DifficultyLevel.NIGHTMARE; 
    if (history.length < 2) return DifficultyLevel.BRUTAL;
    const last5 = history.slice(-5).map(h => h.score);
    const avg = last5.reduce((a,b) => a+b, 0) / last5.length;
    
    if (avg < 5) return DifficultyLevel.MERCY;
    if (avg > 8) return DifficultyLevel.NIGHTMARE;
    return DifficultyLevel.BRUTAL;
  };

  const handleOnboardingComplete = (context: string, language: string) => {
    const newContext = { contextString: context, fieldOfWork: '', experience: '', language };
    setUserContext(newContext);
    localStorage.setItem('cold_drill_context_v2', JSON.stringify(newContext));
    setAppState(AppState.DASHBOARD);
  };

  const handleUpdateContext = (newContext: UserContext) => {
    setUserContext(newContext);
    localStorage.setItem('cold_drill_context_v2', JSON.stringify(newContext));
  };

  const handleStartCall = async () => {
    setAppState(AppState.GENERATING);
    try {
        const diff = getDifficulty();
        const persona = await generatePersona(userContext, diff);
        setCurrentPersona(persona);
        setAppState(AppState.CALLING);
    } catch (error) {
        console.error("Failed to generate persona", error);
        // Fallback to local persona if API fails
        setCurrentPersona(PERSONAS[Math.floor(Math.random() * PERSONAS.length)]);
        setAppState(AppState.CALLING);
    }
  };

  const handleEndCall = (transcript: TranscriptItem[], reason: string = 'UNKNOWN') => {
      setLatestTranscript(transcript);
      setLastCallReason(reason);
      setAppState(AppState.DEBRIEF);
  };

  const handleDebriefResult = (result: CallResult) => {
      setLastResult(result);
      const newHistory = [...history, { score: result.score, date: result.timestamp, transcript: result.transcript }];
      setHistory(newHistory);
      localStorage.setItem('cold_drill_history_v2', JSON.stringify(newHistory));
      
      if (result.score >= 8) {
          setStreak(s => s + 1);
          setFailStreak(0);
      } else {
          setStreak(0);
          setFailStreak(s => s + 1);
      }

      // Rotate target
      setCurrentTarget(CALL_TARGETS[Math.floor(Math.random() * CALL_TARGETS.length)]);
  };

  const handleBackToDashboard = () => {
      setAppState(AppState.DASHBOARD);
  };

  const handleRetry = () => {
      if (currentPersona) {
        setAppState(AppState.CALLING);
      } else {
        handleStartCall();
      }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white font-mono selection:bg-red-500 selection:text-white">
      {appState === AppState.ONBOARDING && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {(appState === AppState.DASHBOARD || appState === AppState.GENERATING) && (
        <Dashboard
          lastResult={lastResult}
          onStartCall={handleStartCall}
          history={history}
          onOpenAdvisor={() => setIsAdvisorOpen(true)}
          userContext={userContext}
          onUpdateContext={handleUpdateContext}
          isProMode={isProMode}
          onTogglePro={handleTogglePro}
          target={currentTarget}
          isGenerating={appState === AppState.GENERATING}
          selectedScenario={selectedScenario}
          onSelectScenario={setSelectedScenario}
        />
      )}

      {appState === AppState.CALLING && currentPersona && (
        <ActiveCall
          persona={currentPersona}
          userContext={userContext}
          onEndCall={handleEndCall}
          onBack={handleBackToDashboard}
          difficulty={getDifficulty()}
          target={currentTarget}
          scenarioId={selectedScenario}
        />
      )}

      {appState === AppState.DEBRIEF && currentPersona && (
        <Debrief
          persona={currentPersona}
          transcript={latestTranscript}
          callReason={lastCallReason}
          onRetry={handleRetry}
          onNewCall={() => {
             handleBackToDashboard();
             // Dashboard handles generating new call trigger if needed, or user clicks start
          }}
          onBack={handleBackToDashboard}
          onResultsReady={handleDebriefResult}
          streak={streak}
          history={history}
          isPenaltyActive={isPenaltyActive}
          togglePenalty={() => setIsPenaltyActive(!isPenaltyActive)}
          onOpenAdvisor={() => setIsAdvisorOpen(true)}
          userContext={userContext}
        />
      )}

      {isAdvisorOpen && (
          <Advisor 
            onClose={() => setIsAdvisorOpen(false)} 
            userContext={userContext}
            history={history}
          />
      )}
    </div>
  );
};

export default App;