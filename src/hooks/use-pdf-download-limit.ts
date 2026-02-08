import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";

const FREE_DOWNLOADS_PER_MONTH = 3;

export const usePdfDownloadLimit = () => {
  const { user } = useAuth();
  const { credits } = useCredits();

  // Check if user has exceeded their free download limit
  const checkDownloadLimit = async (): Promise<{ allowed: boolean; remaining: number }> => {
    if (!user) {
      return { allowed: false, remaining: 0 };
    }

    // Subscribers (credits > 1) have unlimited downloads
    if (credits && credits > 1) {
      return { allowed: true, remaining: Infinity };
    }

    // Get start of current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('pdf_downloads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('downloaded_at', startOfMonth.toISOString());

    if (error) {
      console.error('Error checking download limit:', error);
      // Allow download on error to not block user
      return { allowed: true, remaining: FREE_DOWNLOADS_PER_MONTH };
    }

    const downloadsThisMonth = count || 0;
    const remaining = FREE_DOWNLOADS_PER_MONTH - downloadsThisMonth;

    return {
      allowed: downloadsThisMonth < FREE_DOWNLOADS_PER_MONTH,
      remaining: Math.max(0, remaining)
    };
  };

  // Record a download
  const recordDownload = async (storyId: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('pdf_downloads')
      .insert({
        user_id: user.id,
        story_id: storyId
      });

    if (error) {
      console.error('Error recording download:', error);
      return false;
    }

    return true;
  };

  return {
    checkDownloadLimit,
    recordDownload,
    FREE_DOWNLOADS_PER_MONTH
  };
};
