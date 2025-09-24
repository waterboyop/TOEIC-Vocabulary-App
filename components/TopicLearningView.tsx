import React, { useState, useEffect, useMemo } from 'react';
import { TopicPack } from '../types';
import { generateTopicPack, summarizeTopicGroup } from '../services/geminiService';
import { GROUP_TITLES_KEY } from '../constants';

interface TopicLearningViewProps {
    topicPacks: TopicPack[];
    onAddTopicPack: (pack: Omit<TopicPack, 'id'>) => void;
    onSelectTopicPack: (pack: TopicPack) => void;
}

const suggestedTopics = [
    { name: "商務會議", eng: "Business Meetings" },
    { name: "辦公室溝通", eng: "Office Communication" },
    { name: "行銷與廣告", eng: "Marketing & Advertising" },
    { name: "財務與會計", eng: "Finance & Accounting" },
    { name: "機場商旅", eng: "Business Travel" },
    { name: "合約談判", eng: "Contract Negotiations" },
    { name: "客戶服務", eng: "Customer Service" },
    { name: "產品開發", eng: "Product Development" }
];

const groupPacksByCategory = (packs: TopicPack[]): { [category: string]: TopicPack[] } => {
    return packs.reduce((acc, pack) => {
        const category = pack.category || 'Uncategorized'; // Fallback for older data
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(pack);
        return acc;
    }, {} as { [category: string]: TopicPack[] });
};

const TopicLearningView: React.FC<TopicLearningViewProps> = ({ topicPacks, onAddTopicPack, onSelectTopicPack }) => {
    const [isGenerating, setIsGenerating] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [groupTitles, setGroupTitles] = useState<{ [category: string]: string }>({});

    const groupedPacks = useMemo(() => groupPacksByCategory(topicPacks), [topicPacks]);

    useEffect(() => {
        const storedTitles = JSON.parse(localStorage.getItem(GROUP_TITLES_KEY) || '{}');
        setGroupTitles(storedTitles);

        Object.entries(groupedPacks).forEach(async ([category, packs]) => {
            // FIX: Add a type guard to ensure 'packs' is an array before accessing its properties.
            if (Array.isArray(packs) && packs.length > 1 && !storedTitles[category]) {
                try {
                    const packTitles = packs.map(p => p.chineseTitle);
                    const summaryTitle = await summarizeTopicGroup(packTitles);
                    
                    setGroupTitles(prev => {
                        const newTitles = { ...prev, [category]: summaryTitle };
                        localStorage.setItem(GROUP_TITLES_KEY, JSON.stringify(newTitles));
                        return newTitles;
                    });
                } catch (e) {
                    console.error(`Failed to generate title for ${category}`, e);
                }
            }
        });
    }, [groupedPacks]);

    const handleGeneratePack = async (topic: { name: string, eng: string }) => {
        setIsGenerating(topic.eng);
        setError(null);
        try {
            const existingTitles = topicPacks.map(p => p.title);
            const newPackData = await generateTopicPack(topic.eng, existingTitles);
            const newPackWithCategory = { ...newPackData, category: topic.eng };
            onAddTopicPack(newPackWithCategory);
        } catch (err: any) {
            setError(err.message || `無法生成 "${topic.name}" 主題包，請稍後再試。`);
        } finally {
            setIsGenerating(null);
        }
    };

    const getCategoryChineseName = (engCategory: string) => {
        return suggestedTopics.find(t => t.eng === engCategory)?.name || engCategory;
    };

    if (expandedCategory && groupedPacks[expandedCategory]) {
        const packsInGroup = groupedPacks[expandedCategory].slice().reverse(); // Show newest first
        const title = groupTitles[expandedCategory] || getCategoryChineseName(expandedCategory);

        return (
            <div className="max-w-4xl mx-auto animate-fade-in">
                <button 
                    onClick={() => setExpandedCategory(null)}
                    className="mb-6 inline-flex items-center text-slate-600 hover:text-slate-900 font-semibold"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    返回主題庫
                </button>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{title}</h2>
                <p className="text-slate-500 mb-6">{packsInGroup.length} 個學習包</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packsInGroup.map(pack => (
                        <button
                            key={pack.id}
                            onClick={() => onSelectTopicPack(pack)}
                            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left flex flex-col justify-between"
                        >
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{pack.chineseTitle}</h3>
                                <p className="text-sm text-slate-500 mb-4">{pack.title}</p>
                            </div>
                            <p className="text-sm font-medium text-indigo-600">{pack.words.length} 個學習單字</p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <style>{`.animate-fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            <div className="mb-12">
                <h1 className="text-3xl font-bold text-slate-800">主題學習包</h1>
                <p className="mt-2 text-slate-600">選擇一個主題，讓 AI 為您生成相關的單字與對話情境。</p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm mb-12">
                <h2 className="text-xl font-bold text-slate-800 mb-4">點擊主題以生成新的學習包</h2>
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert"><p>{error}</p></div>}
                <div className="flex flex-wrap gap-3">
                    {suggestedTopics.map(topic => (
                        <button
                            key={topic.eng}
                            onClick={() => handleGeneratePack(topic)}
                            disabled={!!isGenerating}
                            className="px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold rounded-full hover:bg-indigo-100 hover:text-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isGenerating === topic.eng ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-700 mr-2"></div>
                                    <span>生成中...</span>
                                </>
                            ) : (
                                `${topic.name} (${topic.eng})`
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">我的主題庫</h2>
                {topicPacks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {Object.entries(groupedPacks).map(([category, packs]) => {
                            // FIX: Add type guard to ensure 'packs' is a non-empty array before using its properties.
                            if (!Array.isArray(packs) || packs.length === 0) return null;
                            const title = groupTitles[category] || getCategoryChineseName(category);
                            const count = packs.length;
                            return (
                                <button
                                    key={category}
                                    onClick={() => setExpandedCategory(category)}
                                    className="relative p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left flex flex-col justify-between min-h-[150px] bg-white"
                                >
                                    {/* Card stack effect */}
                                    {count > 1 && <div className="absolute inset-0 bg-white rounded-2xl transform rotate-3 scale-95 -z-10 transition-transform"></div>}
                                    {count > 2 && <div className="absolute inset-0 bg-white rounded-2xl transform -rotate-3 scale-90 -z-20 transition-transform"></div>}

                                    <div className="relative z-10">
                                        <h3 className="font-bold text-xl text-slate-800">{title}</h3>
                                        <p className="text-sm text-slate-500 mb-4">{count > 1 ? `${count} 個學習包` : packs[0].title}</p>
                                    </div>
                                    <div className="relative z-10 flex justify-between items-center">
                                         <p className="text-sm font-medium text-indigo-600">{getCategoryChineseName(category)}</p>
                                        <div className="flex items-center text-sm font-semibold text-slate-600">
                                            <span>查看</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 px-6 bg-slate-100 rounded-2xl">
                        <h3 className="text-lg font-medium text-slate-700">您的主題庫是空的</h3>
                        <p className="text-slate-500 mt-2">點擊上方的建議主題來生成您的第一個學習包！</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopicLearningView;