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

      // Use arrayBuffer to avoid any blob corruption from fetch layer
      const arrayBuffer = await response.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Empty audio response');
      }

      // Validate it looks like an MP3 (check for common MP3 headers)
      const header = new Uint8Array(arrayBuffer.slice(0, 4));
      const isMP3 = (header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) || // MP3 sync word
                     (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33); // ID3 tag
      
      console.log('TTS audio:', { 
        byteLength: arrayBuffer.byteLength, 
        headerBytes: Array.from(header).map(b => b.toString(16)).join(' '),
        isMP3 
      });

      if (arrayBuffer.byteLength < 1024) {
        // Likely an error response, try to decode as text
        const errorText = new TextDecoder().decode(arrayBuffer);
        console.error('TTS response too small, likely error:', errorText);
        throw new Error('תגובת השמע קטנה מדי - ייתכן שהשירות לא זמין');
      }

      // Create blob from arrayBuffer with explicit MIME type
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      blobUrlRef.current = audioUrl;

      const audio = new Audio();
      audioRef.current = audio;

      // Attach all handlers BEFORE setting src
      audio.onended = () => {
        console.log('Audio playback finished successfully');
        cleanup();
      };
      
      audio.onerror = () => {
        const code = audio.error?.code;
        const msg = audio.error?.message;
        console.error('Audio playback error:', { code, msg, blobSize: audioBlob.size, blobType: audioBlob.type });
        cleanup();
        toast({
          title: 'שגיאה בניגון השמע',
          description: `קוד שגיאה: ${code ?? 'unknown'}`,
          variant: 'destructive',
        });
      };

      // Use canplaythrough to ensure enough data is buffered before playing
      audio.oncanplaythrough = async () => {
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

      // Set src last to trigger loading
      audio.src = audioUrl;
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
