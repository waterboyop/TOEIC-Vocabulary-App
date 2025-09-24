import { useState, useCallback } from 'react';
import { DailyQuote } from '../types';
import { generateDailyQuote } from '../services/geminiService';
import { DAILY_QUOTE_KEY } from '../constants';

const getToday = () => new Date().toISOString().split('T')[0];

export const useDailyQuote = () => {
    const [currentQuote, setCurrentQuote] = useState<DailyQuote | null>(null);
    const [history, setHistory] = useState<DailyQuote[]>(() => {
        try {
            const stored = localStorage.getItem(DAILY_QUOTE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("Failed to load daily quote history", error);
            return [];
        }
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkAndFetchQuote = useCallback(async () => {
        const today = getToday();
        const todayQuote = history.find(quote => quote.date === today);

        if (todayQuote) {
            setCurrentQuote(todayQuote);
            return;
        }
        
        if (isLoading) return;

        setIsLoading(true);
        setError(null);
        try {
            const existingAuthors = history.map(h => h.author);
            const quoteData = await generateDailyQuote(existingAuthors);
            const newDailyQuote: DailyQuote = { ...quoteData, date: today };

            const updatedHistory = [newDailyQuote, ...history];
            setHistory(updatedHistory);
            setCurrentQuote(newDailyQuote);
            localStorage.setItem(DAILY_QUOTE_KEY, JSON.stringify(updatedHistory));
        } catch (err: any) {
            setError(err.message || "無法取得今日名言。");
        } finally {
            setIsLoading(false);
        }
    }, [history, isLoading]);

    return { currentQuote, history, isLoading, error, checkAndFetchQuote };
};
