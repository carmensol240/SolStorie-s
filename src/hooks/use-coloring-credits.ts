import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export const useColoringCredits = () => {
  const { user } = useAuth();
  const [coloringCredits, setColoringCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setColoringCredits(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('coloring_credits')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setColoringCredits(data?.coloring_credits ?? 0);
    } catch (error) {
      console.error('Error fetching coloring credits:', error);
      setColoringCredits(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Listen for purchase events
  useEffect(() => {
    const handler = () => fetchCredits();
    window.addEventListener('coloring-credits-updated', handler);
    window.addEventListener('purchase-completed', handler);
    return () => {
      window.removeEventListener('coloring-credits-updated', handler);
      window.removeEventListener('purchase-completed', handler);
    };
  }, [fetchCredits]);

  return { coloringCredits, loading, refetch: fetchCredits };
};
