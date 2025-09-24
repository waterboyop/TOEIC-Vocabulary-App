
import React, { useState, useEffect } from 'react';
import { VocabularyWord } from '../types';
import { speak } from '../services/speechService';

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

interface FlashcardViewProps {
    words: VocabularyWord[];
    onUpdateWord: (wordId: string, rating: 'again' | 'good' | 'easy') => void;
    onFinish: () => void;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ words, onUpdateWord, onFinish }) => {
    const [reviewQueue, setReviewQueue] = useState<VocabularyWord[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [initialCount, setInitialCount] = useState(0);
    const [completedInSession, setCompletedInSession] = useState(0);

    useEffect(() => {
        // Shuffle the initial words to make the review session less predictable
        // and set the initial state for the session. This should only run once.
        const initialWords = [...words].sort(() => Math.random() - 0.5);
        setReviewQueue(initialWords);
        setInitialCount(initialWords.length);
        setCompletedInSession(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // This effect should only run once when the component mounts to set up the session.

    if (initialCount === 0 || sessionComplete) {
        return (
            <div className="text-center p-10 bg-white rounded-2xl shadow-lg max-w-md mx-auto animate-fade-in">
                <h2 className="text-2xl font-bold text-green-600 mb-2">🎉 恭喜！</h2>
                <p className="text-slate-600 mb-6">您已完成今天所有的複習！</p>
                <button
                    onClick={onFinish}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                >
                    返回儀表板
                </button>
            </div>
        );
    }
    
    if (reviewQueue.length === 0) {
        return <div>載入中...</div>;
    }

    const currentWord = reviewQueue[currentIndex];

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleReview = (rating: 'again' | 'good' | 'easy') => {
        if (!isFlipped || !currentWord) return;

        onUpdateWord(currentWord.id, rating);
        
        let nextQueue = [...reviewQueue];
        if (rating === 'again') {
            // Move the current card to roughly the middle of the remaining queue to see it again soon
            const cardToReAdd = nextQueue.splice(currentIndex, 1)[0];
            const reinsertIndex = Math.max(1, Math.floor(nextQueue.length / 2));
            nextQueue.splice(reinsertIndex, 0, cardToReAdd);
        } else {
            // Remove the card from the queue for this session and update progress
            setCompletedInSession(c => c + 1);
            nextQueue.splice(currentIndex, 1);
        }

        setIsFlipped(false);

        // Use a timeout to allow the card to flip back before changing
        setTimeout(() => {
            if (nextQueue.length === 0) {
                setSessionComplete(true);
            } else {
                // If we removed an item, the next item is now at the same index.
                // If we removed the last item, loop back to the start.
                const nextIndex = currentIndex >= nextQueue.length ? 0 : currentIndex;
                setReviewQueue(nextQueue);
                setCurrentIndex(nextIndex);
            }
        }, 300); // Match this with card transition duration
    };

    const progress = initialCount > 0 ? (completedInSession / initialCount) * 100 : 0;


    return (
        <div className="flex flex-col items-center justify-center h-full w-full">
            {/* Header */}
            <div className="w-full max-w-2xl flex justify-between items-center mb-4 px-2">
                <button onClick={onFinish} className="text-slate-500 hover:text-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="text-slate-600 font-semibold text-base">
                    已完成: {completedInSession} / {initialCount}
                </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full max-w-2xl bg-slate-200 rounded-full h-2.5 mb-6">
                <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>

            {/* Flashcard */}
            <div className="w-full max-w-2xl h-[400px] perspective-1000">
                <div
                    className={`relative w-full h-full cursor-pointer transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                    onClick={handleFlip}
                >
                    {/* Front */}
                    <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 backface-hidden">
                        <button
                            onClick={(e) => { e.stopPropagation(); speak(currentWord.word); }}
                            className="absolute top-6 right-6 p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        >
                            <SpeakerIcon />
                        </button>
                        <h1 className="text-6xl font-bold text-indigo-700">{currentWord.word}</h1>
                        <p className="mt-4 text-2xl text-slate-500 font-mono">/{currentWord.phonetic}/</p>
                    </div>

                    {/* Back */}
                    <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 rotate-y-180 backface-hidden">
                        <div className="text-center">
                             <h2 className="text-3xl font-bold text-slate-800 mb-4">{currentWord.chineseDefinition}</h2>
                             <p className="text-lg text-slate-600 mb-8">{currentWord.definition}</p>
                             <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-3">
                                <button
                                    onClick={(e) => { e.stopPropagation(); speak(currentWord.exampleSentence); }}
                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                >
                                    <SpeakerIcon />
                                </button>
                                <p className="text-slate-700 italic text-left">"{currentWord.exampleSentence}"</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SRS Buttons */}
            {isFlipped && (
                 <div className="mt-8 w-full max-w-2xl grid grid-cols-3 gap-4 animate-fade-in">
                    <button
                        onClick={() => handleReview('again')}
                        className="p-4 bg-red-100 text-red-700 font-bold rounded-lg shadow-sm hover:bg-red-200 transition-colors"
                    >
                        重來 <span className="font-normal text-sm">(0d)</span>
                    </button>
                     <button
                        onClick={() => handleReview('good')}
                        className="p-4 bg-blue-100 text-blue-700 font-bold rounded-lg shadow-sm hover:bg-blue-200 transition-colors"
                    >
                        良好 <span className="font-normal text-sm">(1d)</span>
                    </button>
                     <button
                        onClick={() => handleReview('easy')}
                        className="p-4 bg-green-100 text-green-700 font-bold rounded-lg shadow-sm hover:bg-green-200 transition-colors"
                    >
                        簡單 <span className="font-normal text-sm">(2d)</span>
                    </button>
                </div>
            )}
            
            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default FlashcardView;