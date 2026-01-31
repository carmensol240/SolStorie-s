import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export const useChildAvatar = () => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAvatarUrl(null);
      setIsLoading(false);
      return;
    }

    const fetchAvatar = async () => {
      try {
        const { data } = await supabase
          .from('children')
          .select('avatar_url')
          .eq('user_id', user.id)
          .not('avatar_url', 'is', null)
          .limit(1)
          .maybeSingle();
        
        setAvatarUrl(data?.avatar_url || null);
      } catch (error) {
        console.error('Error fetching child avatar:', error);
        setAvatarUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatar();
  }, [user]);

  return { avatarUrl, isLoading };
};
