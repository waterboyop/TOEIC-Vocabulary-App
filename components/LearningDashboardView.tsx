
import React from 'react';
import { VocabularyWord } from '../types';
import LearningCalendarHeatmap from './LearningCalendarHeatmap';

interface LearningDashboardViewProps {
    words: VocabularyWord[];
    learningStreak: number;
    aiGeneratedCount: number;
    learningLog: { [date: string]: number };
    onBack: () => void;
}

// --- Achievement Icons ---
const SproutIcon: React.FC = () => <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12"><path d="M32 55.9c-2.8 0-5.1-2.3-5.1-5.1 0-2.3 1.5-4.2 3.6-4.9.4-.1.8-.2 1.2-.2.3 0 .6 0 .9.1.1 0 .1 0 .2.1 2.3.6 4 2.7 4 5.1 0 2.8-2.3 5-5.1 5z" fill="#a47757"/><path d="M40.9 45.8c-2.4 0-4.3-1.9-4.3-4.3s1.9-4.3 4.3-4.3c.4 0 .9.1 1.3.2 1.5.6 2.6 1.9 2.6 3.5 0 .2 0 .4-.1.6 0 .1-.1.2-.1.3-.2.8-.9 1.4-1.7 1.4-.4 0-.8-.1-1.1-.3-.3-.2-.7-.3-1.1-.3s-.8.1-1.1.3c-.2.1-.4.2-.6.2z" fill="#c48a60"/><path d="M23.1 45.8c.2 0 .4-.1.6-.2.3-.2.7-.3 1.1-.3s.8.1 1.1.3c.3.2.7.3 1.1.3.8 0 1.5-.6 1.7-1.4.1-.1.1-.2.1-.3 0-.2 0-.4-.1-.6 0-1.6 1.1-2.9 2.6-3.5.4-.1.9-.2 1.3-.2 2.4 0 4.3 1.9 4.3 4.3s-1.9 4.3-4.3 4.3z" fill="#c48a60"/><path d="M43.9 19.3c-2.9-2.9-6.8-4.5-10.9-4.5h-2c-4.1 0-8 1.6-10.9 4.5-1.1 1.1-1.1 2.8 0 3.8s2.8 1.1 3.8 0c2.2-2.2 5.1-3.4 8.1-3.4h2c3 0 5.9 1.2 8.1 3.4 1.1 1.1 2.8 1.1 3.8 0s1.1-2.7 0-3.8zm-22.6 5.7c-1.1-1.1-2.8-1.1-3.8 0-1.1 1.1-1.1 2.8 0 3.8 2.2 2.2 5.1 3.4 8.1 3.4h2c3 0 5.9-1.2 8.1-3.4 1.1-1.1 1.1-2.8 0-3.8-1.1-1.1-2.8-1.1-3.8 0-1.5 1.5-3.5 2.3-5.6 2.3h-2c-2.1 0-4.1-.8-5.6-2.3z" fill="#99cc33"/><path d="M32 14.8c-7.2 0-13 5.8-13 13s5.8 13 13 13h2c7.2 0 13-5.8 13-13s-5.8-13-13-13h-2zm2 22.2c-5.1 0-9.2-4.1-9.2-9.2s4.1-9.2 9.2-9.2 9.2 4.1 9.2 9.2-4.1 9.2-9.2 9.2z" fill="#88b32d"/><path d="M32 31.8c-2.1 0-4.1-.8-5.6-2.3-1.1-1.1-2.8-1.1-3.8 0-1.1 1.1-1.1 2.8 0 3.8 2.9 2.9 6.8 4.5 10.9 4.5h2c4.1 0 8-1.6 10.9-4.5 1.1-1.1 1.1-2.8 0-3.8-1.1-1.1-2.8-1.1-3.8 0-2.2 2.2-5.1 3.4-8.1 3.4h-2c-.7 0-1.3-.1-2-.2z" fill="#99cc33"/></svg>;
const GradCapIcon: React.FC = () => <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12"><path d="M60.6 22.8L33.4 12.2c-.8-.3-1.8-.3-2.7 0L3.4 22.8c-.8.3-1.4 1.2-1.4 2.1V35c0 .9.5 1.7 1.4 2.1l7.8 3.1v10.3c0 1 .8 1.8 1.8 1.8h2.3c1 0 1.8-.8 1.8-1.8V42.1l11.2 4.5c.3.1.6.2.9.2s.6-.1.9-.2l27.2-10.9c.8-.3 1.4-1.2 1.4-2.1V25c0-.9-.5-1.7-1.4-2.2zM32 37.9L9.2 27.9l22.8-9 22.8 9L32 37.9z" fill="#4d4d4d"/><path d="M52.3 40.7v-1.1c0-1-.8-1.8-1.8-1.8H13.5c-1 0-1.8.8-1.8 1.8v1.1c0 1 .8 1.8 1.8 1.8h37.1c.9-.1 1.7-.9 1.7-1.8z" fill="#ffc10a"/></svg>;
const RobotIcon: React.FC = () => <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12"><circle cx="32" cy="32" r="27" fill="#e6e6e6"/><circle cx="32" cy="32" r="23" fill="#f2f2f2"/><path d="M43.7 49.3c-1.3-1.1-2.3-2.5-2.8-4.1-.5-1.5-.5-3.2.1-4.8.6-1.6 1.7-3 3.1-4.1 1.5-1.1 3.2-1.7 5.1-1.7v-2.1c-1.8 0-3.6.6-5.1 1.7-1.4 1.1-2.5 2.5-3.1 4.1s-.7 3.3-.1 4.8.5 2.9 2.8 4.1c1.2 1.1 2.7 2 4.3 2.6v-2.2c-1.6-.6-3.1-1.4-4.2-2.5z" fill="#33a0d3"/><path d="M20.3 49.3c1.3-1.1 2.3-2.5 2.8-4.1.5-1.5.5-3.2-.1-4.8-.6-1.6-1.7-3-3.1-4.1-1.5-1.1-3.2-1.7-5.1-1.7v-2.1c1.8 0 3.6.6 5.1 1.7 1.4 1.1 2.5 2.5 3.1 4.1s.7 3.3.1 4.8c-.6 1.6-2.2 3-2.8 4.1-1.2 1.1-2.7 2-4.3 2.6v-2.2c1.6-.6 3-1.4 4.2-2.5z" fill="#33a0d3"/><circle cx="23.5" cy="27" r="4.5" fill="#4d4d4d"/><circle cx="40.5" cy="27" r="4.5" fill="#4d4d4d"/><path d="M22.5 41h19c.6 0 1 .4 1 1s-.4 1-1 1h-19c-.6 0-1-.4-1-1s.4-1 1-1z" fill="#4d4d4d"/><path d="M30 11.5c-1.1 0-2-.9-2-2v-2c0-1.1.9-2 2-2s2 .9 2 2v2c0 1.1-.9 2-2 2z" fill="#ffc10a"/><path d="M34 11.5c-1.1 0-2-.9-2-2v-2c0-1.1.9-2 2-2s2 .9 2 2v2c0 1.1-.9 2-2 2z" fill="#ffc10a"/></svg>;
const PerseveranceIcon: React.FC = () => <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12"><path d="M32 5.5c-9.1 0-16.5 7-16.5 15.6 0 5.4 3 11.1 16.5 37.4 13.5-26.3 16.5-32 16.5-37.4C48.5 12.5 41.1 5.5 32 5.5z" fill="#33a0d3"/></svg>;


const StatCard: React.FC<{ title: string; value: string | number; unit: string }> = ({ title, value, unit }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <p className="text-4xl font-bold text-indigo-600 my-1">{value}</p>
        <p className="text-sm text-slate-400">{unit}</p>
    </div>
);

const AchievementCard: React.FC<{ title: string; description: string; unlocked: boolean; icon: React.ReactNode }> = ({ title, description, unlocked, icon }) => (
    <div className={`p-4 rounded-2xl transition-all duration-300 ${unlocked ? 'bg-yellow-50 border-yellow-200 border' : 'bg-slate-100'}`}>
        <div className={`mx-auto transition-filter duration-300 ${!unlocked && 'filter grayscale opacity-60'}`}>
            {icon}
        </div>
        <p className={`text-center font-bold mt-2 ${unlocked ? 'text-yellow-900' : 'text-slate-600'}`}>{title}</p>
        <p className={`text-center text-xs ${unlocked ? 'text-yellow-700' : 'text-slate-500'}`}>{description}</p>
    </div>
);


const LearningDashboardView: React.FC<LearningDashboardViewProps> = ({ words, learningStreak, aiGeneratedCount, learningLog, onBack }) => {
    
    // --- Data Calculations ---
    const totalWords = words.length;

    const masteryStats = {
        newlyLearned: words.filter(word => word.interval === 0).length,
        reviewing: words.filter(word => word.interval > 0).length,
        mastered: 0,
    };

    const achievements = [
        { title: "初窺門徑", description: `學會 10 個單字`, unlocked: totalWords >= 10, icon: <SproutIcon /> },
        { title: "字彙高手", description: `學會 50 個單字`, unlocked: totalWords >= 50, icon: <GradCapIcon /> },
        { title: "AI 探險家", description: `使用 AI 生成 5 個單字`, unlocked: aiGeneratedCount >= 5, icon: <RobotIcon /> },
        { title: "堅持不懈", description: `連續學習 7 天`, unlocked: learningStreak >= 7, icon: <PerseveranceIcon /> },
    ];
    
    return (
        <div className="max-w-5xl mx-auto">
             <button onClick={onBack} className="mb-6 inline-flex items-center text-slate-600 hover:text-indigo-600 font-semibold transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                返回主選單
            </button>
            <h1 className="text-3xl font-bold text-slate-800 mb-8">學習進度儀表板</h1>

            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <StatCard title="總單字量" value={totalWords} unit="單字" />
                <StatCard title="連續學習" value={learningStreak} unit="天" />
                <StatCard title="AI 新增單字" value={aiGeneratedCount} unit="單字" />
            </div>

            {/* Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Word Mastery */}
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-bold text-slate-700 mb-4">單字掌握度</h2>
                    <div className="flex items-center justify-around">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                                <path className="text-slate-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                            </svg>
                            <div className="absolute text-center">
                                <p className="text-4xl font-bold text-slate-700">{totalWords}</p>
                                <p className="text-sm text-slate-500">單字</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <span className="h-3 w-3 rounded-full bg-blue-400 mr-3"></span>
                                <div>
                                    <p className="text-sm text-slate-500">新學習</p>
                                    <p className="font-bold text-slate-700">{masteryStats.newlyLearned}</p>
                                </div>
                            </div>
                             <div className="flex items-center">
                                <span className="h-3 w-3 rounded-full bg-yellow-400 mr-3"></span>
                                <div>
                                    <p className="text-sm text-slate-500">複習中</p>
                                    <p className="font-bold text-slate-700">{masteryStats.reviewing}</p>
                                </div>
                            </div>
                             <div className="flex items-center">
                                <span className="h-3 w-3 rounded-full bg-green-400 mr-3"></span>
                                <div>
                                    <p className="text-sm text-slate-500">已精通</p>
                                    <p className="font-bold text-slate-700">{masteryStats.mastered}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <LearningCalendarHeatmap data={learningLog} />
            </div>
            
            {/* Achievements */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">成就徽章</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {achievements.map(ach => (
                        <AchievementCard key={ach.title} {...ach} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LearningDashboardView;