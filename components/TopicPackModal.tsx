import React, { useState, useEffect, useRef, Fragment } from 'react';
import { TopicPack, VocabularyWord, DialogueLine } from '../types';
import { speak } from '../services/speechService';

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const highlightWords = (text: string, words: string[]) => {
    if (!words || words.length === 0) {
        return <>{text}</>;
    }
    const regex = new RegExp(`\\b(${words.join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) =>
                words.some(w => w.toLowerCase() === part.toLowerCase()) ? (
                    <span key={i} className="bg-indigo-100 text-indigo-800 font-semibold rounded px-1 py-0.5">
                        {part}
                    </span>
                ) : (
                    <Fragment key={i}>{part}</Fragment>
                )
            )}
        </>
    );
};


interface TopicPackModalProps {
    pack: TopicPack;
    onClose: () => void;
    onDelete: (packId: string) => void;
    // Fix: Corrected the type for onAddWordsToVocabulary to match the word structure in TopicPack, which excludes SRS fields.
    onAddWordsToVocabulary: (words: Omit<VocabularyWord, 'id' | 'familiarity' | 'tags' | 'additionalExamples' | 'writingPractice' | 'dueDate' | 'interval'>[]) => void;
}

const TopicPackModal: React.FC<TopicPackModalProps> = ({ pack, onClose, onDelete, onAddWordsToVocabulary }) => {
    const [activeTab, setActiveTab] = useState('vocabulary');
    const [isPlaying, setIsPlaying] = useState(false);
    const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
    const speakerVoiceMap = useRef<{ [key: string]: SpeechSynthesisVoice }>({});
    const utteranceQueue = useRef<SpeechSynthesisUtterance[]>([]);
    const currentUtteranceIndex = useRef(0);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        const loadVoices = () => {
            const allVoices = window.speechSynthesis.getVoices();
            voicesRef.current = allVoices.filter(v => v.lang.startsWith('en-'));
            if (voicesRef.current.length > 0) {
                setupDialogue();
            }
        };

        loadVoices();
        // Voices may load asynchronously
        window.speechSynthesis.onvoiceschanged = loadVoices;

        // Cleanup function
        return () => {
            window.speechSynthesis.cancel();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [pack.dialogue]);
    
    const setupDialogue = () => {
        if (voicesRef.current.length === 0) return;
        
        const speakers = [...new Set(pack.dialogue.map(d => d.speaker))];
        const allEnVoices = voicesRef.current;
        
        // Try to get distinct male/female voices for a better experience
        const femaleVoices = allEnVoices.filter(v => v.name.toLowerCase().includes('female'));
        const maleVoices = allEnVoices.filter(v => v.name.toLowerCase().includes('male'));

        let voice1 = femaleVoices[0] || allEnVoices.find(v => v.lang.startsWith('en-US')) || allEnVoices[0];
        let voice2 = maleVoices[0] || allEnVoices.find(v => v.lang.startsWith('en-GB') && v !== voice1) || allEnVoices.find(v => v !== voice1) || voice1;


        speakerVoiceMap.current = {};
        if (speakers[0]) speakerVoiceMap.current[speakers[0]] = voice1;
        if (speakers[1]) speakerVoiceMap.current[speakers[1]] = voice2;

        utteranceQueue.current = pack.dialogue.map(line => {
            const utterance = new SpeechSynthesisUtterance(line.line);
            utterance.voice = speakerVoiceMap.current[line.speaker] || voice1;
            
            // Differentiate speaker voices by pitch and rate for better clarity
            if (speakers[1] && line.speaker === speakers[1]) {
                utterance.pitch = 1.3; // Make the second speaker's pitch higher for more distinction.
                utterance.rate = 0.9;  // Slightly slower speech for the second speaker.
            } else {
                utterance.pitch = 1.0; // Normal pitch for the first speaker.
                utterance.rate = 0.95; // Normal speed for the first speaker.
            }
            
            return utterance;
        });
    };
    
    const handlePlayPause = () => {
        if (isPlaying) {
            // ---- PAUSE LOGIC ----
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        } else {
            // ---- PLAY LOGIC ----
            if (utteranceQueue.current.length === 0) return;
            
            window.speechSynthesis.cancel(); // Safety cancel before starting
            
            currentUtteranceIndex.current = -1; // Will be incremented to 0 before first play
            setIsPlaying(true);

            const playLoop = () => {
                // Check if the synth is not speaking and we are still in play mode
                if (!window.speechSynthesis.speaking) {
                    currentUtteranceIndex.current++;
                    
                    if (currentUtteranceIndex.current >= utteranceQueue.current.length) {
                        // Reached the end of the dialogue
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        setIsPlaying(false);
                    } else {
                        // Speak the next line
                        window.speechSynthesis.speak(utteranceQueue.current[currentUtteranceIndex.current]);
                    }
                }
            };

            // Clear any old interval before starting a new one
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            
            playLoop(); // Start immediately without waiting for the first interval
            intervalRef.current = window.setInterval(playLoop, 250);
        }
    };


    const renderVocabulary = () => (
        <div className="space-y-4">
            {pack.words.map((word, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-800">{word.word} <span className="font-mono text-slate-500 text-sm font-normal">/{word.phonetic}/</span></p>
                        <button onClick={() => speak(word.word)} className="p-1 text-slate-500 hover:text-indigo-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{word.chineseDefinition}</p>
                    <div className="mt-2 pt-2 border-t border-slate-200">
                         <p className="text-sm text-slate-700 italic">"{word.exampleSentence}"</p>
                    </div>
                </div>
            ))}
        </div>
    );
    
    const renderDialogue = () => {
        const keywords = pack.words.map(w => w.word);
        return (
            <div>
                 <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm mb-6">
                    <h3 className="font-bold text-lg text-slate-800">{pack.chineseTitle} Debrief</h3>
                    <button onClick={handlePlayPause} className={`p-3 rounded-full transition-colors ${isPlaying ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {isPlaying ? 
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 5a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg> :
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                        }
                    </button>
                </div>
                <div className="space-y-4">
                    {pack.dialogue.map((line, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                                {line.speaker.charAt(0)}
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm w-full">
                                <p className="font-semibold text-slate-700">{line.speaker}</p>
                                <p className="text-slate-800 my-1">{highlightWords(line.line, keywords)}</p>
                                <p className="text-sm text-slate-500">{line.translation}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-100 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-6 border-b border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-indigo-700">{pack.chineseTitle}</h2>
                            <p className="text-slate-500">{pack.title}</p>
                            <p className="text-sm text-slate-600 mt-2 max-w-xl">{pack.description}</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-200">
                            <CloseIcon />
                        </button>
                    </div>
                </header>
                
                <div className="px-6 border-b border-slate-200">
                     <nav className="flex items-center gap-6 -mb-px">
                        <button onClick={() => setActiveTab('vocabulary')} className={`py-3 px-1 text-sm font-semibold border-b-2  ${activeTab === 'vocabulary' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} transition-colors`}>必備詞彙</button>
                        <button onClick={() => setActiveTab('dialogue')} className={`py-3 px-1 text-sm font-semibold border-b-2 ${activeTab === 'dialogue' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} transition-colors`}>情境對話</button>
                    </nav>
                </div>

                <main className="p-6 overflow-y-auto flex-grow bg-slate-50">
                   {activeTab === 'vocabulary' ? renderVocabulary() : renderDialogue()}
                </main>

                <footer className="p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3">
                    <button onClick={() => onDelete(pack.id)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">刪除</button>
                    <button onClick={() => onAddWordsToVocabulary(pack.words)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                        加入字庫
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default TopicPackModal;