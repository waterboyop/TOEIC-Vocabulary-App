
import React, { useState, useEffect, useMemo } from 'react';
import ManageWordsView from './components/ManageWordsView';
import Quiz from './components/Quiz';
import { useVocabulary } from './hooks/useVocabulary';
import { useTopicPacks } from './hooks/useTopicPacks';
import VocabularyList from './components/VocabularyList';
import WordDetailModal from './components/WordDetailModal';
import TopicLearningView from './components/TopicLearningView';
import TopicPackModal from './components/TopicPackModal';
import FlashcardView from './components/FlashcardView';
import ReadingComprehensionView from './components/ReadingComprehensionView';
import { VocabularyWord, TopicPack, View, DailyWord, DailyGrammar, StudyPlan } from './types';
import { useDailyWord } from './hooks/useDailyWord';
import DailyWordModal from './components/DailyWordModal';
import CloudSyncModal from './components/CloudSyncModal';
import { LEARNING_STREAK_KEY, DAILY_TASKS_KEY, LEARNING_ACTIVITY_LOG_KEY, AI_STUDY_PLAN_KEY } from './constants';
import EtymologyQuizView from './components/EtymologyQuizView';
import LearningDashboardView from './components/LearningDashboardView';
import WordUsageQuizView from './components/WordUsageQuizView';
import ListeningQuizView from './components/ListeningQuizView';
import { useDailyGrammar } from './hooks/useDailyGrammar';
import DailyGrammarModal from './components/DailyGrammarModal';
import WritingAssistantView from './components/WritingAssistantView';
import GlobalSearchView from './components/GlobalSearchView';
import { useStudyPlan } from './hooks/useStudyPlan';
import { useDailyQuote } from './hooks/useDailyQuote';

// PWA Install Prompt Interface
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// --- Notification Component ---
interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Display for 4 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const baseClasses = "fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm sm:max-w-md mx-auto p-4 rounded-xl shadow-lg flex items-start space-x-4 animate-slide-down-fade border";
  const typeClasses = type === 'success' 
    ? "bg-green-50 border-green-200" 
    : "bg-red-50 border-red-200";
    
  const icon = type === 'success' ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div 
        className={`${baseClasses} ${typeClasses}`}
        role="alert"
    >
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div className="flex-grow">
        <p className={`font-bold ${type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {type === 'success' ? '成功' : '錯誤'}
        </p>
        <p className={`text-sm ${type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message}</p>
      </div>
       <button onClick={onClose} className="p-1 -mt-1 -mr-1 rounded-full hover:bg-black/10 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

      <style>{`
        @keyframes slideDownFade {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-down-fade {
            animation: slideDownFade 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};


const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { 
    words, addWord, isLoading: isVocabLoading, generateAndAddWords, isGenerating, 
    updateWordFamiliarity, updateWordReviewStatus, addTagToWord, removeTagFromWord, addExamplesToWord,
    updateWord
  } = useVocabulary();
  const { topicPacks, addTopicPack, deleteTopicPack } = useTopicPacks();
  const [learningStreak, setLearningStreak] = useState(1);
  const [learningLog, setLearningLog] = useState<{ [date: string]: number }>({});
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [selectedTopicPack, setSelectedTopicPack] = useState<TopicPack | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { 
    currentWord: dailyWord, 
    history: dailyWordHistory, 
    isLoading: isDailyWordLoading, 
    error: dailyWordError, 
    checkAndFetchWord 
  } = useDailyWord();
  const {
    currentGrammar,
    history: dailyGrammarHistory,
    isLoading: isDailyGrammarLoading,
    error: dailyGrammarError,
    checkAndFetchGrammar
  } = useDailyGrammar();

  const {
    studyPlan,
    isLoading: isPlanLoading,
    error: planError,
    checkAndGeneratePlan,
    completeTask,
  } = useStudyPlan();

  const {
    currentQuote,
    isLoading: isQuoteLoading,
    error: quoteError,
    checkAndFetchQuote
  } = useDailyQuote();

  // Modal states refactored to handle global search
  const [isDailyWordModalOpen, setIsDailyWordModalOpen] = useState(false);
  const [selectedDailyWordFromSearch, setSelectedDailyWordFromSearch] = useState<DailyWord | null>(null);
  const [isDailyGrammarModalOpen, setIsDailyGrammarModalOpen] = useState(false);
  const [selectedDailyGrammarFromSearch, setSelectedDailyGrammarFromSearch] = useState<DailyGrammar | null>(null);
  
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [activeToolboxTab, setActiveToolboxTab] = useState('daily');
  const [challengeWords, setChallengeWords] = useState<VocabularyWord[]>([]);


  const getTodayStr = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    // Learning Streak Logic
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    try {
      const data = localStorage.getItem(LEARNING_STREAK_KEY);
      if (data) {
        const { streak, lastVisit } = JSON.parse(data);
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastVisit === todayStr) {
          setLearningStreak(streak);
        } else if (lastVisit === yesterdayStr) {
          const newStreak = streak + 1;
          setLearningStreak(newStreak);
          localStorage.setItem(LEARNING_STREAK_KEY, JSON.stringify({ streak: newStreak, lastVisit: todayStr }));
        } else {
          setLearningStreak(1);
          localStorage.setItem(LEARNING_STREAK_KEY, JSON.stringify({ streak: 1, lastVisit: todayStr }));
        }
      } else {
        setLearningStreak(1);
        localStorage.setItem(LEARNING_STREAK_KEY, JSON.stringify({ streak: 1, lastVisit: todayStr }));
      }
    } catch (error) {
      console.error("Failed to process learning streak", error);
      setLearningStreak(1);
    }

    // Learning Log for Heatmap
    try {
      const logData = localStorage.getItem(LEARNING_ACTIVITY_LOG_KEY);
      if (logData) {
        setLearningLog(JSON.parse(logData));
      }
    } catch (error) {
      console.error("Failed to load learning log", error);
    }

  }, []);

  // Fetch daily content when the app loads
  useEffect(() => {
    checkAndFetchWord();
    checkAndFetchGrammar();
    checkAndFetchQuote();
  }, [checkAndFetchWord, checkAndFetchGrammar, checkAndFetchQuote]);

  // Generate Study Plan when vocabulary is loaded
  useEffect(() => {
    if (!isVocabLoading && words.length > 0) {
      const todayStr = getTodayStr();
      const wordsForReview = words.filter(word => word.dueDate <= todayStr);
      const weakWords = words.filter(w => w.interval === 0);
      checkAndGeneratePlan(wordsForReview, weakWords, words.length);
    }
  }, [isVocabLoading, words, checkAndGeneratePlan]);


  const updateLearningLog = (date: string, count: number) => {
    const newLog = { ...learningLog, [date]: count };
    setLearningLog(newLog);
    try {
      localStorage.setItem(LEARNING_ACTIVITY_LOG_KEY, JSON.stringify(newLog));
    } catch (error) {
      console.error("Failed to save learning log", error);
    }
  };
  
  const handleReviewWord = (wordId: string, rating: 'again' | 'good' | 'easy') => {
      updateWordReviewStatus(wordId, rating);
      const todayStr = getTodayStr();
      const currentCount = learningLog[todayStr] || 0;
      updateLearningLog(todayStr, currentCount + 1);
  }

  const handleAnalyzeWord = (wordId: string) => {
    // This function can be used to track analysis for daily goals in the future
  };

  const handleWordSelect = (word: VocabularyWord) => {
    setSelectedWord(word);
  };

  const handleCloseModal = () => {
    setSelectedWord(null);
    setSelectedTopicPack(null);
  };

  const handleAddTag = (wordId: string, tag: string) => {
    addTagToWord(wordId, tag);
    setSelectedWord(prev => prev ? { ...prev, tags: [...(prev.tags || []), tag] } : null);
  };
  
  const handleRemoveTag = (wordId: string, tag: string) => {
    removeTagFromWord(wordId, tag);
    setSelectedWord(prev => prev ? { ...prev, tags: prev.tags?.filter(t => t !== tag) || [] } : null);
  };
  
  const handleAddExamples = (wordId: string, examples: string[]) => {
    addExamplesToWord(wordId, examples);
    setSelectedWord(prev => {
        if (!prev) return null;
        const newExamples = [...(prev.additionalExamples || []), ...examples];
        // Deduplicate
        return { ...prev, additionalExamples: Array.from(new Set(newExamples)) };
    });
  };

  const handleUpdateWordDetails = (wordId: string, details: Partial<VocabularyWord>) => {
      updateWord(wordId, details);
      setSelectedWord(prev => (prev && prev.id === wordId) ? { ...prev, ...details } : prev);
      if (details.sentenceAnalysis || details.similarWordAnalysis || details.structureAnalysis) {
        handleAnalyzeWord(wordId);
      }
  };

  // Fix: Corrected the type for wordsToAdd to align with the TopicPack word structure, which omits SRS fields. Also removed the 'as any' cast.
  const handleAddWordsFromPack = (wordsToAdd: Omit<VocabularyWord, 'id' | 'familiarity' | 'tags' | 'additionalExamples' | 'writingPractice' | 'dueDate' | 'interval'>[]) => {
    let addedCount = 0;
    let duplicateCount = 0;
    wordsToAdd.forEach(wordToAdd => {
        if (!words.some(existingWord => existingWord.word.toLowerCase() === wordToAdd.word.toLowerCase())) {
            addWord(wordToAdd);
            addedCount++;
        } else {
            duplicateCount++;
        }
    });

    let message = '';
    if (addedCount > 0 && duplicateCount > 0) {
        message = `成功加入 ${addedCount} 個新單字！有 ${duplicateCount} 個單字已存在。`;
    } else if (addedCount > 0) {
        message = `成功將 ${addedCount} 個新單字加入您的字庫！`;
    } else if (duplicateCount > 0) {
        message = `所有 ${duplicateCount} 個單字都已存在於您的字庫中。`;
    }
    
    if (message) {
        setNotification({ message, type: 'success' });
    }
    
    handleCloseModal();
  };

  const handleDeleteTopicPack = (packId: string) => {
    if (window.confirm("確定要刪除這個主題學習包嗎？")) {
        deleteTopicPack(packId);
        handleCloseModal();
    }
  };

  const handleOpenDailyWord = () => {
    checkAndFetchWord(); // Fetch if needed
    setSelectedDailyWordFromSearch(null); // Ensure we show the current word
    setIsDailyWordModalOpen(true);
  };

  const handleCloseDailyWord = () => {
    setIsDailyWordModalOpen(false);
  };

  const handleOpenDailyGrammar = () => {
    checkAndFetchGrammar();
    setSelectedDailyGrammarFromSearch(null);
    setIsDailyGrammarModalOpen(true);
  };
  
  const handleCloseDailyGrammar = () => {
    setIsDailyGrammarModalOpen(false);
  };

  const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" /></svg>;
  const CloudIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" /></svg>;
  const EtymologyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 005.5 16c1.255 0 2.443-.29 3.5-.804V4.804zM14.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 0014.5 16c1.255 0 2.443-.29 3.5.804v-10A7.968 7.968 0 0014.5 4z" /><path fillRule="evenodd" d="M8.293 8.293a1 1 0 011.414 0l2 2a1 1 0 01-1.414 1.414L10 11.414l-1.293 1.293a1 1 0 01-1.414-1.414l2-2z" clipRule="evenodd" /></svg>;
  const GrammarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A1 1 0 0111 2.586L15.414 7A1 1 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
  const ArrowRightIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className || 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
  
  const PlusIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-8 w-8 text-indigo-500'} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
  const BookOpenIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-8 w-8 text-indigo-500'} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494M4.253 9.75h15.494" /></svg>;
  const ChartBarIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-8 w-8 text-indigo-500'} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
  
  const HeadphonesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m-1 4v3a2 2 0 002 2h10a2 2 0 002-2v-3" /></svg>;
  const DocumentTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  const PencilAltIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
  
  const taskIcons: { [key: string]: React.ReactElement } = {
      flashcard: <BookOpenIcon className="w-8 h-8 text-indigo-500" />,
      reading: <DocumentTextIcon />,
      topic: <BookOpenIcon className="w-8 h-8 text-sky-500" />,
      quiz: <PencilAltIcon />,
      listening: <HeadphonesIcon />,
      writing: <PencilAltIcon />,
  };
  
  const renderDashboard = () => {
    if (isVocabLoading) {
      return <div className="text-center p-10">載入單字中...</div>;
    }

    if (isPlanLoading) {
        return (
            <div className="text-center p-10 max-w-lg mx-auto">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-slate-200 mb-4"></div>
                    <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
                <p className="text-slate-600 font-semibold mt-6">您的 AI 教練正在為您規劃今日學習路徑...</p>
            </div>
        );
    }
    
    if (planError || !studyPlan) {
        return (
            <div className="text-center p-10 bg-red-50 rounded-2xl max-w-lg mx-auto">
                <h2 className="text-xl font-bold text-red-700">糟糕！</h2>
                <p className="text-red-600 mt-2">{planError || "無法載入您的學習計畫，請稍後再試。"}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg">重試</button>
            </div>
        );
    }

    const renderQuote = () => {
        if (isQuoteLoading) {
            return (
                <div className="bg-white p-5 rounded-2xl shadow-sm mb-8 animate-pulse">
                    <div className="h-5 bg-slate-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
            )
        }
        
        if (quoteError) {
             return (
                <div className="bg-red-50 p-5 rounded-2xl shadow-sm mb-8 border border-red-200">
                    <h2 className="font-bold text-red-700">無法載入每日名言</h2>
                    <p className="text-sm text-red-600 mt-1">{quoteError}</p>
                </div>
            )
        }

        if (currentQuote) {
            return (
                 <div className="bg-white p-5 rounded-2xl shadow-sm mb-8 border-l-4 border-indigo-500">
                    <h2 className="text-base font-bold text-indigo-800 mb-2">每日格言</h2>
                    <blockquote className="relative">
                        <p className="text-lg text-slate-700 italic">"{currentQuote.quote}"</p>
                        <footer className="text-right mt-2 text-sm text-slate-500 font-semibold">— {currentQuote.authorTranslation} ({currentQuote.author})</footer>
                    </blockquote>
                     <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-200">{currentQuote.chineseTranslation}</p>
                </div>
            )
        }
        
        return null;
    }

    const toolboxTabs = [
        { id: 'daily', name: '每日精選' },
        { id: 'quizzes', name: '隨堂測驗' },
        { id: 'tools', name: '工具 & 管理' },
    ];

    return (
      <>
        <GlobalSearchView
            words={words}
            topicPacks={topicPacks}
            dailyWordHistory={dailyWordHistory}
            dailyGrammarHistory={dailyGrammarHistory}
            onWordSelect={setSelectedWord}
            onTopicPackSelect={setSelectedTopicPack}
            onDailyWordSelect={(word) => {
                setSelectedDailyWordFromSearch(word);
                setIsDailyWordModalOpen(true);
            }}
            onDailyGrammarSelect={(grammar) => {
                setSelectedDailyGrammarFromSearch(grammar);
                setIsDailyGrammarModalOpen(true);
            }}
        />
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">歡迎回來！</h1>
            <p className="text-sm text-slate-500 mt-1">連續學習第 {learningStreak} 天 🔥</p>
          </div>
        </div>
        
        {/* Daily Quote and Study Plan */}
        <div className="mb-8">
            {renderQuote()}
            <h2 className="text-xl font-bold text-slate-800 mb-3">今日任務</h2>
            <div className="flex overflow-x-auto space-x-4 pb-4 hide-scrollbar">
                {studyPlan.tasks.map(task => (
                    <button
                        key={task.id}
                        onClick={() => {
                            // Find the specific challenge words if the task is a listening quiz
                            if (task.actionType === 'listening-quiz') {
                                const weakWords = words.filter(w => w.interval === 0 || w.familiarity <= 2);
                                if (weakWords.length >= 4) {
                                    setChallengeWords(weakWords);
                                } else {
                                    setChallengeWords(words.filter(w => w.familiarity < 5));
                                }
                            }
                            setView(task.actionType)
                        }}
                        disabled={task.isCompleted}
                        className="w-64 md:w-72 flex-shrink-0 group bg-white p-5 rounded-2xl shadow-sm text-left flex flex-col justify-between disabled:opacity-60 disabled:hover:shadow-sm disabled:hover:-translate-y-0 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                        <div className="flex-shrink-0 mb-4">
                            {task.isCompleted ? (
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center transition-colors group-hover:bg-indigo-100">
                                   {React.cloneElement(taskIcons[task.icon] || <PencilAltIcon />, { className: 'w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors' })}
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-base text-slate-800">{task.title}</h3>
                            <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* Toolbox */}
        <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 text-slate-800">工具箱</h2>
            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {toolboxTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveToolboxTab(tab.id)}
                            className={`${
                                activeToolboxTab === tab.id
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="animate-fade-in-short">
                {activeToolboxTab === 'daily' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <button onClick={handleOpenDailyGrammar} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-left">
                             <div className="flex items-start space-x-4">
                                 <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><GrammarIcon /></div>
                                 <div className="flex-grow">
                                     <p className="text-sm font-semibold text-indigo-600">每日文法</p>
                                     {isDailyGrammarLoading ? (
                                         <div className="h-6 bg-slate-200 rounded-md w-3/4 mt-1 animate-pulse"></div>
                                     ) : (
                                         <p className="font-bold text-slate-800 mt-1">{currentGrammar?.topic || '今天沒有新文法'}</p>
                                     )}
                                 </div>
                             </div>
                         </button>
                         <button onClick={handleOpenDailyWord} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-left">
                              <div className="flex items-start space-x-4">
                                 <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center"><ChatIcon /></div>
                                 <div className="flex-grow">
                                     <p className="text-sm font-semibold text-rose-600">每日俚語</p>
                                     {isDailyWordLoading ? (
                                         <div className="h-6 bg-slate-200 rounded-md w-3/4 mt-1 animate-pulse"></div>
                                     ) : (
                                         <p className="font-bold text-slate-800 mt-1">{dailyWord?.slang || '今天沒有新俚語'}</p>
                                     )}
                                 </div>
                             </div>
                         </button>
                     </div>
                )}
                {activeToolboxTab === 'quizzes' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button onClick={() => setView('etymology-quiz')} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-left flex items-start space-x-4">
                           <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center"><EtymologyIcon/></div>
                           <div><p className="font-bold text-slate-800">字根測驗</p><p className="text-sm text-slate-500 mt-1">測試您對字根、字首、字尾的理解。</p></div>
                        </button>
                        <button onClick={() => setView('word-usage-quiz')} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-left flex items-start space-x-4">
                           <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center"><PencilAltIcon/></div>
                           <div><p className="font-bold text-slate-800">用法測驗</p><p className="text-sm text-slate-500 mt-1">辨析相似字詞，掌握細微差別。</p></div>
                        </button>
                        <button onClick={() => {
                            const wordsForListeningQuiz = words.filter(w => w.familiarity < 5);
                            if (wordsForListeningQuiz.length >= 4) {
                                setChallengeWords(wordsForListeningQuiz);
                                setView('listening-quiz');
                            } else {
                                setNotification({ message: '聽力測驗需要至少 4 個您不熟悉的單字。', type: 'error' });
                            }
                        }} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-left flex items-start space-x-4">
                           <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center"><HeadphonesIcon/></div>
                           <div><p className="font-bold text-slate-800">聽力測驗</p><p className="text-sm text-slate-500 mt-1">訓練您的聽力與拼寫能力。</p></div>
                        </button>
                     </div>
                )}
                 {activeToolboxTab === 'tools' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <button onClick={() => setView('writing-assistant')} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-left flex items-start space-x-4">
                           <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center"><PencilAltIcon/></div>
                           <div><p className="font-bold text-slate-800">AI 英文寫作輔助</p><p className="text-sm text-slate-500 mt-1">改善您的商用英文寫作。</p></div>
                        </button>
                         <button onClick={() => setView('learning-dashboard')} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-left flex items-start space-x-4">
                           <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center"><ChartBarIcon/></div>
                           <div><p className="font-bold text-slate-800">學習儀表板</p><p className="text-sm text-slate-500 mt-1">查看您的學習統計與熱力圖。</p></div>
                        </button>
                         <button onClick={() => setIsSyncModalOpen(true)} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-left flex items-start space-x-4">
                           <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center"><CloudIcon/></div>
                           <div><p className="font-bold text-slate-800">雲端同步</p><p className="text-sm text-slate-500 mt-1">手動匯入/匯出您的學習進度。</p></div>
                        </button>
                         <button onClick={() => setView('list')} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-left flex items-start space-x-4">
                           <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center"><PlusIcon className="w-6 h-6 text-slate-600"/></div>
                           <div><p className="font-bold text-slate-800">新增/管理單字</p><p className="text-sm text-slate-500 mt-1">手動擴充您的個人字庫。</p></div>
                        </button>
                     </div>
                )}
            </div>
        </div>
        <style>{`
          @keyframes fadeInShort {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-short {
              animation: fadeInShort 0.3s ease-out forwards;
          }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </>
    );
  };

  const renderOtherViews = () => {
    const todayStr = getTodayStr();
    const wordsForReview = words.filter(w => w.dueDate <= todayStr);
    
    // The new learning dashboard manages its own back button.
    const showGenericBackButton = view !== 'flashcard' && view !== 'learning-dashboard';
    
    // Find the task ID related to the current view
    const currentTaskId = studyPlan?.tasks.find(t => t.actionType === view)?.id;
    const onTaskComplete = currentTaskId ? () => {
      completeTask(currentTaskId);
      setView('dashboard');
    } : () => setView('dashboard');


    if (view === 'inventory') {
      return (
        <div>
          <button onClick={() => setView('dashboard')} className="mb-4 inline-flex items-center text-slate-600 hover:text-slate-900 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            返回
          </button>
          <VocabularyList words={words} onUpdateFamiliarity={updateWordFamiliarity} onAnalyzeWord={handleAnalyzeWord} onWordSelect={handleWordSelect} />
        </div>
      );
    }
    
    return (
      <>
        {showGenericBackButton && (
          <button onClick={() => setView('dashboard')} className="mb-6 inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            返回儀表板
          </button>
        )}
        {view === 'list' && <ManageWordsView
            onGenerateWords={generateAndAddWords}
            isGenerating={isGenerating}
            onAddWord={addWord}
        />}
        {view === 'flashcard' && (
          <FlashcardView
            words={wordsForReview}
            onUpdateWord={handleReviewWord}
            onFinish={onTaskComplete}
          />
        )}
        {view === 'quiz' && <Quiz words={words} />}
        {view === 'reading-comprehension' && <ReadingComprehensionView onComplete={onTaskComplete} />}
        {view === 'listening-quiz' && <ListeningQuizView words={challengeWords} onFinish={onTaskComplete} />}
        {view === 'etymology-quiz' && <EtymologyQuizView onFinish={onTaskComplete} />}
        {view === 'word-usage-quiz' && <WordUsageQuizView words={words} onFinish={onTaskComplete} />}
        {view === 'topic-learning' && (
          <TopicLearningView 
            topicPacks={topicPacks}
            onAddTopicPack={(pack) => {
                addTopicPack(pack);
                const topicTaskId = studyPlan?.tasks.find(t => t.actionType === 'topic-learning')?.id;
                if(topicTaskId) completeTask(topicTaskId);
            }}
            onSelectTopicPack={setSelectedTopicPack}
          />
        )}
        {view === 'learning-dashboard' && (
            <LearningDashboardView 
                words={words}
                learningStreak={learningStreak}
                aiGeneratedCount={words.filter(w => w.tags?.includes('ai-generated')).length}
                learningLog={learningLog}
                onBack={() => setView('dashboard')}
            />
        )}
        {view === 'writing-assistant' && <WritingAssistantView />}
      </>
    );
  };

  return (
    <div className="min-h-screen font-sans">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
       )}
      <main className="container mx-auto p-4 md:p-8 relative">
        {view === 'dashboard' ? renderDashboard() : renderOtherViews()}
      </main>
      {selectedWord && (
        <WordDetailModal
          word={selectedWord}
          onClose={handleCloseModal}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onAddExamples={handleAddExamples}
          onUpdateDetails={handleUpdateWordDetails}
        />
      )}
      {selectedTopicPack && (
        <TopicPackModal
            pack={selectedTopicPack}
            onClose={handleCloseModal}
            onDelete={handleDeleteTopicPack}
            onAddWordsToVocabulary={handleAddWordsFromPack}
        />
      )}
      <DailyWordModal
        isOpen={isDailyWordModalOpen}
        onClose={handleCloseDailyWord}
        word={selectedDailyWordFromSearch || dailyWord}
        history={dailyWordHistory}
        isLoading={isDailyWordLoading}
        error={dailyWordError}
      />
      <DailyGrammarModal
        isOpen={isDailyGrammarModalOpen}
        onClose={handleCloseDailyGrammar}
        grammar={selectedDailyGrammarFromSearch || currentGrammar}
        isLoading={isDailyGrammarLoading}
        error={dailyGrammarError}
      />
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onShowNotification={(type, message) => setNotification({ type, message })}
       />
    </div>
  );
};

export default App;
