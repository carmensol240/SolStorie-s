
# תוכנית תיקון: StoryViewer Crash, Azure TTS ופריסה

## סקירה

יש שלוש בעיות לטיפול:
1. **שגיאת useState ב-StoryViewer** - הקריסה נגרמת ככל הנראה מבעיית קריאה ל-Edge Function
2. **עדכון סוד Azure** - הגדרת `AZURE_SPEECH_REGION` לערך `eastus`
3. **פריסה חדשה** - אחרי תיקון הבאגים, יתבצע Build חדש

---

## 1. תיקון שגיאת useState ב-StoryViewer

### הבעיה
ה-Hook `use-text-to-speech.ts` משתמש ב-`fetch` ישיר במקום ב-`supabase.functions.invoke`, מה שעלול לגרום לבעיות CORS ושגיאות שלא מטופלות נכון.

### הפתרון
עדכון `src/hooks/use-text-to-speech.ts`:

```typescript
// לפני - שימוש בfetch ישיר
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/azure-speech-tts`,
  {
    method: 'POST',
    headers: {...},
    body: JSON.stringify({ text }),
  }
);

// אחרי - שימוש ב-supabase.functions.invoke
const { data, error } = await supabase.functions.invoke('azure-speech-tts', {
  body: { text },
});
```

### שינויים נוספים להגנה
- הוספת בדיקות null/undefined לפני גישה למאפיינים
- הוספת try-catch מפורטים יותר
- וידוא שהטקסט הוא מסוג string לפני שליחה

---

## 2. עדכון סוד AZURE_SPEECH_REGION

הסוד קיים כבר במערכת. לאחר אישורך, אעדכן את הערך ל-`eastus`.

---

## 3. תמונת רקע - ילדים מרחפים בשמיים

התמונה הנוכחית (`hero-flying-girl.jpeg`) כבר מציגה ילדים מרחפים בשמיים בסגנון דיסני-פיקסאר. אם ברצונך להחליף לתמונה אחרת, נא לציין את שם הקובץ או להעלות תמונה חדשה.

---

## 4. הבטחת Build מוצלח

לאחר התיקונים, האפליקציה תעבור Build ותפרס אוטומטית לאתר החי.

---

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `src/hooks/use-text-to-speech.ts` | מעבר ל-supabase.functions.invoke + טיפול בשגיאות |

---

## פרטים טכניים

### use-text-to-speech.ts - גרסה מתוקנת

```typescript
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
```

---

## תוצאה צפויה

- האפליקציה תעבוד ללא קריסות
- הקראה קולית תפעל עם Azure TTS באזור `eastus`
- האתר החי יעודכן לאחר Build מוצלח
