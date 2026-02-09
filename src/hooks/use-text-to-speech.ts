import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseTextToSpeechReturn {
  startReading: (text: string) => Promise<void>;
  stopReading: () => void;
  isReading: boolean;
  isLoading: boolean;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isReading, setIsReading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const { toast } = useToast();

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setIsReading(false);
  }, []);

  const startReading = useCallback(async (text: string) => {
    // Defensive: ensure text is a string
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      toast({
        title: 'אין טקסט להקריא',
        variant: 'destructive',
      });
      return;
    }

    cleanup();
    setIsLoading(true);

    try {
      // CRITICAL FIX: Use fetch() with .blob() instead of supabase.functions.invoke()
      // supabase.functions.invoke defaults to JSON parsing which corrupts binary audio data
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/azure-speech-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('TTS API error:', response.status, errorBody);
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const contentType = response.headers.get('Content-Type') || '';
      
      // If we got JSON back, it's an error response
      if (contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'TTS returned error');
      }

      // Get audio as blob directly - no JSON parsing corruption
      const audioBlob = await response.blob();
      
      if (audioBlob.size === 0) {
        throw new Error('Empty audio response');
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      blobUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => cleanup();
      audio.onerror = () => {
        cleanup();
        toast({
          title: 'שגיאה בניגון השמע',
          variant: 'destructive',
        });
      };

      setIsLoading(false);
      setIsReading(true);
      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsLoading(false);
      cleanup();
      toast({
        title: 'שגיאה בהקראה',
        description: error instanceof Error ? error.message : 'נסו שוב מאוחר יותר',
        variant: 'destructive',
      });
    }
  }, [cleanup, toast]);

  const stopReading = useCallback(() => cleanup(), [cleanup]);

  return { startReading, stopReading, isReading, isLoading };
};
