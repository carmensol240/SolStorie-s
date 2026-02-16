import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export const useEditCredits = () => {
  const { user } = useAuth();
  const [freeEditsRemaining, setFreeEditsRemaining] = useState<number>(0);
  const [freeEditsTotal, setFreeEditsTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchEditCredits = useCallback(async () => {
    if (!user) {
      setFreeEditsRemaining(0);
      setFreeEditsTotal(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('free_edits_remaining, free_edits_total')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      setFreeEditsRemaining(data?.free_edits_remaining ?? 0);
      setFreeEditsTotal(data?.free_edits_total ?? 0);
    } catch (error) {
      console.error('Error fetching edit credits:', error);
      setFreeEditsRemaining(0);
      setFreeEditsTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEditCredits();
  }, [fetchEditCredits]);

  const hasEditCredits = useCallback(() => {
    return freeEditsRemaining > 0;
  }, [freeEditsRemaining]);

  const useEditCredit = useCallback(async () => {
    if (!user || freeEditsRemaining <= 0) return false;

    try {
      const newCredits = freeEditsRemaining - 1;
      const { error } = await supabase
        .from('profiles')
        .update({ free_edits_remaining: newCredits })
        .eq('id', user.id);

      if (error) throw error;
      setFreeEditsRemaining(newCredits);
      return true;
    } catch (error) {
      console.error('Error using edit credit:', error);
      return false;
    }
  }, [user, freeEditsRemaining]);

  return {
    freeEditsRemaining,
    freeEditsTotal,
    loading,
    hasEditCredits,
    useEditCredit,
    refetch: fetchEditCredits,
  };
};
