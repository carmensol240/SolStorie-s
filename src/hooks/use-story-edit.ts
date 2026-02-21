import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCredits } from './use-credits';
import { useEditCredits } from './use-edit-credits';
import { useAuth } from './use-auth';

interface UseStoryEditResult {
  /** Check if user can edit (has free edits or credits) */
  canEdit: () => boolean;
  /** Perform the edit - uses free edit first, then story credit */
  performEdit: () => Promise<{ success: boolean; errorMessage?: string }>;
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
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

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
    // Admins can always edit
    if (isAdmin) return true;
    // Can edit if has free edits from package OR has story credits
    return hasEditCredits() || hasCredits();
  }, [isAdmin, hasEditCredits, hasCredits]);

  const performEdit = useCallback(async (): Promise<{ success: boolean; errorMessage?: string }> => {
    if (!user || !storyId) {
      const msg = 'משתמש לא מחובר';
      setError(msg);
      return { success: false, errorMessage: msg };
    }

    setLoading(true);
    setError(null);

    try {
      // Admins skip credit deduction
      if (!isAdmin) {
        // Try free edits first, then fall back to story credits
        if (hasEditCredits()) {
          const used = await useEditCredit();
          if (!used) {
            const msg = 'שגיאה בשימוש בעריכה חינמית';
            setError(msg);
            setLoading(false);
            return { success: false, errorMessage: msg };
          }
        } else if (hasCredits()) {
          const creditUsed = await useCredit();
          if (!creditUsed) {
            const msg = 'שגיאה בניכוי קרדיט';
            setError(msg);
            setLoading(false);
            return { success: false, errorMessage: msg };
          }
        } else {
          const msg = 'אין מספיק קרדיטים לעריכה';
          setError(msg);
          setLoading(false);
          return { success: false, errorMessage: msg };
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
      return { success: true };
    } catch (err) {
      console.error('Error performing edit:', err);
      const msg = 'שגיאה בביצוע העריכה';
      setError(msg);
      setLoading(false);
      return { success: false, errorMessage: msg };
    }
  }, [user, storyId, editCount, isAdmin, hasEditCredits, useEditCredit, hasCredits, useCredit]);

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
