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
  const { credits, hasCredits, useCredit, loading: creditsLoading } = useCredits();
  const { freeEditsRemaining, freeEditsTotal, hasEditCredits, useEditCredit, loading: editCreditsLoading, refetch: refetchEditCredits } = useEditCredits();
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
    if (isAdmin) return true;
    // First editing round is free for every story (text + nikud + save across all pages)
    if (editCount !== null && editCount === 0) return true;
    return hasEditCredits() || hasCredits();
  }, [isAdmin, editCount, hasEditCredits, hasCredits]);

  const performEdit = useCallback(async (): Promise<{ success: boolean; errorMessage?: string }> => {
    console.log('[performEdit] Starting...', { userId: user?.id, storyId, isAdmin });

    if (!user || !storyId) {
      const msg = 'משתמש לא מחובר';
      setError(msg);
      return { success: false, errorMessage: msg };
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch fresh edit_count first to decide if this edit is part of the free round
      const { data: storyPre, error: storyPreErr } = await supabase
        .from('stories')
        .select('edit_count')
        .eq('id', storyId)
        .maybeSingle();
      if (storyPreErr) throw storyPreErr;
      const currentEditCount = storyPre?.edit_count ?? 0;
      const isFreeRound = currentEditCount === 0;

      // Admins and the first free editing round skip credit deduction
      if (!isAdmin && !isFreeRound) {
        // Always fetch credits directly from DB to avoid stale state / race conditions
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('story_credits, free_edits_remaining, editing_credits')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('[performEdit] Profile fetch error:', profileError);
          throw profileError;
        }

        const directEditingCredits = (profileData as any)?.editing_credits ?? 0;
        const directFreeEdits = profileData?.free_edits_remaining ?? 0;
        const directCredits = profileData?.story_credits ?? 0;
        console.log('[performEdit] DB credits:', { directEditingCredits, directFreeEdits, directCredits });

        if (directEditingCredits > 0) {
          const { error: editError } = await supabase
            .from('profiles')
            .update({ editing_credits: directEditingCredits - 1 } as any)
            .eq('id', user.id);
          if (editError) throw editError;
          window.dispatchEvent(new Event('editing-credits-updated'));
        } else if (directFreeEdits > 0) {
          const { error: editError } = await supabase
            .from('profiles')
            .update({ free_edits_remaining: directFreeEdits - 1 })
            .eq('id', user.id);
          if (editError) throw editError;
        } else if (directCredits > 0) {
          const { error: creditError } = await supabase
            .from('profiles')
            .update({ story_credits: directCredits - 1 })
            .eq('id', user.id);
          if (creditError) throw creditError;
        } else {
          const msg = 'אין קרדיטי עריכה, לחץ לרכישה';
          setError(msg);
          setLoading(false);
          return { success: false, errorMessage: msg };
        }
      } else if (isAdmin) {
        console.log('[performEdit] Admin user, skipping credits');
      } else {
        console.log('[performEdit] Free editing round, skipping credits');
      }

      const freshEditCount = currentEditCount;
      const { error: updateError } = await supabase
        .from('stories')
        .update({ edit_count: freshEditCount + 1 })
        .eq('id', storyId);

      if (updateError) throw updateError;

      setEditCount(freshEditCount + 1);
      setLoading(false);
      // Refresh credit state in hooks
      refetchEditCredits();
      console.log('[performEdit] Success!');
      return { success: true };
    } catch (err) {
      console.error('[performEdit] Caught error:', err);
      const msg = 'שגיאה בביצוע העריכה';
      setError(msg);
      setLoading(false);
      return { success: false, errorMessage: msg };
    }
  }, [user, storyId, isAdmin, refetchEditCredits]);

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
