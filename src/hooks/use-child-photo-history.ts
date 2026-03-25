import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface ChildPhotoRecord {
  id: string;
  child_id: string;
  user_id: string;
  original_image_url: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export const useChildPhotoHistory = (childId: string | null) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ChildPhotoRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user || !childId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('child_photos')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPhotos(data as ChildPhotoRecord[]);
      }
    } catch (err) {
      console.error('Error fetching photo history:', err);
    } finally {
      setLoading(false);
    }
  }, [user, childId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const addPhotoRecord = async (
    childId: string,
    originalImageUrl: string | null,
    avatarUrl: string | null
  ) => {
    if (!user) return;

    // Deactivate all existing records for this child
    await supabase
      .from('child_photos')
      .update({ is_active: false } as any)
      .eq('child_id', childId)
      .eq('user_id', user.id);

    // Insert new active record
    const { error } = await supabase
      .from('child_photos')
      .insert({
        child_id: childId,
        user_id: user.id,
        original_image_url: originalImageUrl,
        avatar_url: avatarUrl,
        is_active: true,
      } as any);

    if (error) {
      console.error('Error adding photo record:', error);
      throw error;
    }

    await fetchHistory();
  };

  const restoreVersion = async (photoRecord: ChildPhotoRecord) => {
    if (!user) return;

    // Deactivate all
    await supabase
      .from('child_photos')
      .update({ is_active: false } as any)
      .eq('child_id', photoRecord.child_id)
      .eq('user_id', user.id);

    // Activate selected
    await supabase
      .from('child_photos')
      .update({ is_active: true } as any)
      .eq('id', photoRecord.id);

    // Update child record with restored photo/avatar
    await supabase
      .from('children')
      .update({
        photo_url: photoRecord.original_image_url,
        avatar_url: photoRecord.avatar_url,
      })
      .eq('id', photoRecord.child_id);

    await fetchHistory();
    return photoRecord;
  };

  return {
    photos,
    loading,
    addPhotoRecord,
    restoreVersion,
    refetch: fetchHistory,
  };
};
