
import React, { useState, useEffect, Fragment } from 'react';
import { DailyGrammar } from '../types';
import { getAiErrorAnalysis } from '../services/geminiService';

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const highlightBlank = (sentence: string) => {
    const parts = sentence.split('___');
    return (
        <>
            {parts.map((part, index) => (
                <Fragment key={index}>
                    {part}
                    {index < parts.length - 1 && (
                        <span className="font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-md mx-1">___</span>
                    )}
                </Fragment>
            ))}
        </>
    );
}


interface DailyGrammarModalProps {
    isOpen: boolean;
    onClose: () => void;
    grammar: DailyGrammar | null;
    isLoading: boolean;
    error: string | null;
}

const LoadingSkeleton = () => (
    <div className="animate-pulse p-6">
        <div className="h-8 bg-slate-200 rounded-md w-2/3 mb-4"></div>
        <div className="space-y-2 mb-6">
            <div className="h-4 bg-slate-200 rounded-md w-full"></div>
            <div className="h-4 bg-slate-200 rounded-md w-full"></div>
            <div className="h-4 bg-slate-200 rounded-md w-5/6"></div>
        </div>
        <div className="space-y-3">
            <div className="h-6 bg-slate-200 rounded-lg w-full"></div>
            <div className="h-6 bg-slate-200 rounded-lg w-full"></div>
            <div className="h-6 bg-slate-200 rounded-lg w-full"></div>
        </div>
        <div className="h-12 bg-slate-200 rounded-lg w-full mt-8"></div>
    </div>
);

const DailyGrammarModal: React.FC<DailyGrammarModalProps> = ({ isOpen, onClose, grammar, isLoading, error }) => {
    const [mode, setMode] = useState<'learn' | 'quiz'>('learn');
    const [quizIndex, setQuizIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        // Reset state when modal is closed or new grammar is loaded
        if (isOpen) {
            setMode('learn');
            setQuizIndex(0);
            setSelectedAnswer(null);
            setAiAnalysis(null);
            setAnalysisError(null);
        }
    }, [isOpen, grammar]);
    
    const currentQuestion = grammar?.quiz[quizIndex];

    const handleAnswerSelect = (option: string) => {
        if (selectedAnswer) return;
        setSelectedAnswer(option);
    };

    const handleAiAnalysis = async () => {
        if (!currentQuestion || !selectedAnswer) return;

        setIsAnalyzing(true);
        setAnalysisError(null);
        try {
            const analysis = await getAiErrorAnalysis(
                currentQuestion.question,
                currentQuestion.options,
                currentQuestion.correctAnswer,
                selectedAnswer
            );
            setAiAnalysis(analysis);
        } catch (err: any) {
            setAnalysisError(err.message || '無法取得 AI 分析。');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleNextQuestion = () => {
        setAiAnalysis(null);
        setAnalysisError(null);
        if (quizIndex < (grammar?.quiz.length ?? 0) - 1) {
            setQuizIndex(prev => prev + 1);
            setSelectedAnswer(null);
        } else {
            // Quiz finished, go back to learn mode to review
            setMode('learn');
        }
    };
    
    const getOptionClass = (option: string) => {
        if (!selectedAnswer) {
            return "bg-white hover:bg-slate-100 text-slate-700";
        }
        const isCorrect = currentQuestion?.correctAnswer === option;
        if (isCorrect) {
            return "bg-green-100 border-green-500 text-green-800 ring-2 ring-green-500";
        }
        if (selectedAnswer === option) {
            return "bg-red-100 border-red-500 text-red-800";
        }
        return "bg-slate-50 text-slate-500 cursor-not-allowed";
    };

    const renderLearnContent = () => (
        <div className="p-6">
            <h3 className="text-2xl font-bold text-indigo-700 mb-2">{grammar?.topic}</h3>
            <p className="text-slate-600 leading-relaxed mb-6">{grammar?.explanation}</p>
            
            <div className="space-y-3">
                <h4 className="font-bold text-slate-700">範例：</h4>
                {grammar?.examples.map((ex, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg border border-slate-200">
                        <p className="text-slate-800 italic">"{ex}"</p>
                    </div>
                ))}
            </div>

            <button
                onClick={() => { setQuizIndex(0); setSelectedAnswer(null); setMode('quiz'); }}
                className="mt-8 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
            >
                開始練習
            </button>
        </div>
    );

    const renderQuizContent = () => {
        if (!currentQuestion) return null;
        
        const isLastQuestion = quizIndex === (grammar?.quiz.length ?? 0) - 1;

        return (
             <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-indigo-700">文法練習</h3>
                    <span className="text-sm font-semibold text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
                        {quizIndex + 1} / {grammar?.quiz.length}
                    </span>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6">
                    <p className="text-slate-800 text-lg leading-relaxed text-center">
                        {highlightBlank(currentQuestion.question)}
                    </p>
                </div>

                <div className="space-y-3">
                    {currentQuestion.options.map((option, i) => (
                        <button
                            key={i}
                            onClick={() => handleAnswerSelect(option)}
                            disabled={!!selectedAnswer}
                            className={`w-full p-4 rounded-lg text-left font-medium border-2 border-transparent transition-all duration-300 ${getOptionClass(option)}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {selectedAnswer && (
                    <div className="mt-6 animate-fade-in">
                        <div className="p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg">
                            <h4 className="font-bold text-indigo-800">解說：</h4>
                            <p className="text-indigo-700 mt-1">{currentQuestion.explanation}</p>
                            
                             {selectedAnswer !== currentQuestion.correctAnswer && (
                                <div className="mt-4 pt-4 border-t border-indigo-200">
                                    {!aiAnalysis ? (
                                        <button
                                            onClick={handleAiAnalysis}
                                            disabled={isAnalyzing}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 border border-transparent text-blue-800 text-sm font-medium rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition-colors"
                                        >
                                            {isAnalyzing ? (
                                                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800"></div><span>AI 分析中...</span></>
                                            ) : "🤖 AI 錯題分析"}
                                        </button>
                                    ) : (
                                        <div className="p-3 bg-blue-50">
                                            <h5 className="font-bold text-blue-800">AI 智慧助教：</h5>
                                            <p className="text-blue-900 mt-1 text-sm">{aiAnalysis}</p>
                                        </div>
                                    )}
                                    {analysisError && <p className="text-xs text-red-500 mt-2 text-center">{analysisError}</p>}
                                </div>
                            )}
                        </div>
                         <button
                            onClick={handleNextQuestion}
                            className="mt-6 w-full bg-slate-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-800 transition-colors shadow-md"
                        >
                            {isLastQuestion ? '完成練習' : '下一題'}
                        </button>
                    </div>
                )}
             </div>
        );
    };


    return (
        <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-slate-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                        <h2 id="daily-grammar-title" className="text-xl font-bold text-slate-800">每日文法</h2>
                        <button onClick={onClose} className="p-2 text-slate-500 rounded-full hover:bg-slate-200 hover:text-slate-800 transition-colors" aria-label="Close">
                            <CloseIcon />
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {isLoading && !grammar && <LoadingSkeleton />}
                        {error && <div className="text-center p-6 bg-red-50 rounded-lg m-6"><p className="text-red-700 font-medium">{error}</p></div>}
                        {grammar && (mode === 'learn' ? renderLearnContent() : renderQuizContent())}
                    </div>
                </div>
                 <style>{`
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
                `}</style>
            </div>
        </div>
    );
};

export default DailyGrammarModal;
