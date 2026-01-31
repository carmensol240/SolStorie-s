import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { useSubscription } from './use-subscription';

const DAILY_EDIT_CREDITS_LIMIT = 5;
const CREDITS_RESET_HOURS = 24;

export const useEditCredits = () => {
  const { user } = useAuth();
  const { isSubscriber } = useSubscription();
  const [editCredits, setEditCredits] = useState<number>(DAILY_EDIT_CREDITS_LIMIT);
  const [loading, setLoading] = useState(true);

  const fetchEditCredits = useCallback(async () => {
    if (!user) {
      setEditCredits(DAILY_EDIT_CREDITS_LIMIT);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('daily_edit_credits, last_edit_credits_reset')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      // Check if credits need to be reset (24 hours passed)
      const lastReset = data?.last_edit_credits_reset 
        ? new Date(data.last_edit_credits_reset) 
        : new Date(0);
      const hoursSinceReset = (Date.now() - lastReset.getTime()) / (1000 * 60 * 60);

      if (hoursSinceReset >= CREDITS_RESET_HOURS) {
        // Reset credits
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            daily_edit_credits: DAILY_EDIT_CREDITS_LIMIT,
            last_edit_credits_reset: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (!updateError) {
          setEditCredits(DAILY_EDIT_CREDITS_LIMIT);
        }
      } else {
        setEditCredits(data?.daily_edit_credits ?? DAILY_EDIT_CREDITS_LIMIT);
      }
    } catch (error) {
      console.error('Error fetching edit credits:', error);
      setEditCredits(DAILY_EDIT_CREDITS_LIMIT);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEditCredits();
  }, [fetchEditCredits]);

  const hasEditCredits = useCallback(() => {
    // Non-subscribers have unlimited free edits
    if (!isSubscriber) return true;
    // Subscribers have daily limit
    return editCredits > 0;
  }, [editCredits, isSubscriber]);

  const useEditCredit = useCallback(async () => {
    // Non-subscribers don't use credits (free editing for basic users)
    if (!isSubscriber || !user) return true;
    
    if (!hasEditCredits()) return false;

    try {
      const newCredits = Math.max(0, editCredits - 1);
      const { error } = await supabase
        .from('profiles')
        .update({ daily_edit_credits: newCredits })
        .eq('id', user.id);

      if (error) throw error;
      setEditCredits(newCredits);
      return true;
    } catch (error) {
      console.error('Error using edit credit:', error);
      return false;
    }
  }, [user, editCredits, hasEditCredits, isSubscriber]);

  const getTimeUntilReset = useCallback(() => {
    // Returns hours until next reset
    return CREDITS_RESET_HOURS;
  }, []);

  return {
    editCredits,
    loading,
    hasEditCredits,
    useEditCredit,
    refetch: fetchEditCredits,
    isSubscriber,
    getTimeUntilReset,
    maxCredits: DAILY_EDIT_CREDITS_LIMIT,
  };
};
