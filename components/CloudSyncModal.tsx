
import React, { useRef } from 'react';
import {
    LOCAL_STORAGE_KEY,
    TOPIC_PACKS_KEY,
    DAILY_WORD_KEY,
    DAILY_GRAMMAR_KEY,
    LEARNING_STREAK_KEY,
    DAILY_TASKS_KEY,
    GROUP_TITLES_KEY,
} from '../constants';

const SYNC_KEYS = [
    LOCAL_STORAGE_KEY,
    TOPIC_PACKS_KEY,
    DAILY_WORD_KEY,
    DAILY_GRAMMAR_KEY,
    LEARNING_STREAK_KEY,
    DAILY_TASKS_KEY,
    GROUP_TITLES_KEY,
];

interface CloudSyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    onShowNotification: (type: 'success' | 'error', message: string) => void;
}

const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 9.707a1 1 0 011.414 0L10 12.001l2.293-2.294a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /><path fillRule="evenodd" d="M10 2a1 1 0 011 1v8a1 1 0 11-2 0V3a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M4.343 15.243a1 1 0 011.414-1.414L10 18.086l4.243-4.257a1 1 0 111.414 1.414L11.414 20.243a1.999 1.999 0 01-2.828 0L4.343 15.243zM10 2a1 1 0 011 1v10a1 1 0 11-2 0V3a1 1 0 011-1z" /></svg>;


const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose, onShowNotification }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        try {
            const backupData: { [key: string]: string | null } = {};
            SYNC_KEYS.forEach(key => {
                backupData[key] = localStorage.getItem(key);
            });

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const today = new Date().toISOString().split('T')[0];
            link.href = url;
            link.download = `toeic_vocab_backup_${today}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            onShowNotification('success', '學習進度已成功匯出！');
            onClose();
        } catch (error) {
            console.error("Export failed:", error);
            onShowNotification('error', '匯出失敗，請稍後再試。');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("檔案內容不是有效的文字。");
                }
                const data = JSON.parse(text);

                const hasAllKeys = SYNC_KEYS.every(key => Object.prototype.hasOwnProperty.call(data, key));
                if (!hasAllKeys) {
                    throw new Error("檔案格式不符，缺少必要的資料。");
                }

                Object.keys(data).forEach(key => {
                    if (SYNC_KEYS.includes(key) && data[key] !== null && typeof data[key] === 'string') {
                        localStorage.setItem(key, data[key]);
                    }
                });

                onShowNotification('success', '學習進度已成功匯入！應用程式將會重新載入。');
                
                setTimeout(() => {
                    window.location.reload();
                }, 1500);

            } catch (error: any) {
                console.error("Import failed:", error);
                onShowNotification('error', `匯入失敗：${error.message}`);
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };

        reader.onerror = () => {
             onShowNotification('error', '讀取檔案時發生錯誤。');
        };

        reader.readAsText(file);
    };


    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            aria-modal="true" role="dialog"
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">雲端同步</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <p className="text-slate-500 mb-8">您可以手動匯出學習進度，並在其他裝置上匯入以同步資料。</p>

                <div className="space-y-4">
                    <button 
                        onClick={handleExport}
                        className="w-full flex items-center justify-center px-6 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <DownloadIcon />
                        匯出學習進度
                    </button>
                    <button 
                        onClick={handleImportClick}
                        className="w-full flex items-center justify-center px-6 py-4 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
                    >
                        <UploadIcon />
                        匯入學習進度
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                    />
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

export default CloudSyncModal;
