import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { isDevModeEnabled, MOCK_DEV_PROFILE } from './use-dev-mode';

export const useSubscription = () => {
  const { user } = useAuth();
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔧 DEV MODE: Return mock subscriber status
    if (isDevModeEnabled()) {
      setIsSubscriber(MOCK_DEV_PROFILE.is_subscriber);
      setLoading(false);
      return;
    }

    if (user) {
      checkSubscription();
    } else {
      setIsSubscriber(false);
      setLoading(false);
    }
  }, [user]);

  const checkSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // 🔧 DEV MODE check
    if (isDevModeEnabled()) {
      setIsSubscriber(MOCK_DEV_PROFILE.is_subscriber);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_subscriber')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsSubscriber(data?.is_subscriber ?? false);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscriber(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    isSubscriber,
    loading,
    refetch: checkSubscription,
  };
};
