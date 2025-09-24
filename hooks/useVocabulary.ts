
import { useState, useEffect, useCallback } from 'react';
import { VocabularyWord } from '../types';
import { INITIAL_VOCABULARY, LOCAL_STORAGE_KEY } from '../constants';
import { generateMoreWords } from '../services/geminiService';

const getToday = () => new Date().toISOString().split('T')[0];

export const useVocabulary = () => {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    try {
      const storedWords = localStorage.getItem(LOCAL_STORAGE_KEY);
      const today = getToday();
      if (storedWords) {
        const parsedWords = JSON.parse(storedWords);
        // Data migration for new fields
        const wordsWithDetails = parsedWords.map((word: Partial<VocabularyWord>) => ({
          ...word,
          familiarity: word.familiarity ?? 3,
          phonetic: word.phonetic ?? '',
          tags: word.tags ?? [],
          additionalExamples: word.additionalExamples ?? [],
          sentenceAnalysis: word.sentenceAnalysis ?? undefined,
          similarWordAnalysis: word.similarWordAnalysis ?? undefined,
          structureAnalysis: word.structureAnalysis ?? undefined,
          writingPractice: word.writingPractice ?? [],
          dueDate: word.dueDate ?? today,
          interval: word.interval ?? 0,
        }));
        setWords(wordsWithDetails as VocabularyWord[]);
      } else {
        const initialWordsWithIds = INITIAL_VOCABULARY.map((word, index) => ({
          ...word,
          id: `${Date.now()}-${index}`,
          familiarity: 3, // Default familiarity score
          tags: [],
          additionalExamples: [],
          writingPractice: [],
          dueDate: today,
          interval: 0,
        }));
        setWords(initialWordsWithIds);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialWordsWithIds));
      }
    } catch (error) {
      console.error("Failed to load vocabulary from localStorage", error);
      const today = getToday();
      const initialWordsWithIds = INITIAL_VOCABULARY.map((word, index) => ({
        ...word,
        id: `${Date.now()}-${index}`,
        familiarity: 3,
        tags: [],
        additionalExamples: [],
        writingPractice: [],
        dueDate: today,
        interval: 0,
      }));
      setWords(initialWordsWithIds);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateWord = useCallback((wordId: string, updates: Partial<VocabularyWord>) => {
    setWords(prevWords => {
      const updatedWords = prevWords.map(word => 
        word.id === wordId ? { ...word, ...updates } : word
      );
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedWords));
      } catch (error) {
        console.error("Failed to save word update to localStorage", error);
      }
      return updatedWords;
    });
  }, []);

  const addWord = useCallback((newWord: Omit<VocabularyWord, 'id' | 'familiarity' | 'tags' | 'additionalExamples' | 'writingPractice' | 'dueDate' | 'interval'>) => {
    setWords(prevWords => {
      const wordToAdd: VocabularyWord = {
        ...newWord,
        id: `${Date.now()}-${Math.random()}`,
        familiarity: 3, // Default familiarity for new words
        tags: [],
        additionalExamples: [],
        writingPractice: [],
        dueDate: getToday(),
        interval: 0,
      };
      const updatedWords = [...prevWords, wordToAdd];
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedWords));
      } catch (error) {
        console.error("Failed to save new word to localStorage", error);
      }
      return updatedWords;
    });
  }, []);

  const generateAndAddWords = useCallback(async () => {
    setIsGenerating(true);
    try {
      const existingWordStrings = words.map(w => w.word);
      const newWords = await generateMoreWords(existingWordStrings);
      const today = getToday();
      
      const newWordsWithDetails = newWords.map(word => ({
          ...word,
          id: `${Date.now()}-${word.word}-${Math.random()}`,
          familiarity: 3, // Default familiarity for AI-generated words
          tags: ['ai-generated'],
          additionalExamples: [],
          writingPractice: [],
          dueDate: today,
          interval: 0,
      }));

      setWords(prevWords => {
        const updatedWords = [...prevWords, ...newWordsWithDetails];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedWords));
        return updatedWords;
      });

    } catch (error) {
      console.error("Failed to generate and add new words:", error);
      alert("無法生成新單字，請稍後再試。");
    } finally {
      setIsGenerating(false);
    }
  }, [words]);
  
  const updateWordFamiliarity = useCallback((wordId: string, newFamiliarity: number) => {
    updateWord(wordId, { familiarity: newFamiliarity });
  }, [updateWord]);

  const updateWordReviewStatus = useCallback((wordId: string, rating: 'again' | 'good' | 'easy') => {
      const getFutureDate = (days: number): string => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
      };
      
      let newInterval: number;
      let newDueDate: string;

      switch(rating) {
        case 'again':
          newInterval = 0;
          newDueDate = getToday();
          break;
        case 'good':
          newInterval = 1;
          newDueDate = getFutureDate(1);
          break;
        case 'easy':
          newInterval = 2;
          newDueDate = getFutureDate(2);
          break;
      }
      
      updateWord(wordId, { interval: newInterval, dueDate: newDueDate });
  }, [updateWord]);
  
  const addTagToWord = useCallback((wordId: string, tag: string) => {
    const word = words.find(w => w.id === wordId);
    if (word && !(word.tags?.includes(tag))) {
        const newTags = [...(word.tags || []), tag];
        updateWord(wordId, { tags: newTags });
    }
  }, [words, updateWord]);

  const removeTagFromWord = useCallback((wordId: string, tagToRemove: string) => {
      const word = words.find(w => w.id === wordId);
      if (word && word.tags) {
          const newTags = word.tags.filter(tag => tag !== tagToRemove);
          updateWord(wordId, { tags: newTags });
      }
  }, [words, updateWord]);

  const addExamplesToWord = useCallback((wordId: string, newExamples: string[]) => {
      const word = words.find(w => w.id === wordId);
      if (word) {
          const existingExamples = word.additionalExamples || [];
          const uniqueNewExamples = newExamples.filter(ex => !existingExamples.includes(ex));
          if (uniqueNewExamples.length > 0) {
              updateWord(wordId, { additionalExamples: [...existingExamples, ...uniqueNewExamples] });
          }
      }
  }, [words, updateWord]);

  return { words, addWord, isLoading, generateAndAddWords, isGenerating, updateWordFamiliarity, updateWordReviewStatus, addTagToWord, removeTagFromWord, addExamplesToWord, updateWord };
};
