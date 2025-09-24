
import React, { useState, useMemo } from 'react';
import { VocabularyWord } from '../types';
import { speak } from '../services/speechService';

interface VocabularyListProps {
  words: VocabularyWord[];
  onUpdateFamiliarity: (wordId: string, newFamiliarity: number) => void;
  onAnalyzeWord: (wordId: string) => void;
  onWordSelect: (word: VocabularyWord) => void;
}

type FilterType = '全部' | '新學習' | '複習中' | '已精通';

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
        <path d="M16.071 5.071a1 1 0 011.414 0 5.98 5.98 0 011.828 4.243 1 1 0 11-1.99 0 3.98 3.98 0 00-1.212-2.828 1 1 0 01-.04-1.415z" />
    </svg>
);

const getNextReviewTime = (dueDate: string): { text: string; color: string } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reviewDate = new Date(dueDate);
    reviewDate.setHours(0, 0, 0, 0);

    const diffTime = reviewDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
        return { text: '今天', color: 'text-red-500 font-bold' };
    } else if (diffDays === 1) {
        return { text: '明天', color: 'text-slate-700' };
    } else {
        return { text: `${diffDays} 天後`, color: 'text-slate-600' };
    }
};


const VocabularyList: React.FC<VocabularyListProps> = ({ words, onUpdateFamiliarity, onAnalyzeWord, onWordSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('全部');

  const filteredWords = useMemo(() => {
    let filtered = words;

    // Filter by category
    switch (activeFilter) {
      case '新學習':
        filtered = words.filter(word => word.interval < 1);
        break;
      case '複習中':
        filtered = words.filter(word => word.interval >= 1);
        break;
      case '已精通':
        filtered = words.filter(word => word.familiarity === 5); // Kept for now, might be removed
        break;
    }

    // Filter by search term
    if (searchTerm.trim() !== '') {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(word =>
        word.word.toLowerCase().includes(lowercasedTerm) ||
        word.definition.toLowerCase().includes(lowercasedTerm) ||
        word.chineseDefinition.includes(lowercasedTerm) ||
        word.phonetic.toLowerCase().includes(lowercasedTerm)
      );
    }
    
    // Sort by due date for display
    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [words, searchTerm, activeFilter]);

  const filters: FilterType[] = ['全部', '新學習', '複習中']; // '已精通' might be removed later

  return (
    <div>
        <div className="mb-4 relative">
            <input
                type="text"
                placeholder="搜尋單字、定義、音標..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-100 border-2 border-transparent rounded-full text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
        </div>

        <div className="mb-6 flex items-center space-x-2 p-1 bg-slate-100 rounded-full">
            {filters.map(filter => (
                <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`flex-1 text-center px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeFilter === filter ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                    {filter}
                </button>
            ))}
        </div>

        <div className="space-y-3">
            {filteredWords.length > 0 ? (
                filteredWords.map(word => {
                    const reviewInfo = getNextReviewTime(word.dueDate);
                    return (
                        <button key={word.id} onClick={() => onWordSelect(word)} className="w-full bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center space-x-4 text-left">
                            <div
                                onClick={(e) => { e.stopPropagation(); speak(word.word); }}
                                className="p-2 rounded-full text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors shrink-0 cursor-pointer"
                                aria-label={`Pronounce ${word.word}`}
                            >
                                <SpeakerIcon />
                            </div>
                            <div className="flex-grow">
                                <p className="font-bold text-slate-800">
                                    {word.word}
                                    {word.phonetic && <span className="ml-2 font-mono text-slate-500 text-sm font-normal">/{word.phonetic}/</span>}
                                </p>
                                <p className="text-sm text-slate-600">{word.chineseDefinition}</p>
                            </div>
                            {reviewInfo.text && (
                                <div className="text-right shrink-0 w-20">
                                    <p className="text-xs text-slate-500">下次複習</p>
                                    <p className={`text-sm ${reviewInfo.color}`}>{reviewInfo.text}</p>
                                </div>
                            )}
                        </button>
                    );
                })
            ) : (
                <div className="text-center py-10 px-6 bg-slate-50 rounded-lg">
                    <h3 className="text-lg font-medium text-slate-700">找不到符合條件的單字</h3>
                    <p className="text-slate-500 mt-1">請嘗試更改篩選條件或搜尋關鍵字。</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default VocabularyList;