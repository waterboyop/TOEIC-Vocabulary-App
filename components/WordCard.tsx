
import React, { useState } from 'react';
import { VocabularyWord } from '../types';
import { speak } from '../services/speechService';
import { explainSentence } from '../services/geminiService';

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 4a1 1 0 00-2 0v12a1 1 0 102 0V4z" />
        <path fillRule="evenodd" d="M13.628 3.372a1 1 0 011.09.217l2 2.5a1 1 0 010 1.14l-2 2.5a1 1 0 01-1.542-1.229L13.586 7H9a1 1 0 100 2h4.586l-1.414 1.768a1 1 0 011.455 1.343l2-2.5a1 1 0 010-1.14l-2-2.5a1 1 0 01-.367-.92z" clipRule="evenodd" />
    </svg>
);

const GrammarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm0 8a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zm6-8a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2h-4z" clipRule="evenodd" />
    </svg>
);


interface WordCardProps {
    word: VocabularyWord;
    onUpdateFamiliarity: (wordId: string, newFamiliarity: number) => void;
    onAnalyzeWord: (wordId: string) => void;
}

const WordCard: React.FC<WordCardProps> = ({ word, onUpdateFamiliarity, onAnalyzeWord }) => {
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isExplaining, setIsExplaining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExplainSentence = async () => {
        if (explanation) { // Toggle off if already shown
            setExplanation(null);
            return;
        }
        setIsExplaining(true);
        setError(null);
        try {
            const result = await explainSentence(word.word, word.exampleSentence);
            setExplanation(result);
            onAnalyzeWord(word.id);
        } catch (err: any) {
            setError(err.message || '無法取得解釋。');
        } finally {
            setIsExplaining(false);
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between">
            <div>
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-grow">
                        <h3 className="text-xl font-bold text-slate-900">{word.word}</h3>
                        {word.phonetic && <p className="text-slate-500 font-mono text-sm">/{word.phonetic}/</p>}
                    </div>
                    <button
                        onClick={() => speak(word.word)}
                        className="p-2 rounded-full text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors flex-shrink-0"
                        aria-label={`Pronounce ${word.word}`}
                    >
                        <SpeakerIcon />
                    </button>
                </div>
                <p className="text-slate-600 mb-1">{word.definition}</p>
                <p className="text-indigo-600 font-semibold mb-4">{word.chineseDefinition}</p>
                <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-start space-x-3">
                        <p className="text-slate-700 italic flex-grow">"{word.exampleSentence}"</p>
                        <div className="flex-shrink-0 flex flex-col items-center space-y-1 mt-1">
                             <button
                                onClick={() => speak(word.exampleSentence)}
                                className="p-2 rounded-full text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                                aria-label="Pronounce example sentence"
                             >
                                <SpeakerIcon />
                            </button>
                            <button
                                onClick={handleExplainSentence}
                                className="p-2 rounded-full text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                                aria-label="Explain sentence grammar"
                                disabled={isExplaining}
                            >
                                {isExplaining ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div> : <GrammarIcon />}
                            </button>
                        </div>
                    </div>
                     {explanation && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                           <p className="text-sm text-slate-800 whitespace-pre-wrap font-mono bg-indigo-50 p-3 rounded-md">{explanation}</p>
                        </div>
                    )}
                    {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default WordCard;