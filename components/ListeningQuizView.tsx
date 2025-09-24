
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VocabularyWord } from '../types';
import { speak } from '../services/speechService';
import { getSpellingCorrectionHelp } from '../services/geminiService';
import AiTeacherIcon from './AiTeacherIcon';

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

interface ListeningQuizViewProps {
  words: VocabularyWord[];
  onFinish: () => void;
}

const ListeningQuizView: React.FC<ListeningQuizViewProps> = ({ words, onFinish }) => {
  const [quizWords, setQuizWords] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (words.length > 0) {
        const shuffled = [...words].sort(() => 0.5 - Math.random());
        setQuizWords(shuffled.slice(0, 10)); // Take up to 10 words for the quiz
    }
  }, [words]);

  const currentWord = quizWords[currentIndex];

  const playAudio = useCallback(() => {
    if (currentWord) {
      speak(currentWord.word, 'en-US');
    }
  }, [currentWord]);

  useEffect(() => {
    if (quizWords.length > 0 && !isFinished) {
        // Delay playing audio slightly to allow for UI transitions
        const timer = setTimeout(() => {
            playAudio();
            inputRef.current?.focus();
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [currentIndex, quizWords, isFinished, playAudio]);

  const goToNextQuestion = () => {
    if (currentIndex < quizWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setFeedback(null);
      setExplanation(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || feedback) return;

    if (userInput.trim().toLowerCase() === currentWord.word.toLowerCase()) {
      setFeedback('correct');
      setTimeout(goToNextQuestion, 1500);
    } else {
      setFeedback('incorrect');
      setIsLoadingExplanation(true);
      try {
        const expl = await getSpellingCorrectionHelp(currentWord.word, userInput.trim());
        setExplanation(expl);
      } catch (err: any) {
        setExplanation(err.message || "抱歉，無法取得 AI 解釋。");
      } finally {
        setIsLoadingExplanation(false);
      }
    }
  };

  if (words.length === 0) {
    return (
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-lg mx-auto">
            <h2 className="text-xl font-semibold text-amber-700">單字數量不足</h2>
            <p className="text-slate-600 mt-2">您的字庫中沒有足夠的單字來進行聽力測驗。請先學習一些新單字！</p>
        </div>
    );
  }

  if (isFinished) {
    return (
         <div className="text-center p-10 bg-white rounded-2xl shadow-lg max-w-md mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold text-green-600 mb-2">🎉 測驗完成！</h2>
            <p className="text-slate-600 mb-6">您已完成本次聽力練習！</p>
            <button
                onClick={onFinish}
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
            >
                返回儀表板
            </button>
        </div>
    );
  }
  
  if (!currentWord) {
     return <div className="text-center p-10">準備測驗中...</div>;
  }

  const progress = (currentIndex / quizWords.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4">
            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="text-right text-sm font-semibold text-slate-500 mb-6">{currentIndex + 1} / {quizWords.length}</div>
        
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
            <h2 className="text-xl font-semibold text-slate-700 mb-6">請聽發音並拼出單字</h2>
            
            <button 
                onClick={playAudio} 
                className="w-24 h-24 mx-auto bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors transform hover:scale-110"
                aria-label="Play word audio"
            >
                <SpeakerIcon />
            </button>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col items-center">
                <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={!!feedback}
                    className={`w-full max-w-sm text-center text-2xl font-semibold p-3 border-b-4 rounded-t-lg transition-colors duration-300 focus:outline-none focus:ring-0
                        ${feedback === 'correct' ? 'border-green-500 bg-green-50' : ''}
                        ${feedback === 'incorrect' ? 'border-red-500 bg-red-50' : ''}
                        ${!feedback ? 'border-slate-300 focus:border-indigo-500 bg-slate-50' : ''}`
                    }
                    placeholder="在這裡輸入答案"
                    autoCapitalize="none"
                    autoCorrect="off"
                />

                {!feedback && (
                    <button 
                        type="submit" 
                        disabled={!userInput.trim()}
                        className="mt-6 w-full max-w-sm bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                        送出答案
                    </button>
                )}
            </form>

            {feedback === 'correct' && (
                <div className="mt-6 text-green-600 font-bold text-lg animate-fade-in">
                    答對了！
                </div>
            )}

            {feedback === 'incorrect' && (
                 <div className="mt-6 w-full text-left animate-fade-in">
                    <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                        <p className="font-bold text-red-800">答錯了</p>
                        <p className="text-red-700 mt-1">正確答案是：<span className="font-bold text-xl">{currentWord.word}</span></p>
                    </div>

                    <div className="mt-4 p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 opacity-70">
                                <AiTeacherIcon />
                            </div>
                            <div className="flex-grow pt-2">
                                <h4 className="font-bold text-indigo-800">AI 語音教練提示：</h4>
                                {isLoadingExplanation ? (
                                    <div className="h-4 bg-slate-300 rounded w-5/6 animate-pulse mt-2"></div>
                                ) : (
                                    <p className="text-indigo-900 mt-1">{explanation}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={goToNextQuestion}
                        className="mt-6 w-full bg-slate-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-800 transition-colors shadow-md"
                    >
                        下一題
                    </button>
                </div>
            )}
        </div>
        <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        `}</style>
    </div>
  );
};

export default ListeningQuizView;
