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
    // Admins can always edit
    if (isAdmin) return true;
    // Can edit if has free edits from package OR has story credits
    return hasEditCredits() || hasCredits();
  }, [isAdmin, hasEditCredits, hasCredits]);

  const performEdit = useCallback(async (): Promise<{ success: boolean; errorMessage?: string }> => {
    // Always re-validate credits from server before performing edit
    await refetchEditCredits();
    
    console.log('[performEdit] Starting...', { 
      userId: user?.id, storyId, isAdmin, 
      credits, freeEditsRemaining, 
      creditsLoading, editCreditsLoading,
      hasCreditsResult: hasCredits(), 
      hasEditCreditsResult: hasEditCredits() 
    });

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
        // If credits are still loading, fetch them directly from DB
        if (creditsLoading || editCreditsLoading) {
          console.log('[performEdit] Credits still loading, fetching directly from DB...');
          const { data: profileData } = await supabase
            .from('profiles')
            .select('story_credits, free_edits_remaining')
            .eq('id', user.id)
            .maybeSingle();
          
          const directFreeEdits = profileData?.free_edits_remaining ?? 0;
          const directCredits = profileData?.story_credits ?? 0;
          console.log('[performEdit] Direct DB credits:', { directFreeEdits, directCredits });

          if (directFreeEdits > 0) {
            const { error: editError } = await supabase
              .from('profiles')
              .update({ free_edits_remaining: directFreeEdits - 1 })
              .eq('id', user.id);
            if (editError) {
              console.error('[performEdit] Free edit deduction failed:', editError);
              throw editError;
            }
          } else if (directCredits > 0) {
            const { error: creditError } = await supabase
              .from('profiles')
              .update({ story_credits: directCredits - 1 })
              .eq('id', user.id);
            if (creditError) {
              console.error('[performEdit] Credit deduction failed:', creditError);
              throw creditError;
            }
          } else {
            const msg = 'אין מספיק קרדיטים לעריכה';
            setError(msg);
            setLoading(false);
            return { success: false, errorMessage: msg };
          }
        } else {
          // Credits loaded, use hook functions
          if (hasEditCredits()) {
            console.log('[performEdit] Using free edit credit...');
            const used = await useEditCredit();
            if (!used) {
              console.error('[performEdit] useEditCredit returned false');
              const msg = 'שגיאה בשימוש בעריכה חינמית';
              setError(msg);
              setLoading(false);
              return { success: false, errorMessage: msg };
            }
          } else if (hasCredits()) {
            console.log('[performEdit] Using story credit...');
            const creditUsed = await useCredit();
            if (!creditUsed) {
              console.error('[performEdit] useCredit returned false');
              const msg = 'שגיאה בניכוי קרדיט';
              setError(msg);
              setLoading(false);
              return { success: false, errorMessage: msg };
            }
          } else {
            console.log('[performEdit] No credits available at all');
            const msg = 'אין מספיק קרדיטים לעריכה';
            setError(msg);
            setLoading(false);
            return { success: false, errorMessage: msg };
          }
        }
      } else {
        console.log('[performEdit] Admin user, skipping credits');
      }

      // Increment the edit count on the story
      const currentEditCount = editCount ?? 0;
      console.log('[performEdit] Updating edit count:', currentEditCount + 1);
      const { error: updateError } = await supabase
        .from('stories')
        .update({ edit_count: currentEditCount + 1 })
        .eq('id', storyId);

      if (updateError) {
        console.error('[performEdit] Story update error:', updateError);
        throw updateError;
      }

      setEditCount(currentEditCount + 1);
      setLoading(false);
      console.log('[performEdit] Success!');
      return { success: true };
    } catch (err) {
      console.error('[performEdit] Caught error:', err);
      const msg = 'שגיאה בביצוע העריכה';
      setError(msg);
      setLoading(false);
      return { success: false, errorMessage: msg };
    }
  }, [user, storyId, editCount, isAdmin, hasEditCredits, useEditCredit, hasCredits, useCredit, credits, freeEditsRemaining, creditsLoading, editCreditsLoading]);

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
