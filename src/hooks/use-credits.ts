import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export const useCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('story_credits')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setCredits(data?.story_credits ?? 1);
    } catch (error) {
      console.error('Error fetching credits:', error);
      setCredits(1);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const hasCredits = useCallback(() => {
    return credits !== null && credits > 0;
  }, [credits]);

  const useCredit = useCallback(async () => {
    if (!user || !hasCredits()) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ story_credits: (credits ?? 1) - 1 })
        .eq('id', user.id);

      if (error) throw error;
      setCredits(prev => (prev ?? 1) - 1);
      return true;
    } catch (error) {
      console.error('Error using credit:', error);
      return false;
    }
  }, [user, credits, hasCredits]);

  const addCredits = useCallback(async (amount: number) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ story_credits: (credits ?? 0) + amount })
        .eq('id', user.id);

      if (error) throw error;
      setCredits(prev => (prev ?? 0) + amount);
      return true;
    } catch (error) {
      console.error('Error adding credits:', error);
      return false;
    }
  }, [user, credits]);

  return {
    credits,
    loading,
    hasCredits,
    useCredit,
    addCredits,
    refetch: fetchCredits,
  };
};
