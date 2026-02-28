import { useState, useEffect, useCallback } from 'react';

/**
 * Lightweight offline storage using IndexedDB for story caching.
 * Replaced localStorage to avoid quota exceeded errors from large story data.
 */

interface StoryCache {
  id: string;
  data: any;
  cachedAt: number;
}

const DB_NAME = 'solstories_cache';
const STORE_NAME = 'stories';
const DB_VERSION = 1;
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedStories, setCachedStories] = useState<StoryCache[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Migrate from old localStorage cache and load from IndexedDB
    const init = async () => {
      // Remove old localStorage cache to free space
      localStorage.removeItem('storyteller_offline_cache');

      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
          const valid = (request.result as StoryCache[]).filter(
            (s) => Date.now() - s.cachedAt < CACHE_EXPIRY
          );
          setCachedStories(valid);
        };
      } catch {
        // IndexedDB not available — degrade gracefully
      }
    };
    init();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const cacheStory = useCallback(async (storyId: string, data: any) => {
    // Strip large fields to keep cache lean
    const leanData = {
      ...data,
      pages: data.pages?.map((p: any) => ({
        ...p,
        // Keep illustration_url (small path string) but remove any base64 data
        illustration_url: p.illustration_url,
      })),
    };

    const entry: StoryCache = { id: storyId, data: leanData, cachedAt: Date.now() };

    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(entry);
    } catch {
      // Silently fail — cache is optional
    }

    setCachedStories((prev) => {
      const filtered = prev.filter((s) => s.id !== storyId);
      return [...filtered, entry];
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

  const clearCache = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
    } catch {
      // ignore
    }
    localStorage.removeItem('storyteller_offline_cache');
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
