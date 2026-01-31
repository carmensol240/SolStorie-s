import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useNikud = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addNikud = useCallback(async (text: string): Promise<string | null> => {
    if (!text.trim()) return null;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('add-nikud', {
        body: { text },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.nikudText || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה בהוספת ניקוד';
      setError(message);
      console.error('Error adding nikud:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    addNikud,
    isLoading,
    error,
  };
};
