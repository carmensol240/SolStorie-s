import { useState, useEffect, useCallback } from 'react';

interface StoryCache {
  id: string;
  data: any;
  cachedAt: number;
}

const CACHE_KEY = 'storyteller_offline_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedStories, setCachedStories] = useState<StoryCache[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load cached stories from localStorage
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as StoryCache[];
        // Filter out expired entries
        const valid = parsed.filter(
          (s) => Date.now() - s.cachedAt < CACHE_EXPIRY
        );
        setCachedStories(valid);
      } catch {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const cacheStory = useCallback((storyId: string, data: any) => {
    setCachedStories((prev) => {
      const filtered = prev.filter((s) => s.id !== storyId);
      const updated = [...filtered, { id: storyId, data, cachedAt: Date.now() }];
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getCachedStory = useCallback(
    (storyId: string) => {
      const cached = cachedStories.find((s) => s.id === storyId);
      if (cached && Date.now() - cached.cachedAt < CACHE_EXPIRY) {
        return cached.data;
      }
      return null;
    },
    [cachedStories]
  );

  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    setCachedStories([]);
  }, []);

  return {
    isOnline,
    cacheStory,
    getCachedStory,
    cachedStories,
    clearCache,
  };
};
