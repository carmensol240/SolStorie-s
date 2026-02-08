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
    if (!text || text.trim().length === 0) {
      toast({
        title: 'אין טקסט להקריא',
        variant: 'destructive',
      });
      return;
    }

    // Stop any existing playback
    cleanup();
    setIsLoading(true);

    try {
      // Call the Azure TTS edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/azure-speech-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `TTS request failed: ${response.status}`);
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      blobUrlRef.current = audioUrl;

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        cleanup();
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
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

  const stopReading = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    startReading,
    stopReading,
    isReading,
    isLoading,
  };
};
