import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export const useEditingCredits = () => {
  const { user } = useAuth();
  const [editingCredits, setEditingCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setEditingCredits(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('editing_credits')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setEditingCredits((data as any)?.editing_credits ?? 0);
    } catch (error) {
      console.error('Error fetching editing credits:', error);
      setEditingCredits(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  useEffect(() => {
    const handler = () => fetchCredits();
    window.addEventListener('editing-credits-updated', handler);
    return () => window.removeEventListener('editing-credits-updated', handler);
  }, [fetchCredits]);

  return { editingCredits, loading, refetch: fetchCredits };
};
