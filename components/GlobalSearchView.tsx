import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VocabularyWord, TopicPack, DailyWord, DailyGrammar } from '../types';

interface SearchResults {
    words: VocabularyWord[];
    topicPacks: TopicPack[];
    dailyWords: DailyWord[];
    dailyGrammars: DailyGrammar[];
}

interface GlobalSearchViewProps {
    words: VocabularyWord[];
    topicPacks: TopicPack[];
    dailyWordHistory: DailyWord[];
    dailyGrammarHistory: DailyGrammar[];
    onWordSelect: (word: VocabularyWord) => void;
    onTopicPackSelect: (pack: TopicPack) => void;
    onDailyWordSelect: (word: DailyWord) => void;
    onDailyGrammarSelect: (grammar: DailyGrammar) => void;
}

const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({
    words,
    topicPacks,
    dailyWordHistory,
    dailyGrammarHistory,
    onWordSelect,
    onTopicPackSelect,
    onDailyWordSelect,
    onDailyGrammarSelect,
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [isActive, setIsActive] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceTimeout = useRef<number | null>(null);

    const performSearch = useCallback((searchTerm: string) => {
        if (!searchTerm) {
            setResults(null);
            return;
        }

        const lowerCaseQuery = searchTerm.toLowerCase();

        const filteredWords = words
            .filter(w =>
                w.word.toLowerCase().includes(lowerCaseQuery) ||
                w.chineseDefinition.toLowerCase().includes(lowerCaseQuery) ||
                w.definition.toLowerCase().includes(lowerCaseQuery)
            )
            .slice(0, 5);

        const filteredTopicPacks = topicPacks
            .filter(p =>
                p.title.toLowerCase().includes(lowerCaseQuery) ||
                p.chineseTitle.toLowerCase().includes(lowerCaseQuery)
            )
            .slice(0, 3);
            
        const filteredDailyWords = dailyWordHistory
            .filter(d =>
                d.slang.toLowerCase().includes(lowerCaseQuery) ||
                d.definition.toLowerCase().includes(lowerCaseQuery)
            )
            .slice(0, 3);
            
        const filteredDailyGrammars = dailyGrammarHistory
            .filter(g =>
                g.topic.toLowerCase().includes(lowerCaseQuery) ||
                g.explanation.toLowerCase().includes(lowerCaseQuery)
            )
            .slice(0, 3);

        const searchResults: SearchResults = {
            words: filteredWords,
            topicPacks: filteredTopicPacks,
            dailyWords: filteredDailyWords,
            dailyGrammars: filteredDailyGrammars,
        };
        
        const hasResults = Object.values(searchResults).some(arr => arr.length > 0);
        setResults(hasResults ? searchResults : null);

    }, [words, topicPacks, dailyWordHistory, dailyGrammarHistory]);

    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = window.setTimeout(() => {
            performSearch(query);
        }, 300); // 300ms debounce

        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, [query, performSearch]);

    // Handle clicks outside of the search component
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsActive(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const resetSearch = () => {
        setQuery('');
        setResults(null);
        setIsActive(false);
    };

    // FIX: Add a type guard to ensure arr is an array before accessing .length
    const hasResults = results && Object.values(results).some(arr => Array.isArray(arr) && arr.length > 0);

    return (
        <div className="relative mb-8" ref={searchRef}>
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                    type="text"
                    placeholder="搜尋單字、主題包、每日精選..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsActive(true)}
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-full text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow shadow-sm hover:shadow-md focus:shadow-lg"
                />
            </div>
            
            {isActive && query && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fade-in-down">
                    {hasResults ? (
                        <div className="max-h-[60vh] overflow-y-auto p-2 sm:p-4">
                            {results.words.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-slate-500 px-3 mb-2">單字庫</h3>
                                    <ul className="space-y-1">
                                        {results.words.map(word => (
                                            <li key={word.id}>
                                                <button onClick={() => { onWordSelect(word); resetSearch(); }} className="w-full text-left p-3 rounded-lg hover:bg-indigo-50 transition-colors">
                                                    <p className="font-bold text-slate-800">{word.word}</p>
                                                    <p className="text-sm text-slate-600 truncate">{word.chineseDefinition}</p>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {results.topicPacks.length > 0 && (
                               <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-slate-500 px-3 mb-2">主題學習包</h3>
                                    <ul className="space-y-1">
                                        {results.topicPacks.map(pack => (
                                            <li key={pack.id}>
                                                <button onClick={() => { onTopicPackSelect(pack); resetSearch(); }} className="w-full text-left p-3 rounded-lg hover:bg-indigo-50 transition-colors">
                                                    <p className="font-bold text-slate-800">{pack.chineseTitle}</p>
                                                    <p className="text-sm text-slate-600 truncate">{pack.title}</p>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                             {results.dailyWords.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-slate-500 px-3 mb-2">每日俚語</h3>
                                    <ul className="space-y-1">
                                        {results.dailyWords.map(word => (
                                            <li key={word.date}>
                                                <button onClick={() => { onDailyWordSelect(word); resetSearch(); }} className="w-full text-left p-3 rounded-lg hover:bg-indigo-50 transition-colors">
                                                    <p className="font-bold text-slate-800">{word.slang}</p>
                                                    <p className="text-sm text-slate-600 truncate">{word.definition}</p>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                             {results.dailyGrammars.length > 0 && (
                                 <div>
                                    <h3 className="text-sm font-semibold text-slate-500 px-3 mb-2">每日文法</h3>
                                    <ul className="space-y-1">
                                        {results.dailyGrammars.map(grammar => (
                                            <li key={grammar.date}>
                                                <button onClick={() => { onDailyGrammarSelect(grammar); resetSearch(); }} className="w-full text-left p-3 rounded-lg hover:bg-indigo-50 transition-colors">
                                                    <p className="font-bold text-slate-800">{grammar.topic}</p>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                         <div className="p-6 text-center">
                            <p className="text-slate-500">找不到與 "{query}" 相關的結果。</p>
                        </div>
                    )}
                </div>
            )}
            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down { animation: fade-in-down 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default GlobalSearchView;
