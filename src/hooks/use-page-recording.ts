import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

const DB_NAME = 'solstories_recordings';
const STORE_NAME = 'page_recordings';
const DB_VERSION = 1;

function openRecordingsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function makeKey(storyId: string, pageNumber: number) {
  return `${storyId}__page_${pageNumber}`;
}

interface RecordingEntry {
  key: string;
  blob: Blob;
  savedAt: number;
}

export function usePageRecording(storyId: string | undefined) {
  const [savedPages, setSavedPages] = useState<Set<number>>(new Set());
  const [recordingPage, setRecordingPage] = useState<number | null>(null);
  const [pendingBlob, setPendingBlob] = useState<{ page: number; blob: Blob } | null>(null);
  const [playingPage, setPlayingPage] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load saved page numbers on mount
  useEffect(() => {
    if (!storyId) return;
    (async () => {
      try {
        const db = await openRecordingsDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const prefix = `${storyId}__page_`;
          const pages = new Set<number>();
          for (const entry of req.result as RecordingEntry[]) {
            if (entry.key.startsWith(prefix)) {
              const num = parseInt(entry.key.replace(prefix, ''), 10);
              if (!isNaN(num)) pages.add(num);
            }
          }
          setSavedPages(pages);
        };
      } catch {
        // IndexedDB unavailable
      }
    })();
  }, [storyId]);

  const startRecording = useCallback(async (pageNumber: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setPendingBlob({ page: pageNumber, blob });
        // Stop all tracks
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingPage(pageNumber);
      setPendingBlob(null);
    } catch (err) {
      console.error('Failed to start recording:', err);
      const name = (err as any)?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
        toast.error('לא ניתן להקליט — אנא אפשרו גישה למיקרופון בהגדרות הדפדפן');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        toast.error('לא נמצא מיקרופון במכשיר. אנא חברו מיקרופון ונסו שוב');
      } else {
        toast.error('שגיאה בהפעלת ההקלטה. נסו שוב מאוחר יותר');
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecordingPage(null);
  }, []);

  const saveRecording = useCallback(async () => {
    if (!pendingBlob || !storyId) return;
    const key = makeKey(storyId, pendingBlob.page);
    try {
      const db = await openRecordingsDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ key, blob: pendingBlob.blob, savedAt: Date.now() } as RecordingEntry);
      setSavedPages(prev => new Set(prev).add(pendingBlob.page));
      setPendingBlob(null);
    } catch (err) {
      console.error('Failed to save recording:', err);
      toast.error('שגיאה בשמירת ההקלטה. נסו שוב');
    }
  }, [pendingBlob, storyId]);

  const discardPending = useCallback(() => {
    setPendingBlob(null);
  }, []);

  const playRecording = useCallback(async (pageNumber: number) => {
    if (!storyId) return;
    const key = makeKey(storyId, pageNumber);
    try {
      const db = await openRecordingsDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const entry = req.result as RecordingEntry | undefined;
        if (!entry) return;
        const url = URL.createObjectURL(entry.blob);
        if (audioRef.current) {
          audioRef.current.pause();
          URL.revokeObjectURL(audioRef.current.src);
        }
        const audio = new Audio(url);
        audioRef.current = audio;
        setPlayingPage(pageNumber);
        audio.onended = () => {
          setPlayingPage(null);
          URL.revokeObjectURL(url);
        };
        audio.play();
      };
    } catch (err) {
      console.error('Failed to play recording:', err);
      toast.error('שגיאה בהשמעת ההקלטה');
    }
  }, [storyId]);

  const stopPlaying = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingPage(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return {
    savedPages,
    recordingPage,
    pendingBlob,
    playingPage,
    startRecording,
    stopRecording,
    saveRecording,
    discardPending,
    playRecording,
    stopPlaying,
    hasSavedRecording: (pageNumber: number) => savedPages.has(pageNumber),
  };
}
