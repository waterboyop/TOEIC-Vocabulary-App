import React, { useState } from 'react';
import { VocabularyWord } from '../types';
import { generateDefinitionAndExample } from '../services/geminiService';

const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.256 9a1 1 0 010 1.998l-3.11 1.056L13 17.254a1 1 0 01-1.932 0L9.854 12.8l-3.11-1.056a1 1 0 010-1.998l3.11-1.056L11.033 2.744A1 1 0 0112 2z" clipRule="evenodd" /></svg>;

interface ManageWordsViewProps {
    onGenerateWords: () => Promise<void>;
    isGenerating: boolean;
    // Fix: Corrected the type for onAddWord to match the data shape from the form, which excludes id, familiarity, and SRS fields.
    onAddWord: (newWord: Omit<VocabularyWord, 'id' | 'familiarity' | 'dueDate' | 'interval' | 'tags' | 'additionalExamples' | 'writingPractice'>) => void;
}

const ManageWordsView: React.FC<ManageWordsViewProps> = ({
    onGenerateWords,
    isGenerating: isGeneratingList,
    onAddWord
}) => {
    // State for the manual add form
    const [word, setWord] = useState('');
    const [phonetic, setPhonetic] = useState('');
    const [definition, setDefinition] = useState('');
    const [chineseDefinition, setChineseDefinition] = useState('');
    const [exampleSentence, setExampleSentence] = useState('');
    const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateDetails = async () => {
        if (!word.trim()) {
            setError("請輸入單字以生成詳細資訊。");
            return;
        }
        setIsGeneratingDetails(true);
        setError(null);
        try {
            const result = await generateDefinitionAndExample(word.trim());
            setWord(result.word);
            setPhonetic(result.phonetic);
            setDefinition(result.definition);
            setChineseDefinition(result.chineseDefinition);
            setExampleSentence(result.exampleSentence);
        } catch (err: any) {
            setError(err.message || "發生未知錯誤。");
        } finally {
            setIsGeneratingDetails(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (word.trim() && phonetic.trim() && definition.trim() && chineseDefinition.trim() && exampleSentence.trim()) {
            onAddWord({ word, phonetic, definition, chineseDefinition, exampleSentence });
            setWord('');
            setPhonetic('');
            setDefinition('');
            setChineseDefinition('');
            setExampleSentence('');
            setError(null);
        } else {
            setError("所有欄位皆為必填。");
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* AI Smart Recommendation */}
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">AI 智慧推薦</h2>
                <p className="text-slate-500 mb-6">讓 AI 為您推薦 10 個常見的多益單字，快速擴充您的字彙量。</p>
                <button
                    onClick={onGenerateWords}
                    disabled={isGeneratingList}
                    className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                    {isGeneratingList ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                            <span>生成中...</span>
                        </>
                    ) : (
                       <>
                            <span className="text-xl mr-2">⊕</span>
                            AI 推薦 10 個單字
                       </>
                    )}
                </button>
            </div>

            {/* Divider */}
            <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 font-semibold">或者</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Manual Add Form */}
            <div className="bg-white p-8 rounded-2xl shadow-sm mb-12">
                <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">手動新增單字</h2>
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r-md" role="alert">
                        <p>{error}</p>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="word" className="block text-sm font-medium text-slate-700 mb-1">單字</label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="text" id="word" value={word} onChange={(e) => setWord(e.target.value)}
                                className="flex-grow block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="例如：collaborate"
                            />
                            <button
                                type="button" onClick={handleGenerateDetails} disabled={isGeneratingDetails || !word.trim()}
                                className="flex-shrink-0 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isGeneratingDetails ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <SparklesIcon />
                                )}
                                <span className="ml-2 hidden sm:inline">AI 填入</span>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="phonetic" className="block text-sm font-medium text-slate-700 mb-1">音標 (IPA)</label>
                        <input
                            type="text" id="phonetic" value={phonetic} onChange={(e) => setPhonetic(e.target.value)}
                            className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="例如：kəˈlæbəˌreɪt"
                        />
                    </div>
                    <div>
                        <label htmlFor="definition" className="block text-sm font-medium text-slate-700 mb-1">英文定義</label>
                        <textarea
                            id="definition" value={definition} onChange={(e) => setDefinition(e.target.value)} rows={2}
                            className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="單字的英文解釋。"
                        />
                    </div>
                    <div>
                        <label htmlFor="chineseDefinition" className="block text-sm font-medium text-slate-700 mb-1">中文定義</label>
                        <textarea
                            id="chineseDefinition" value={chineseDefinition} onChange={(e) => setChineseDefinition(e.target.value)} rows={2}
                            className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="單字的中文解釋。"
                        />
                    </div>
                    <div>
                        <label htmlFor="example" className="block text-sm font-medium text-slate-700 mb-1">例句</label>
                        <textarea
                            id="example" value={exampleSentence} onChange={(e) => setExampleSentence(e.target.value)} rows={3}
                            className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="使用該單字的句子。"
                        />
                    </div>
                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                            新增至單字列表
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManageWordsView;