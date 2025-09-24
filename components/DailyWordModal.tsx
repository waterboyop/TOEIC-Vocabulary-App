
import React from 'react';
import { DailyWord } from '../types';
import { speak } from '../services/speechService';

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

interface DailyWordModalProps {
    isOpen: boolean;
    onClose: () => void;
    word: DailyWord | null;
    history: DailyWord[];
    isLoading: boolean;
    error: string | null;
}

const LoadingSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded-md w-1/3 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded-md w-1/4 mb-6"></div>
        <div className="h-5 bg-slate-200 rounded-md w-full mb-2"></div>
        <div className="h-5 bg-slate-200 rounded-md w-5/6 mb-6"></div>
        <div className="h-16 bg-slate-200 rounded-lg w-full mb-6"></div>
        <div className="h-12 bg-slate-200 rounded-lg w-full"></div>
    </div>
);

const DailyWordModal: React.FC<DailyWordModalProps> = ({ isOpen, onClose, word, history, isLoading, error }) => {
    const pastHistory = history.filter(h => h.date !== word?.date);

    return (
        <div 
            className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-labelledby="daily-word-title"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

            {/* Side Panel */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-slate-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                        <h2 id="daily-word-title" className="text-xl font-bold text-slate-800">每日一語</h2>
                        <button onClick={onClose} className="p-2 text-slate-500 rounded-full hover:bg-slate-200 hover:text-slate-800 transition-colors" aria-label="Close">
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-grow p-6 overflow-y-auto">
                        {isLoading && !word && <LoadingSkeleton />}
                        {error && <div className="text-center p-6 bg-red-50 rounded-lg"><p className="text-red-700 font-medium">{error}</p></div>}
                        {word && (
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-3xl font-bold text-indigo-700">{word.slang}</h3>
                                    <button onClick={() => speak(word.slang, 'en-US')} className="text-slate-500 hover:text-indigo-600 transition-colors"><SpeakerIcon /></button>
                                </div>
                                {word.phonetic && <p className="text-slate-500 font-mono mb-4">/{word.phonetic}/</p>}
                                <p className="text-slate-700 text-base leading-relaxed mb-4">{word.definition}</p>
                                
                                <div className="bg-white border border-slate-200 p-4 rounded-lg mb-4 text-sm space-y-2">
                                    <p className="italic text-slate-800">"{word.example}"</p>
                                    {word.chineseExample && <p className="text-slate-600">{word.chineseExample}</p>}
                                </div>

                                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg text-sm">
                                    <p className="font-bold text-indigo-800 mb-1">💡 小知識</p>
                                    <p className="text-indigo-700">{word.trivia}</p>
                                </div>
                            </div>
                        )}

                        {/* History */}
                        {pastHistory.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-slate-200">
                                <h4 className="text-lg font-bold text-slate-700 mb-4">歷史紀錄</h4>
                                <div className="space-y-4">
                                    {pastHistory.map(item => (
                                        <div key={item.date} className="bg-white p-4 rounded-lg shadow-sm">
                                            <div className="flex justify-between items-baseline">
                                                <p className="font-bold text-slate-800">{item.slang}</p>
                                                <p className="text-xs text-slate-400">{item.date}</p>
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1">{item.definition}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyWordModal;