
import { useState, useEffect, useCallback } from 'react';
import { TopicPack } from '../types';
import { TOPIC_PACKS_KEY } from '../constants';

export const useTopicPacks = () => {
  const [topicPacks, setTopicPacks] = useState<TopicPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedPacks = localStorage.getItem(TOPIC_PACKS_KEY);
      if (storedPacks) {
        setTopicPacks(JSON.parse(storedPacks));
      }
    } catch (error) {
      console.error("Failed to load topic packs from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const savePacks = (packs: TopicPack[]) => {
    try {
      localStorage.setItem(TOPIC_PACKS_KEY, JSON.stringify(packs));
    } catch (error) {
      console.error("Failed to save topic packs to localStorage", error);
    }
  };

  const addTopicPack = useCallback((newPackData: Omit<TopicPack, 'id'>) => {
    setTopicPacks(prevPacks => {
      const newPack: TopicPack = {
        ...newPackData,
        id: `${Date.now()}-${newPackData.title}`,
      };
      const updatedPacks = [...prevPacks, newPack];
      savePacks(updatedPacks);
      return updatedPacks;
    });
  }, []);
  
  const deleteTopicPack = useCallback((packId: string) => {
    setTopicPacks(prevPacks => {
        const updatedPacks = prevPacks.filter(pack => pack.id !== packId);
        savePacks(updatedPacks);
        return updatedPacks;
    });
  }, []);

  return { topicPacks, addTopicPack, deleteTopicPack, isLoading };
};