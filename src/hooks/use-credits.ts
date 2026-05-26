import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { isDevModeEnabled, MOCK_DEV_PROFILE } from './use-dev-mode';

export const useCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    // 🔧 DEV MODE: Return mock credits
    if (isDevModeEnabled()) {
      setCredits(MOCK_DEV_PROFILE.story_credits);
      setLoading(false);
      return;
    }

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

  // Refresh credits when a purchase completes or the tab regains focus
  useEffect(() => {
    const onPurchase = () => fetchCredits();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchCredits();
    };
    window.addEventListener('purchase-completed', onPurchase);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onPurchase);
    return () => {
      window.removeEventListener('purchase-completed', onPurchase);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onPurchase);
    };
  }, [fetchCredits]);

  const hasCredits = useCallback(() => {
    return credits !== null && credits > 0;
  }, [credits]);

  const useCredit = useCallback(async () => {
    // 🔧 DEV MODE: Always succeed without actually decrementing
    if (isDevModeEnabled()) {
      console.log('🔧 Dev mode: mock credit used');
      return true;
    }

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
    // 🔧 DEV MODE: Always succeed
    if (isDevModeEnabled()) {
      console.log('🔧 Dev mode: mock credits added:', amount);
      setCredits(prev => (prev ?? 0) + amount);
      return true;
    }

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
