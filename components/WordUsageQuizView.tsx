

import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { VocabularyWord, WordUsageQuizQuestion } from '../types';
import { generateWordUsageQuiz, getAiErrorAnalysis } from '../services/geminiService';

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
        <p className="text-slate-600 font-semibold">正在為您生成專屬測驗...</p>
        <p className="text-slate-500 text-sm mt-1">AI 正在從您已熟悉的單字中挑選題目</p>
    </div>
);

const highlightBlank = (sentence: string) => {
    const parts = sentence.split('___');
    return (
        <>
            {parts.map((part, index) => (
                <Fragment key={index}>
                    {part}
                    {index < parts.length - 1 && (
                        <span className="font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-md">___</span>
                    )}
                </Fragment>
            ))}
        </>
    );
}

interface WordUsageQuizViewProps {
    words: VocabularyWord[];
    onFinish: () => void;
}

const WordUsageQuizView: React.FC<WordUsageQuizViewProps> = ({ words, onFinish }) => {
    const [quiz, setQuiz] = useState<WordUsageQuizQuestion[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [aiAnalyses, setAiAnalyses] = useState<{ [key: number]: string | null }>({});
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState<number | null>(null);

    const easyWords = useMemo(() => {
        // Words marked as 'easy' in flashcards have an interval of 2 or more.
        return words.filter(word => word.interval >= 2);
    }, [words]);

    useEffect(() => {
        const createQuiz = async () => {
            const MIN_WORDS_REQUIRED = 4;
            if (easyWords.length < MIN_WORDS_REQUIRED) {
                setError(`您熟悉的單字數量不足 (至少需要 ${MIN_WORDS_REQUIRED} 個)，無法生成測驗。請先透過閃卡學習更多單字。`);
                setIsLoading(false);
                return;
            }

            try {
                const quizQuestions = await generateWordUsageQuiz(easyWords);
                if (quizQuestions && quizQuestions.length > 0) {
                    setQuiz(quizQuestions); 
                } else {
                    throw new Error("AI 未能成功生成測驗題目。");
                }
            } catch (err: any) {
                setError(err.message || '生成測驗時發生未知錯誤。');
            } finally {
                setIsLoading(false);
            }
        };

        createQuiz();
    }, [easyWords]);

    const handleAnswerSelect = (option: string) => {
        if (selectedAnswer !== null) return;

        setSelectedAnswer(option);
        if (quiz && option === quiz[currentQuestionIndex].correctAnswer) {
            setScore(prev => prev + 1);
        }
    };
    
    const handleAiAnalysis = async (questionIndex: number) => {
        if (!quiz || !selectedAnswer) return;
        const question = quiz[questionIndex];

        setIsAnalyzing(questionIndex);
        setAnalysisError(null);
        try {
            const analysis = await getAiErrorAnalysis(
                question.questionSentence,
                question.options,
                question.correctAnswer,
                selectedAnswer
            );
            setAiAnalyses(prev => ({ ...prev, [questionIndex]: analysis }));
        } catch (err: any) {
            setAnalysisError(err.message || '無法取得 AI 分析。');
        } finally {
            setIsAnalyzing(null);
        }
    };

    const handleNextQuestion = () => {
        setAnalysisError(null);
        if (quiz && currentQuestionIndex < quiz.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
        } else {
            setIsFinished(true);
        }
    };

    const getOptionClass = (option: string) => {
        if (selectedAnswer === null) {
            return 'bg-white hover:bg-slate-100 text-slate-800';
        }

        const isCorrect = quiz && option === quiz[currentQuestionIndex].correctAnswer;

        if (isCorrect) {
            return 'bg-green-500 text-white ring-2 ring-green-300';
        }
        if (selectedAnswer === option) {
            return 'bg-red-500 text-white';
        }

        return 'bg-white text-slate-500 opacity-70';
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="max-w-2xl mx-auto"><LoadingSpinner /></div>;
        }

        if (error) {
            return (
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-lg mx-auto">
                    <h2 className="text-xl font-semibold text-red-700">無法生成測驗</h2>
                    <p className="text-slate-600 mt-2">{error}</p>
                </div>
            );
        }

        if (isFinished || !quiz || quiz.length === 0) {
            const totalQuestions = quiz?.length || 0;
            return (
                <div className="text-center p-10 bg-white rounded-2xl shadow-lg max-w-lg mx-auto">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">測驗完成！</h2>
                    <p className="text-lg text-slate-600 mb-6">您的得分是：</p>
                    <p className="text-6xl font-bold text-indigo-600 mb-8">{score} / {totalQuestions}</p>
                     <button
                        onClick={onFinish}
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                    >
                        返回儀表板
                    </button>
                </div>
            );
        }

        const currentQuestion = quiz[currentQuestionIndex];

        return (
            <div className="max-w-2xl mx-auto">
                <div className="relative bg-white p-8 rounded-2xl shadow-lg">
                    <p className="absolute top-4 right-6 font-bold text-slate-400">{currentQuestionIndex + 1} / {quiz.length}</p>
                    <div className="text-center mb-8">
                        <p className="text-slate-500 mb-4">選擇最適合的單字填入空格</p>
                        <h2 className="text-2xl text-slate-800 leading-relaxed">
                            {highlightBlank(currentQuestion.questionSentence)}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(option)}
                                disabled={selectedAnswer !== null}
                                className={`w-full p-4 rounded-lg text-center text-base font-semibold transition-all duration-200 ${getOptionClass(option)}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    {selectedAnswer !== null && (
                        <div className="mt-8 animate-fade-in">
                            <div className="p-4 bg-indigo-50 border-t-4 border-indigo-200 rounded-b-lg">
                                <h4 className="font-bold text-indigo-800">解說：</h4>
                                <p className="text-indigo-900 mt-1">{currentQuestion.explanation}</p>
                                
                                {selectedAnswer !== currentQuestion.correctAnswer && (
                                     <div className="mt-4 pt-4 border-t border-indigo-200">
                                        {!aiAnalyses[currentQuestionIndex] ? (
                                            <button
                                                onClick={() => handleAiAnalysis(currentQuestionIndex)}
                                                disabled={isAnalyzing === currentQuestionIndex}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 border border-transparent text-blue-800 text-sm font-medium rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition-colors"
                                            >
                                                {isAnalyzing === currentQuestionIndex ? (
                                                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800"></div><span>AI 分析中...</span></>
                                                ) : "🤖 AI 錯題分析"}
                                            </button>
                                        ) : (
                                            <div className="p-3 bg-blue-50">
                                                <h5 className="font-bold text-blue-800">AI 智慧助教：</h5>
                                                <p className="text-blue-900 mt-1 text-sm">{aiAnalyses[currentQuestionIndex]}</p>
                                            </div>
                                        )}
                                        {analysisError && <p className="text-xs text-red-500 mt-2 text-center">{analysisError}</p>}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleNextQuestion}
                                className="mt-6 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                            >
                                {currentQuestionIndex < quiz.length - 1 ? '下一題' : '查看結果'}
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
    
    return (
        <div>
            <div className="max-w-2xl mx-auto mb-6 p-4 bg-white rounded-2xl shadow-sm text-center border-t-4 border-indigo-500">
                <p className="text-sm font-semibold text-slate-600">可用於測驗的熟悉單字 (至少需 4 個)</p>
                <p className={`text-4xl font-bold mt-1 ${easyWords.length >= 4 ? 'text-green-600' : 'text-amber-600'}`}>
                    {easyWords.length}
                    <span className="text-2xl text-slate-400 font-medium"> / 4</span>
                </p>
            </div>
            {renderContent()}
        </div>
    );
};

export default WordUsageQuizView;