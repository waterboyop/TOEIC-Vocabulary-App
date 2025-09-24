import React, { useState, useRef } from 'react';
import { VocabularyWord } from '../types';
import { speak } from '../services/speechService';
import { generateMoreExamples, explainSentence, findSimilarWord, analyzeWordStructure, getWritingFeedback } from '../services/geminiService';

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
);

// Tab specific icons
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;
const CompareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm3.293 11.707a1 1 0 001.414 0L14 8.414V12a1 1 0 102 0V6a1 1 0 00-1-1h-6a1 1 0 100 2h3.586L7.293 12.293a1 1 0 000 1.414z" clipRule="evenodd" /></svg>;
const StructureIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0L7.15 7.5c-.25.98-.98 1.71-1.96 1.96l-4.33 1.36c-1.56.39-1.56 2.6 0 2.98l4.33 1.36c.98.25 1.71.98 1.96 1.96l1.36 4.33c.39 1.56 2.6 1.56 2.98 0l1.36-4.33c.25-.98.98-1.71 1.96-1.96l4.33-1.36c1.56-.39-1.56 2.6 0-2.98l-4.33-1.36c-.98-.25-1.71-.98-1.96-1.96L11.49 3.17z" clipRule="evenodd" /></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-5 5.91V14a1 1 0 11-2 0v-2.09zM10 2a5 5 0 00-5 5v3a5 5 0 0010 0V7a5 5 0 00-5-5z" clipRule="evenodd" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;


interface WordDetailModalProps {
    word: VocabularyWord;
    onClose: () => void;
    onAddTag: (wordId: string, tag: string) => void;
    onRemoveTag: (wordId: string, tag: string) => void;
    onAddExamples: (wordId: string, examples: string[]) => void;
    onUpdateDetails: (wordId: string, details: Partial<VocabularyWord>) => void;
}

const WordDetailModal: React.FC<WordDetailModalProps> = ({ word, onClose, onAddTag, onRemoveTag, onAddExamples, onUpdateDetails }) => {
    const [activeTab, setActiveTab] = useState('學習');
    const [tagInput, setTagInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    // AI Analysis State
    const [isAnalyzingSentence, setIsAnalyzingSentence] = useState(false);
    const [sentenceError, setSentenceError] = useState('');
    const [isFindingSimilar, setIsFindingSimilar] = useState(false);
    const [similarError, setSimilarError] = useState('');
    const [isAnalyzingStructure, setIsAnalyzingStructure] = useState(false);
    const [structureError, setStructureError] = useState('');

    // Practice Tab State
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [recordingError, setRecordingError] = useState('');

    const [writingInput, setWritingInput] = useState('');
    const [isGettingFeedback, setIsGettingFeedback] = useState(false);
    const [writingError, setWritingError] = useState('');

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            onAddTag(word.id, tagInput.trim());
            setTagInput('');
        }
    };

    const handleGenerateExamples = async () => {
        setIsGenerating(true);
        setError('');
        try {
            const newExamples = await generateMoreExamples(word.word, word.exampleSentence);
            onAddExamples(word.id, newExamples);
        } catch (err: any) {
            setError(err.message || '無法生成例句。');
        } finally {
            setIsGenerating(false);
        }
    };
    
    // AI Analysis Handlers
    const handleAnalyzeSentence = async () => {
        setIsAnalyzingSentence(true);
        setSentenceError('');
        try {
            const result = await explainSentence(word.word, word.exampleSentence);
            onUpdateDetails(word.id, { sentenceAnalysis: result });
        } catch (err: any) {
            setSentenceError(err.message || '無法分析例句。');
        } finally {
            setIsAnalyzingSentence(false);
        }
    };

    const handleFindSimilarWord = async () => {
        setIsFindingSimilar(true);
        setSimilarError('');
        try {
            const result = await findSimilarWord(word.word);
            onUpdateDetails(word.id, { similarWordAnalysis: result });
        } catch (err: any) {
            setSimilarError(err.message || '無法尋找相似字。');
        } finally {
            setIsFindingSimilar(false);
        }
    };
    
    const handleAnalyzeStructure = async () => {
        setIsAnalyzingStructure(true);
        setStructureError('');
        try {
            const result = await analyzeWordStructure(word.word);
            onUpdateDetails(word.id, { structureAnalysis: result });
        } catch (err: any) {
            setStructureError(err.message || '無法分析結構。');
        } finally {
            setIsAnalyzingStructure(false);
        }
    };

    // Practice Tab Handlers
    const handleToggleRecording = async () => {
        setRecordingError('');
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                const audioChunks: Blob[] = [];

                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener("stop", () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    setAudioUrl(audioUrl);
                    stream.getTracks().forEach(track => track.stop()); // Release microphone
                });

                mediaRecorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Error accessing microphone:", err);
                setRecordingError("無法取用麥克風。請確認已授權。");
            }
        }
    };

    const handleGetWritingFeedback = async () => {
        if (!writingInput.trim()) return;
        setIsGettingFeedback(true);
        setWritingError('');
        try {
            const feedback = await getWritingFeedback(word.word, writingInput);
            const newPractice = { sentence: writingInput, feedback };
            const updatedPractices = [...(word.writingPractice || []), newPractice];
            onUpdateDetails(word.id, { writingPractice: updatedPractices });
            setWritingInput(''); // Clear input on success
        } catch (err: any) {
            setWritingError(err.message || '無法取得 AI 回饋。');
        } finally {
            setIsGettingFeedback(false);
        }
    };

    const formatMorpheme = (part: string, type: 'prefix' | 'root' | 'suffix'): string => {
        const cleanedPart = part.replace(/^-|-$/g, ''); // remove leading/trailing hyphens
        switch (type) {
            case 'prefix': return `${cleanedPart}-`;
            case 'root': return cleanedPart;
            case 'suffix': return `-${cleanedPart}`;
        }
    };

    const renderPracticeTab = () => (
        <div className="space-y-6">
            {/* Pronunciation Practice */}
            <div className="bg-slate-100 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                    <MicIcon />
                    <h3 className="text-md font-bold text-slate-700">發音練習</h3>
                </div>
                <button 
                    onClick={handleToggleRecording}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isRecording 
                        ? 'bg-red-100 border border-red-300 text-red-700 hover:bg-red-200'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                    {isRecording ? '停止錄音' : '開始錄音'}
                </button>
                {recordingError && <p className="text-xs text-red-500 mt-2 text-center">{recordingError}</p>}
                {audioUrl && (
                    <div className="mt-3">
                        <audio controls src={audioUrl} className="w-full">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                )}
            </div>

            {/* AI Writing Coach */}
            <div className="bg-slate-100 p-4 rounded-lg">
                 <div className="flex items-center gap-3 mb-3">
                    <PencilIcon />
                    <h3 className="text-md font-bold text-slate-700">AI 寫作教練</h3>
                </div>
                <div className="space-y-4">
                    {word.writingPractice?.map((practice, index) => (
                         <div key={index} className="bg-white p-3 rounded-md text-sm">
                            <p className="text-slate-600 italic">你寫的句子： "{practice.sentence}"</p>
                            <div className="mt-2 pt-2 border-t border-slate-200">
                                <p className="font-semibold text-indigo-700">AI 回饋：</p>
                                <p className="text-slate-800">{practice.feedback}</p>
                            </div>
                        </div>
                    )).reverse()}
                    <div>
                         <label htmlFor="writing-practice" className="text-sm font-medium text-slate-600">請用 "{word.word}" 造一個句子：</label>
                        <textarea
                            id="writing-practice"
                            value={writingInput}
                            onChange={(e) => setWritingInput(e.target.value)}
                            rows={3}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="在這裡寫下你的句子..."
                        />
                    </div>
                    <button 
                        onClick={handleGetWritingFeedback}
                        disabled={isGettingFeedback || !writingInput.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 border border-transparent text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                    >
                        {isGettingFeedback ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div><span>分析中...</span></>
                        ) : (
                            '取得 AI 回饋'
                        )}
                    </button>
                    {writingError && <p className="text-xs text-red-500 mt-2 text-center">{writingError}</p>}
                </div>
            </div>
        </div>
    );

    const renderAiAnalysisTab = () => (
        <div className="space-y-6">
            {/* Sentence Analysis */}
            <div className="bg-slate-100 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                    <InfoIcon />
                    <h3 className="text-md font-bold text-slate-700">例句深入解析</h3>
                </div>
                {word.sentenceAnalysis ? (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                            <p>解析: "{word.exampleSentence}"</p>
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">分析完成</span>
                        </div>
                        <p className="text-slate-800 bg-white p-3 rounded-md text-sm">{word.sentenceAnalysis}</p>
                    </div>
                ) : (
                    <button onClick={handleAnalyzeSentence} disabled={isAnalyzingSentence} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors">
                        {isAnalyzingSentence ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-700"></div><span>分析中...</span></>
                        ) : (
                            '解釋主要例句'
                        )}
                    </button>
                )}
                {sentenceError && <p className="text-xs text-red-500 mt-2 text-center">{sentenceError}</p>}
            </div>

            {/* Similar Word */}
            <div className="bg-slate-100 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                    <CompareIcon />
                    <h3 className="text-md font-bold text-slate-700">相似字比較</h3>
                </div>
                {word.similarWordAnalysis ? (
                     <div className="space-y-3">
                         <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                            <p>比較對象: {word.similarWordAnalysis.comparisonTarget}</p>
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">分析完成</span>
                        </div>
                        <div className="bg-white p-4 rounded-md space-y-3 text-sm">
                            <p className="font-bold text-indigo-700">{word.similarWordAnalysis.comparisonTarget} <span className="font-mono text-slate-500">/{word.similarWordAnalysis.phonetic}/</span> - {word.similarWordAnalysis.definition}</p>
                            <p className="italic text-slate-600">"{word.similarWordAnalysis.example}"</p>
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-1">用法區別：</h4>
                                <p className="text-slate-700">{word.similarWordAnalysis.usageDifference}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button onClick={handleFindSimilarWord} disabled={isFindingSimilar} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors">
                         {isFindingSimilar ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-700"></div><span>尋找中...</span></>
                        ) : (
                            '尋找相似字'
                        )}
                    </button>
                )}
                 {similarError && <p className="text-xs text-red-500 mt-2 text-center">{similarError}</p>}
            </div>

            {/* Word Structure */}
             <div className="bg-slate-100 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                    <StructureIcon />
                    <h3 className="text-md font-bold text-slate-700">單字結構分析</h3>
                </div>
                 {word.structureAnalysis ? (
                     <div className="space-y-3">
                         <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                            <p>結構: {word.word}</p>
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">分析完成</span>
                        </div>
                        <div className="bg-white p-4 rounded-md space-y-2 text-sm">
                            {word.structureAnalysis.prefix && <p><span className="inline-block w-12 font-semibold text-sky-600 bg-sky-100 text-center rounded-full px-2 py-0.5 mr-2">字首</span> <span className="font-mono">{formatMorpheme(word.structureAnalysis.prefix.part, 'prefix')}</span> → {word.structureAnalysis.prefix.meaning}</p>}
                            {word.structureAnalysis.root && <p><span className="inline-block w-12 font-semibold text-lime-600 bg-lime-100 text-center rounded-full px-2 py-0.5 mr-2">字根</span> <span className="font-mono">{formatMorpheme(word.structureAnalysis.root.part, 'root')}</span> → {word.structureAnalysis.root.meaning}</p>}
                            {word.structureAnalysis.suffix && <p><span className="inline-block w-12 font-semibold text-amber-600 bg-amber-100 text-center rounded-full px-2 py-0.5 mr-2">字尾</span> <span className="font-mono">{formatMorpheme(word.structureAnalysis.suffix.part, 'suffix')}</span> → {word.structureAnalysis.suffix.meaning}</p>}
                        </div>
                    </div>
                ) : (
                    <button onClick={handleAnalyzeStructure} disabled={isAnalyzingStructure} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors">
                        {isAnalyzingStructure ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-700"></div><span>分析中...</span></>
                        ) : (
                            '分析單字結構'
                        )}
                    </button>
                )}
                 {structureError && <p className="text-xs text-red-500 mt-2 text-center">{structureError}</p>}
            </div>
        </div>
    );

    const renderLearnTab = () => (
         <>
            <div className="mb-6">
                <p className="text-2xl font-bold text-slate-800">{word.chineseDefinition}</p>
                <p className="text-slate-600 mt-1">{word.definition}</p>
            </div>

            {/* Tags */}
            <div className="bg-slate-100 p-4 rounded-lg mb-6">
                <h3 className="text-sm font-semibold text-slate-600 mb-3">個人化標籤</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                    {word.tags?.map(tag => (
                        <div key={tag} className="flex items-center bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-1 rounded-full">
                            <span>{tag}</span>
                            <button onClick={() => onRemoveTag(word.id, tag)} className="ml-1.5 -mr-1 text-indigo-400 hover:text-indigo-800">
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
                <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="新增標籤後按 Enter"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            
            {/* Examples */}
            <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-slate-600 mb-3">主要例句</h3>
                <div className="flex items-start gap-3 mb-4">
                    <BellIcon />
                    <p className="text-slate-800 italic">"{word.exampleSentence}"</p>
                </div>

                {word.additionalExamples && word.additionalExamples.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-indigo-200">
                        {word.additionalExamples.map((ex, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <BellIcon />
                                <p className="text-slate-800 italic">"{ex}"</p>
                            </div>
                        ))}
                    </div>
                )}
                
                <button
                    onClick={handleGenerateExamples}
                    disabled={isGenerating}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                >
                    {isGenerating ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-700"></div>
                            <span>生成中...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-lg">+</span>
                            生成更多例句
                        </>
                    )}
                </button>
                {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
            </div>
        </>
    );

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-4">
                            <h2 className="text-4xl font-bold text-indigo-700">{word.word}</h2>
                            <button onClick={() => speak(word.word)} className="text-slate-500 hover:text-indigo-600 transition-colors">
                                <SpeakerIcon />
                            </button>
                        </div>
                        <p className="text-slate-500 font-mono mt-1 text-lg">/{word.phonetic}/</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-200">
                        <CloseIcon />
                    </button>
                </div>
                
                {/* Tabs */}
                <div className="px-6 border-b border-slate-200">
                    <nav className="flex items-center gap-6 -mb-px">
                        <button onClick={() => setActiveTab('學習')} className={`py-4 px-1 text-sm font-medium border-b-2  ${activeTab === '學習' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} transition-colors`}>學習</button>
                        <button onClick={() => setActiveTab('AI 分析')} className={`py-4 px-1 text-sm font-medium border-b-2 ${activeTab === 'AI 分析' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} transition-colors`}>AI 分析</button>
                        <button onClick={() => setActiveTab('實戰練習')} className={`py-4 px-1 text-sm font-medium border-b-2 ${activeTab === '實戰練習' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} transition-colors`}>實戰練習</button>
                    </nav>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-grow">
                   {activeTab === '學習' && renderLearnTab()}
                   {activeTab === 'AI 分析' && renderAiAnalysisTab()}
                   {activeTab === '實戰練習' && renderPracticeTab()}
                </div>
            </div>
            <style>{`
                @keyframes fade-in-scale {
                    0% { transform: scale(0.95); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in-scale {
                    animation: fade-in-scale 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default WordDetailModal;