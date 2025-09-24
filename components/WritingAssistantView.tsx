
import React, { useState } from 'react';
import { rewriteSentenceForBusiness } from '../services/geminiService';

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.256 9a1 1 0 010 1.998l-3.11 1.056L13 17.254a1 1 0 01-1.932 0L9.854 12.8l-3.11-1.056a1 1 0 010-1.998l3.11-1.056L11.033 2.744A1 1 0 0112 2z" clipRule="evenodd" />
    </svg>
);

const LightBulbIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.657a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM4.343 5.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM11 16a1 1 0 10-2 0v1a1 1 0 102 0v-1zM5.657 15.657a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM14.343 15.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM4 11a1 1 0 100-2H3a1 1 0 100 2h1zM16 11a1 1 0 100-2h1a1 1 0 100 2h-1zM9 14a1 1 0 001 1h.01a1 1 0 100-2H10a1 1 0 00-1 1zM12 9a1 1 0 11-2 0 1 1 0 012 0zM9 7a1 1 0 001-1V5a1 1 0 10-2 0v1a1 1 0 001 1z" />
    </svg>
);

const WritingAssistantView: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [result, setResult] = useState<{ rewrittenText: string; explanation: string } | null>(null);
    const [isRewriting, setIsRewriting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRewrite = async () => {
        if (!inputText.trim()) return;
        setIsRewriting(true);
        setError(null);
        setResult(null);
        try {
            const response = await rewriteSentenceForBusiness(inputText);
            setResult(response);
        } catch (err: any) {
            setError(err.message || "發生未知錯誤，請稍後再試。");
        } finally {
            setIsRewriting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-1">AI 英文寫作輔助</h3>
            <p className="text-sm text-slate-500 mb-4">輸入您想改善的工作溝通用句，AI 將協助您寫得更流暢、更專業。</p>

            <div className="space-y-4">
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={5}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg shadow-inner text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    placeholder="例如：Sorry for my late reply."
                />
                <button
                    onClick={handleRewrite}
                    disabled={isRewriting || !inputText.trim()}
                    className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {isRewriting ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            <span>分析中...</span>
                        </>
                    ) : (
                        <>
                            <SparklesIcon />
                            <span className="ml-2">AI 智慧改寫</span>
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-md" role="alert">
                    <p>{error}</p>
                </div>
            )}
            
            <div className="mt-6">
                {isRewriting ? (
                     <div className="animate-pulse space-y-4">
                        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-10 bg-slate-200 rounded-lg w-full"></div>
                        <div className="h-6 bg-slate-200 rounded w-1/3 mt-4"></div>
                        <div className="space-y-2">
                             <div className="h-4 bg-slate-200 rounded w-full"></div>
                             <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                        </div>
                    </div>
                ) : result ? (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h4 className="font-bold text-slate-700 mb-2">建議寫法：</h4>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <p className="text-green-900 font-medium text-base">{result.rewrittenText}</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-700 mb-2">修改說明：</h4>
                             <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 flex items-start gap-3">
                                <div className="flex-shrink-0 pt-1">
                                    <LightBulbIcon />
                                </div>
                                <p className="text-indigo-900 text-sm">{result.explanation}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                     <div className="text-center py-8 px-4 bg-slate-50 rounded-lg">
                        <p className="text-slate-500">您的改寫建議將會顯示在這裡。</p>
                    </div>
                )}
            </div>
             <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default WritingAssistantView;
