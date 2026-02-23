import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { getUserData } from '@/lib/user-storage';

interface ChildAvatarData {
  avatarUrl: string | null;
  childName: string | null;
  regenerationCount: number;
}

export const useChildAvatar = (childName?: string) => {
  const { user } = useAuth();
  const [avatarData, setAvatarData] = useState<ChildAvatarData>({
    avatarUrl: null,
    childName: null,
    regenerationCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvatar = async () => {
      // Use user-scoped localStorage (requires user ID)
      const localChildren = JSON.parse(getUserData(user?.id, 'savedChildren') || '[]');
      
      if (childName && localChildren.length > 0) {
        const localChild = localChildren.find((c: any) => c.name === childName);
        if (localChild?.avatar_url) {
          setAvatarData({
            avatarUrl: localChild.avatar_url,
            childName: localChild.name,
            regenerationCount: localChild.avatar_regeneration_count || 0,
          });
          setIsLoading(false);
          return;
        }
      }

      if (!user) {
        // For non-logged users, use first child from localStorage
        if (localChildren.length > 0) {
          const firstChild = localChildren[0];
          setAvatarData({
            avatarUrl: firstChild.avatar_url || null,
            childName: firstChild.name || null,
            regenerationCount: firstChild.avatar_regeneration_count || 0,
          });
        } else {
          setAvatarData({ avatarUrl: null, childName: null, regenerationCount: 0 });
        }
        setIsLoading(false);
        return;
      }

      try {
        // Build query based on whether we have a specific child name
        let query = supabase
          .from('children')
          .select('avatar_url, name')
          .eq('user_id', user.id)
          .not('avatar_url', 'is', null);
        
        if (childName) {
          query = query.eq('name', childName);
        }
        
        const { data } = await query.limit(1).maybeSingle();
        
        setAvatarData({
          avatarUrl: data?.avatar_url || null,
          childName: data?.name || null,
          regenerationCount: 0, // DB doesn't track this yet, use localStorage
        });
      } catch (error) {
        console.error('Error fetching child avatar:', error);
        setAvatarData({ avatarUrl: null, childName: null, regenerationCount: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatar();
  }, [user, childName]);

  return { 
    avatarUrl: avatarData.avatarUrl, 
    childName: avatarData.childName,
    regenerationCount: avatarData.regenerationCount,
    isLoading 
  };
};
