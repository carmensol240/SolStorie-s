import { useState, useEffect, useCallback } from 'react';
import { getPublicIllustrationUrl } from '@/lib/illustration-url';

/**
 * Full offline storage using IndexedDB.
 * Stores story metadata, text, and illustration blobs for true offline reading.
 * Separate DB from the lightweight cache in use-offline-storage.ts.
 */

export interface OfflineStoryMeta {
  id: string;
  slug: string | null;
  child_name: string;
  topic: string;
  cover_url: string | null;
  created_at: string;
  child_gender: string | null;
  age_range: string | null;
}

export interface OfflineStoryPage {
  id: string;
  page_number: number;
  text: string;
  illustration_blob: Blob | null; // actual image data
  illustration_prompt: string | null;
}

export interface OfflineStory {
  id: string;
  meta: OfflineStoryMeta;
  pages: OfflineStoryPage[];
  coverBlob: Blob | null;
  savedAt: number;
  sizeBytes: number;
}

const DB_NAME = 'solstories_offline';
const STORE_NAME = 'full_stories';
const DB_VERSION = 1;

function openOfflineDB(): Promise<IDBDatabase> {
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

async function fetchImageAsBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

function estimateSize(story: OfflineStory): number {
  let size = JSON.stringify(story.meta).length + JSON.stringify(story.pages.map(p => ({ text: p.text }))).length;
  if (story.coverBlob) size += story.coverBlob.size;
  for (const page of story.pages) {
    if (page.illustration_blob) size += page.illustration_blob.size;
  }
  return size;
}

export function useFullOfflineStorage() {
  const [savedStoryIds, setSavedStoryIds] = useState<Set<string>>(new Set());
  const [storySizes, setStorySizes] = useState<Map<string, number>>(new Map());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load saved IDs on mount
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    (async () => {
      try {
        const db = await openOfflineDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const ids = new Set<string>();
          const sizes = new Map<string, number>();
          for (const entry of req.result as OfflineStory[]) {
            ids.add(entry.id);
            sizes.set(entry.id, entry.sizeBytes);
          }
          setSavedStoryIds(ids);
          setStorySizes(sizes);
        };
      } catch {}
    })();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const downloadStory = useCallback(async (
    storyId: string,
    meta: OfflineStoryMeta,
    pages: { id: string; page_number: number; text: string; illustration_url: string | null; illustration_prompt: string | null }[],
    coverUrl: string | null,
  ) => {
    setDownloadingId(storyId);
    try {
      // Download cover blob
      let coverBlob: Blob | null = null;
      if (coverUrl) {
        coverBlob = await fetchImageAsBlob(coverUrl);
      }

      // Download all illustration blobs in parallel
      const offlinePages: OfflineStoryPage[] = await Promise.all(
        pages.map(async (p) => {
          let blob: Blob | null = null;
          if (p.illustration_url) {
            const publicUrl = getPublicIllustrationUrl(p.illustration_url);
            if (publicUrl) {
              blob = await fetchImageAsBlob(publicUrl);
            }
          }
          return {
            id: p.id,
            page_number: p.page_number,
            text: p.text,
            illustration_blob: blob,
            illustration_prompt: p.illustration_prompt,
          };
        })
      );

      const entry: OfflineStory = {
        id: storyId,
        meta,
        pages: offlinePages,
        coverBlob,
        savedAt: Date.now(),
        sizeBytes: 0,
      };
      entry.sizeBytes = estimateSize(entry);

      const db = await openOfflineDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(entry);

      setSavedStoryIds(prev => new Set(prev).add(storyId));
      setStorySizes(prev => new Map(prev).set(storyId, entry.sizeBytes));
    } catch (err) {
      console.error('Failed to download story for offline:', err);
      throw err;
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const deleteOfflineStory = useCallback(async (storyId: string) => {
    try {
      const db = await openOfflineDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(storyId);
      setSavedStoryIds(prev => {
        const next = new Set(prev);
        next.delete(storyId);
        return next;
      });
      setStorySizes(prev => {
        const next = new Map(prev);
        next.delete(storyId);
        return next;
      });
    } catch (err) {
      console.error('Failed to delete offline story:', err);
    }
  }, []);

  const getOfflineStory = useCallback(async (storyId: string): Promise<OfflineStory | null> => {
    try {
      const db = await openOfflineDB();
      // First try direct lookup by UUID (keyPath)
      const directResult = await new Promise<OfflineStory | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(storyId);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      });
      if (directResult) return directResult;

      // Fallback: search by slug (storyId might be a slug, not UUID)
      const allStories = await new Promise<OfflineStory[]>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result ?? []);
        req.onerror = () => resolve([]);
      });
      return allStories.find(s => s.meta.slug === storyId) ?? null;
    } catch {
      return null;
    }
  }, []);

  const getAllOfflineStories = useCallback(async (): Promise<OfflineStory[]> => {
    try {
      const db = await openOfflineDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result ?? []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }, []);

  return {
    savedStoryIds,
    storySizes,
    downloadingId,
    isOnline,
    downloadStory,
    deleteOfflineStory,
    getOfflineStory,
    getAllOfflineStories,
    isSaved: (id: string) => savedStoryIds.has(id),
    getSize: (id: string) => storySizes.get(id) || 0,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
