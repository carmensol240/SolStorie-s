import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

export const useTopicWishlist = () => {
  const { user } = useAuth();
  const [likedTopics, setLikedTopics] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setLikedTopics(new Set());
      return;
    }

    const fetchWishlist = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('topic_wishlist')
        .select('topic_id')
        .eq('user_id', user.id);

      if (!error && data) {
        setLikedTopics(new Set(data.map((r: { topic_id: string }) => r.topic_id)));
      }
      setLoading(false);
    };

    fetchWishlist();
  }, [user]);

  const toggleLike = useCallback(async (topicId: string) => {
    if (!user) {
      toast({ title: '💜 התחברו כדי לשמור נושאים', description: 'יש להתחבר כדי לסמן נושאים שאהבתם' });
      return;
    }

    const isLiked = likedTopics.has(topicId);

    // Optimistic update
    setLikedTopics(prev => {
      const next = new Set(prev);
      if (isLiked) next.delete(topicId);
      else next.add(topicId);
      return next;
    });

    if (isLiked) {
      const { error } = await supabase
        .from('topic_wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('topic_id', topicId);

      if (error) {
        // Revert
        setLikedTopics(prev => { const n = new Set(prev); n.add(topicId); return n; });
      }
    } else {
      const { error } = await supabase
        .from('topic_wishlist')
        .insert({ user_id: user.id, topic_id: topicId });

      if (error) {
        // Revert
        setLikedTopics(prev => { const n = new Set(prev); n.delete(topicId); return n; });
      }
    }
  }, [user, likedTopics]);

  return { likedTopics, toggleLike, loading };
};
