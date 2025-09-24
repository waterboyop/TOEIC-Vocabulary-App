import { useState, useCallback } from 'react';
import { DailyGrammar } from '../types';
import { generateDailyGrammar } from '../services/geminiService';
import { DAILY_GRAMMAR_KEY } from '../constants';

const getToday = () => new Date().toISOString().split('T')[0];

export const useDailyGrammar = () => {
    const [currentGrammar, setCurrentGrammar] = useState<DailyGrammar | null>(null);
    const [history, setHistory] = useState<DailyGrammar[]>(() => {
        try {
            const stored = localStorage.getItem(DAILY_GRAMMAR_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("Failed to load daily grammar history", error);
            return [];
        }
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkAndFetchGrammar = useCallback(async () => {
        const today = getToday();
        const todayGrammar = history.find(item => item.date === today);

        if (todayGrammar) {
            setCurrentGrammar(todayGrammar);
            return;
        }
        
        if (isLoading) return;

        setIsLoading(true);
        setError(null);
        try {
            const existingTopics = history.map(h => h.topic);
            const grammarData = await generateDailyGrammar(existingTopics);
            const newDailyGrammar: DailyGrammar = { ...grammarData, date: today };

            const updatedHistory = [newDailyGrammar, ...history];
            setHistory(updatedHistory);
            setCurrentGrammar(newDailyGrammar);
            localStorage.setItem(DAILY_GRAMMAR_KEY, JSON.stringify(updatedHistory));
        } catch (err: any) {
            setError(err.message || "無法取得今日文法。");
        } finally {
            setIsLoading(false);
        }
    }, [history, isLoading]);

    return { currentGrammar, history, isLoading, error, checkAndFetchGrammar };
};
