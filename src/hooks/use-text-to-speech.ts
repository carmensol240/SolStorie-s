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

      // Use arrayBuffer to avoid any blob corruption from fetch layer
      const arrayBuffer = await response.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Empty audio response');
      }

      if (arrayBuffer.byteLength < 1024) {
        const errorText = new TextDecoder().decode(arrayBuffer);
        console.error('TTS response too small, likely error:', errorText);
        throw new Error('תגובת השמע קטנה מדי - ייתכן שהשירות לא זמין');
      }

      // Convert to base64 data URI to avoid blob: URL tracking prevention issues
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);
      const dataUri = `data:audio/mpeg;base64,${base64}`;

      console.log('TTS audio: dataUri length', dataUri.length);

      const audio = new Audio();
      audio.preload = 'auto';
      audioRef.current = audio;

      // Attach all handlers BEFORE setting src
      audio.onended = () => {
        console.log('Audio playback finished successfully');
        setIsReading(false);
        audioRef.current = null;
      };
      
      audio.onerror = () => {
        const code = audio.error?.code;
        const msg = audio.error?.message;
        console.error('Audio playback error:', { code, msg });
        setIsReading(false);
        setIsLoading(false);
        audioRef.current = null;
        toast({
          title: 'שגיאה בניגון השמע',
          description: `קוד שגיאה: ${code ?? 'unknown'} - ${msg ?? ''}`,
          variant: 'destructive',
        });
      };

      // Use data URI instead of blob URL to bypass tracking prevention
      audio.src = dataUri;
      audio.load();

      // Wait for enough data to be buffered, then play
      audio.oncanplaythrough = async () => {
        audio.oncanplaythrough = null;
        try {
          setIsLoading(false);
          setIsReading(true);
          await audio.play();
          console.log('Audio playback started');
        } catch (playError) {
          console.error('Play() failed:', playError);
          cleanup();
          toast({
            title: 'שגיאה בניגון השמע',
            description: 'הדפדפן חסם את ניגון השמע',
            variant: 'destructive',
          });
        }
      };
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
