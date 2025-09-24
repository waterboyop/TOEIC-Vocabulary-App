
import React, { useState, useEffect, useCallback } from 'react';
import { ReadingComprehensionTest } from '../types';
import { generateReadingComprehensionTest, getAiErrorAnalysis } from '../services/geminiService';
import { READING_COMPREHENSION_KEY } from '../constants';
import { speak } from '../services/speechService';

interface ReadingComprehensionViewProps {
    onComplete: () => void;
}

const getToday = () => new Date().toISOString().split('T')[0];

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const LoadingSkeleton: React.FC = () => (
    <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-3/4 mb-6"></div>
        <div className="space-y-3 mb-8">
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
        {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm mb-6">
                <div className="h-5 bg-slate-200 rounded w-3/5 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-10 bg-slate-100 rounded-lg"></div>
                    <div className="h-10 bg-slate-100 rounded-lg"></div>
                    <div className="h-10 bg-slate-100 rounded-lg"></div>
                    <div className="h-10 bg-slate-100 rounded-lg"></div>
                </div>
            </div>
        ))}
    </div>
);


const ReadingComprehensionView: React.FC<ReadingComprehensionViewProps> = ({ onComplete }) => {
    const [test, setTest] = useState<ReadingComprehensionTest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
    const [isCompleted, setIsCompleted] = useState(false);
    const [aiAnalyses, setAiAnalyses] = useState<{ [key: number]: string | null }>({});
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState<number | null>(null);

    useEffect(() => {
        const loadTest = async () => {
            const today = getToday();
            try {
                const storedData = localStorage.getItem(READING_COMPREHENSION_KEY);
                if (storedData) {
                    const parsedData: ReadingComprehensionTest = JSON.parse(storedData);
                    // Migration check: Ensure the stored data has the new 'vocabulary' field.
                    if (parsedData.date === today && parsedData.vocabulary) {
                        setTest(parsedData);
                        setIsLoading(false);
                        return;
                    }
                }

                // If no valid data for today, generate a new test
                const newTestData = await generateReadingComprehensionTest();
                const fullTest: ReadingComprehensionTest = {
                    date: today,
                    ...newTestData
                };
                setTest(fullTest);
                localStorage.setItem(READING_COMPREHENSION_KEY, JSON.stringify(fullTest));

            } catch (err: any) {
                console.error("Failed to load or generate reading test:", err);
                setError(err.message || "無法載入閱讀測驗，請稍後再試。");
            } finally {
                setIsLoading(false);
            }
        };

        loadTest();
    }, []);
    
    useEffect(() => {
        if (test && !isCompleted && Object.keys(userAnswers).length === test.questions.length) {
            onComplete();
            setIsCompleted(true);
        }
    }, [userAnswers, test, isCompleted, onComplete]);


    const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
        if (userAnswers.hasOwnProperty(questionIndex)) return; // Prevent changing answer

        setUserAnswers(prev => ({
            ...prev,
            [questionIndex]: optionIndex
        }));
    };

    const handleAiAnalysis = async (questionIndex: number) => {
        if (!test) return;
        const question = test.questions[questionIndex];
        const userAnswerIndex = userAnswers[questionIndex];
        if (userAnswerIndex === undefined) return;

        const userAnswer = question.options[userAnswerIndex];

        setIsAnalyzing(questionIndex);
        setAnalysisError(null);
        try {
            const analysis = await getAiErrorAnalysis(
                question.question,
                question.options,
                question.options[question.correctAnswerIndex],
                userAnswer
            );
            setAiAnalyses(prev => ({ ...prev, [questionIndex]: analysis }));
        } catch (err: any) {
            setAnalysisError(err.message || '無法取得 AI 分析。');
        } finally {
            setIsAnalyzing(null);
        }
    };

    const getOptionClass = (questionIndex: number, optionIndex: number) => {
        if (!userAnswers.hasOwnProperty(questionIndex)) {
            return "bg-white hover:bg-slate-100 text-slate-700";
        }

        const isCorrect = test?.questions[questionIndex].correctAnswerIndex === optionIndex;
        const userAnswer = userAnswers[questionIndex];

        if (isCorrect) {
            return "bg-green-100 border-green-500 text-green-800 ring-2 ring-green-500";
        }
        if (userAnswer === optionIndex) {
            return "bg-red-100 border-red-500 text-red-800";
        }
        
        return "bg-slate-50 text-slate-500 cursor-not-allowed";
    };

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (error) {
        return (
            <div className="text-center p-8 bg-red-50 rounded-lg">
                <h2 className="text-xl font-semibold text-red-700">發生錯誤</h2>
                <p className="text-red-600 mt-2">{error}</p>
            </div>
        );
    }
    
    if (!test) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-4">{test.title}</h1>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{test.article}</p>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-6">測驗</h2>

            <div className="space-y-6">
                {test.questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-white p-6 rounded-xl shadow-sm">
                        <p className="font-semibold text-slate-800 mb-4">{qIndex + 1}. {q.question}</p>
                        <div className="space-y-3">
                            {q.options.map((option, oIndex) => (
                                <button
                                    key={oIndex}
                                    onClick={() => handleAnswerSelect(qIndex, oIndex)}
                                    disabled={userAnswers.hasOwnProperty(qIndex)}
                                    className={`w-full p-4 rounded-lg text-left font-medium border-2 border-transparent transition-all duration-300 ${getOptionClass(qIndex, oIndex)}`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        {userAnswers.hasOwnProperty(qIndex) && (
                            <div className="mt-4 p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg animate-fade-in">
                                <h4 className="font-bold text-indigo-800">解說：</h4>
                                <p className="text-indigo-700 mt-1">{q.explanation}</p>
                                
                                {userAnswers[qIndex] !== q.correctAnswerIndex && (
                                    <div className="mt-4 pt-4 border-t border-indigo-200">
                                        {!aiAnalyses[qIndex] ? (
                                            <button
                                                onClick={() => handleAiAnalysis(qIndex)}
                                                disabled={isAnalyzing === qIndex}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 border border-transparent text-blue-800 text-sm font-medium rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition-colors"
                                            >
                                                {isAnalyzing === qIndex ? (
                                                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800"></div><span>AI 分析中...</span></>
                                                ) : "🤖 AI 錯題分析"}
                                            </button>
                                        ) : (
                                            <div className="p-3 bg-blue-50">
                                                <h5 className="font-bold text-blue-800">AI 智慧助教：</h5>
                                                <p className="text-blue-900 mt-1 text-sm">{aiAnalyses[qIndex]}</p>
                                            </div>
                                        )}
                                        {analysisError && isAnalyzing === qIndex && <p className="text-xs text-red-500 mt-2 text-center">{analysisError}</p>}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {isCompleted && test.vocabulary && test.vocabulary.length > 0 && (
                <div className="mt-12 animate-fade-in">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">重點單字片語</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {test.vocabulary.map((vocab, index) => (
                            <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-indigo-700">{vocab.wordOrPhrase}</h3>
                                    <button 
                                        onClick={() => speak(vocab.wordOrPhrase, 'en-US')}
                                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                                        aria-label={`Pronounce ${vocab.wordOrPhrase}`}
                                    >
                                        <SpeakerIcon />
                                    </button>
                                </div>
                                <p className="text-slate-600 mt-1 mb-3">{vocab.definition}</p>
                                <div className="text-sm bg-slate-50 p-3 rounded-md border border-slate-200">
                                    <p className="text-slate-700 italic">"{vocab.example}"</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

             <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ReadingComprehensionView;
