
import { useState, useCallback } from 'react';
import { DailyWord } from '../types';
import { generateDailySlang } from '../services/geminiService';
import { DAILY_WORD_KEY } from '../constants';

const getToday = () => new Date().toISOString().split('T')[0];

export const useDailyWord = () => {
    const [currentWord, setCurrentWord] = useState<DailyWord | null>(null);
    const [history, setHistory] = useState<DailyWord[]>(() => {
        try {
            const stored = localStorage.getItem(DAILY_WORD_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("Failed to load daily word history", error);
            return [];
        }
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkAndFetchWord = useCallback(async () => {
        const today = getToday();
        const todayWord = history.find(word => word.date === today);

        if (todayWord) {
            setCurrentWord(todayWord);
            return;
        }
        
        // Don't fetch if already loading
        if (isLoading) return;

        setIsLoading(true);
        setError(null);
        try {
            const existingSlangs = history.map(h => h.slang);
            const slangData = await generateDailySlang(existingSlangs);
            const newDailyWord: DailyWord = { ...slangData, date: today };

            const updatedHistory = [newDailyWord, ...history];
            setHistory(updatedHistory);
            setCurrentWord(newDailyWord);
            localStorage.setItem(DAILY_WORD_KEY, JSON.stringify(updatedHistory));
        } catch (err: any) {
            setError(err.message || "無法取得今日俚語。");
        } finally {
            setIsLoading(false);
        }
    }, [history, isLoading]);

    return { currentWord, history, isLoading, error, checkAndFetchWord };
};