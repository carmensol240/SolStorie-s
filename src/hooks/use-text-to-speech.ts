import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
      // Use supabase.functions.invoke instead of direct fetch
      const { data, error } = await supabase.functions.invoke('azure-speech-tts', {
        body: { text },
      });

      if (error) {
        throw new Error(error.message || 'TTS request failed');
      }

      // Handle blob response
      let audioBlob: Blob;
      if (data instanceof Blob) {
        audioBlob = data;
      } else if (data instanceof ArrayBuffer) {
        audioBlob = new Blob([data], { type: 'audio/mpeg' });
      } else {
        throw new Error('Unexpected response format');
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
