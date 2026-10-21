import { useCallback } from 'react';

/**
 * Text editing of an owned, purchased story is free and unlimited.
 * No credits are consumed and no edit counter is kept.
 */
interface UseStoryEditResult {
  canEdit: () => boolean;
  performEdit: () => Promise<{ success: boolean; errorMessage?: string }>;
}

export const useStoryEdit = (_storyId: string): UseStoryEditResult => {
  const canEdit = useCallback(() => true, []);
  const performEdit = useCallback(async () => ({ success: true }), []);
  return { canEdit, performEdit };
};
