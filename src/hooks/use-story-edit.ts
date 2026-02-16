import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCredits } from './use-credits';
import { useEditCredits } from './use-edit-credits';
import { useAuth } from './use-auth';

interface UseStoryEditResult {
  /** Check if user can edit (has free edits or credits) */
  canEdit: () => boolean;
  /** Perform the edit - uses free edit first, then story credit */
  performEdit: () => Promise<boolean>;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Fetch edit count for a story */
  fetchEditCount: (storyId: string) => Promise<void>;
  /** Current edit count */
  editCount: number | null;
  /** Free edits remaining from package */
  freeEditsRemaining: number;
  /** Total free edits from package */
  freeEditsTotal: number;
}

export const useStoryEdit = (storyId: string): UseStoryEditResult => {
  const { user } = useAuth();
  const { hasCredits, useCredit } = useCredits();
  const { freeEditsRemaining, freeEditsTotal, hasEditCredits, useEditCredit } = useEditCredits();
  const [editCount, setEditCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    // Can edit if has free edits from package OR has story credits
    return hasEditCredits() || hasCredits();
  }, [hasEditCredits, hasCredits]);

  const performEdit = useCallback(async (): Promise<boolean> => {
    if (!user || !storyId) {
      setError('משתמש לא מחובר');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Try free edits first, then fall back to story credits
      if (hasEditCredits()) {
        const used = await useEditCredit();
        if (!used) {
          setError('שגיאה בשימוש בעריכה חינמית');
          setLoading(false);
          return false;
        }
      } else {
        const creditUsed = await useCredit();
        if (!creditUsed) {
          setError('אין מספיק קרדיטים');
          setLoading(false);
          return false;
        }
      }

      // Increment the edit count on the story
      const currentEditCount = editCount ?? 0;
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
  }, [user, storyId, editCount, hasEditCredits, useEditCredit, useCredit]);

  return {
    canEdit,
    performEdit,
    loading,
    error,
    fetchEditCount,
    editCount,
    freeEditsRemaining,
    freeEditsTotal,
  };
};
