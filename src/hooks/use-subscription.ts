import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export const useSubscription = () => {
  const { user } = useAuth();
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
