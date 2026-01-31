import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCredits } from './use-credits';
import { useAuth } from './use-auth';

interface UseStoryEditResult {
  /** Whether this is the first edit (free) for the story */
  isFirstEdit: boolean;
  /** Check if user can edit (has credits or first edit) */
  canEdit: () => boolean;
  /** Perform the edit - increments edit_count and deducts credit if needed */
  performEdit: () => Promise<boolean>;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Fetch edit count for a story */
  fetchEditCount: (storyId: string) => Promise<void>;
  /** Current edit count */
  editCount: number | null;
}

export const useStoryEdit = (storyId: string): UseStoryEditResult => {
  const { user } = useAuth();
  const { credits, hasCredits, useCredit } = useCredits();
  const [editCount, setEditCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFirstEdit = editCount === 0;

  const fetchEditCount = useCallback(async (id: string) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('stories')
        .select('edit_count')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setEditCount(data?.edit_count ?? 0);
    } catch (err) {
      console.error('Error fetching edit count:', err);
      setError('שגיאה בטעינת מידע העריכה');
      setEditCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const canEdit = useCallback(() => {
    // First edit is always free
    if (editCount === 0) return true;
    // Subsequent edits require credits
    return hasCredits();
  }, [editCount, hasCredits]);

  const performEdit = useCallback(async (): Promise<boolean> => {
    if (!user || !storyId) {
      setError('משתמש לא מחובר');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const currentEditCount = editCount ?? 0;

      // If not first edit, deduct credit first
      if (currentEditCount > 0) {
        const creditUsed = await useCredit();
        if (!creditUsed) {
          setError('אין מספיק קרדיטים');
          setLoading(false);
          return false;
        }
      }

      // Increment the edit count on the story
      const { error: updateError } = await supabase
        .from('stories')
        .update({ edit_count: currentEditCount + 1 })
        .eq('id', storyId);

      if (updateError) throw updateError;

      setEditCount(currentEditCount + 1);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Error performing edit:', err);
      setError('שגיאה בביצוע העריכה');
      setLoading(false);
      return false;
    }
  }, [user, storyId, editCount, useCredit]);

  return {
    isFirstEdit,
    canEdit,
    performEdit,
    loading,
    error,
    fetchEditCount,
    editCount,
  };
};
