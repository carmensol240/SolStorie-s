import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseTextToSpeechReturn {
  startReading: (text: string, language?: string) => Promise<void>;
  stopReading: () => void;
  isReading: boolean;
  isLoading: boolean;
  lastError: string | null;
  retry: () => void;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isReading, setIsReading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTextRef = useRef<string>('');
  const lastLanguageRef = useRef<string>('he');
  const { toast } = useToast();

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsReading(false);
  }, []);

  const startReading = useCallback(async (text: string, language: string = 'he') => {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      toast({ title: language === 'en' ? 'No text to read' : 'אין טקסט להקריא', variant: 'destructive' });
      return;
    }

    lastTextRef.current = text;
    lastLanguageRef.current = language;
    setLastError(null);
    cleanup();
    setIsLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ text, language }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('TTS API error:', response.status, errorBody);
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'TTS returned error');
      }

      const arrayBuffer = await response.arrayBuffer();

      if (arrayBuffer.byteLength === 0) {
        throw new Error('Empty audio response');
      }
      if (arrayBuffer.byteLength < 100) {
        const errorText = new TextDecoder().decode(arrayBuffer);
        console.error('TTS response too small, likely error:', errorText);
        throw new Error('תגובת השמע קטנה מדי - ייתכן שהשירות לא זמין');
      }

      // Convert to base64 data URI to bypass blob: tracking prevention
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const dataUri = `data:audio/mpeg;base64,${btoa(binary)}`;

      console.log('TTS audio ready, dataUri length:', dataUri.length);

      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audioRef.current = audio;

      let playbackStarted = false;

      audio.onended = () => {
        console.log('Audio playback finished');
        setIsReading(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        // Ignore errors after successful playback start
        if (playbackStarted) return;
        const code = audio.error?.code;
        const msg = audio.error?.message;
        console.error('Audio playback error:', { code, msg });
        setIsReading(false);
        setIsLoading(false);
        audioRef.current = null;
        const errorMsg = `שגיאת שמע (${code ?? '?'})`;
        setLastError(errorMsg);
        toast({
          title: 'לא הצלחנו לנגן את השמע',
          description: 'לחצו על כפתור ההקראה שוב לניסיון חוזר',
          variant: 'destructive',
        });
      };

      audio.src = dataUri;
      audio.load();

      audio.oncanplaythrough = async () => {
        audio.oncanplaythrough = null;
        try {
          setIsLoading(false);
          setIsReading(true);
          await audio.play();
          playbackStarted = true;
          console.log('Audio playback started');
        } catch (playError) {
          console.error('Play() failed:', playError);
          cleanup();
          setIsLoading(false);
          setLastError('הדפדפן חסם את ניגון השמע');
          toast({
            title: 'הדפדפן חסם את ניגון השמע',
            description: 'נסו ללחוץ שוב על כפתור ההקראה',
            variant: 'destructive',
          });
        }
      };
    } catch (error) {
      console.error('TTS error:', error);
      setIsLoading(false);
      cleanup();
      const msg = error instanceof Error ? error.message : 'נסו שוב מאוחר יותר';
      setLastError(msg);
      toast({
        title: 'שגיאה בהקראה',
        description: msg,
        variant: 'destructive',
      });
    }
  }, [cleanup, toast]);

  const retry = useCallback(() => {
    if (lastTextRef.current) {
      startReading(lastTextRef.current, lastLanguageRef.current);
    }
  }, [startReading]);

  const stopReading = useCallback(() => cleanup(), [cleanup]);

  return { startReading, stopReading, isReading, isLoading, lastError, retry };
};