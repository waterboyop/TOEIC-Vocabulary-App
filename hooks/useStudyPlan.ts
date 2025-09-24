import { useState, useCallback } from 'react';
import { StudyPlan, VocabularyWord } from '../types';
import { generateStudyPlan } from '../services/geminiService';
import { AI_STUDY_PLAN_KEY } from '../constants';

const getToday = () => new Date().toISOString().split('T')[0];

export const useStudyPlan = () => {
    const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkAndGeneratePlan = useCallback(async (
        wordsToReview: VocabularyWord[],
        weakWords: VocabularyWord[],
        totalWords: number
    ) => {
        const today = getToday();
        
        try {
            const storedData = localStorage.getItem(AI_STUDY_PLAN_KEY);
            if (storedData) {
                const parsedPlan: StudyPlan = JSON.parse(storedData);
                if (parsedPlan.date === today) {
                    setStudyPlan(parsedPlan);
                    setIsLoading(false);
                    return;
                }
            }
        } catch (e) {
            console.error("Failed to parse stored study plan", e);
            localStorage.removeItem(AI_STUDY_PLAN_KEY); // Clear corrupted data
        }

        // If no valid plan for today, generate a new one
        setIsLoading(true);
        setError(null);
        try {
            const planData = await generateStudyPlan(wordsToReview, weakWords, totalWords);
            const newPlan: StudyPlan = { ...planData, date: today };
            setStudyPlan(newPlan);
            localStorage.setItem(AI_STUDY_PLAN_KEY, JSON.stringify(newPlan));
        } catch (err: any) {
            setError(err.message || "無法生成您的個人學習計畫。");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const completeTask = useCallback((taskId: string) => {
        setStudyPlan(prevPlan => {
            if (!prevPlan) return null;

            const updatedTasks = prevPlan.tasks.map(task => 
                task.id === taskId ? { ...task, isCompleted: true } : task
            );

            const updatedPlan = { ...prevPlan, tasks: updatedTasks };
            
            try {
                localStorage.setItem(AI_STUDY_PLAN_KEY, JSON.stringify(updatedPlan));
            } catch (e) {
                console.error("Failed to save updated plan", e);
            }

            return updatedPlan;
        });
    }, []);

    return { studyPlan, isLoading, error, checkAndGeneratePlan, completeTask };
};
