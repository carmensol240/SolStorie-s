import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDeviceId } from './use-device-id';

export type EventType = 
  | 'story_started'
  | 'story_completed'
  | 'page_viewed'
  | 'feature_used'
  | 'drawing_used'
  | 'signup_completed'
  | 'create_story_opened'
  | 'child_info_completed'
  | 'photo_uploaded'
  | 'topic_selected'
  | 'generation_started'
  | 'generation_failed'
  | 'story_created'
  | 'checkout_started'
  | 'paywall_view'
  | 'package_selected'
  | 'purchase_completed'
  | 'purchase_failed'
  | 'deletion_screen_view'
  | 'deletion_reason_selected'
  | 'soft_exit_chosen'
  | 'account_deleted'
  | 'share_screen_view'
  | 'share_clicked'
  | 'referral_signup_completed'
  | 'coin_awarded'
  | 'referral_credit_awarded'
  | 'coin_redeemed';

interface TrackEventParams {
  eventType: EventType;
  storyId?: string;
  pageNumber?: number;
  timeSpentSeconds?: number;
  metadata?: Record<string, any>;
}

export const useAnalytics = () => {
  const deviceId = useDeviceId();
  const pageStartTime = useRef<number>(Date.now());

  const trackEvent = useCallback(
    async ({ eventType, storyId, pageNumber, timeSpentSeconds, metadata }: TrackEventParams) => {
      if (!deviceId) return;

      try {
        // Use edge function instead of direct database insert
        // This ensures all analytics goes through validated, rate-limited endpoint
        const { error } = await supabase.functions.invoke('track-event', {
          body: {
            device_id: deviceId,
            event_type: eventType,
            story_id: storyId || null,
            page_number: pageNumber ?? null,
            time_spent_seconds: timeSpentSeconds ?? null,
            metadata: metadata || null,
          },
        });
        
        if (error) {
          console.warn('Analytics event failed:', error.message);
        }
      } catch (error) {
        // Silently fail - analytics should not break the app
        console.warn('Analytics event failed:', error);
      }
    },
    [deviceId]
  );

  const startPageTimer = useCallback(() => {
    pageStartTime.current = Date.now();
  }, []);

  const getPageTimeSpent = useCallback(() => {
    return Math.floor((Date.now() - pageStartTime.current) / 1000);
  }, []);

  const trackStoryStarted = useCallback(
    (storyId: string) => {
      trackEvent({ eventType: 'story_started', storyId });
      startPageTimer();
    },
    [trackEvent, startPageTimer]
  );

  const trackStoryCompleted = useCallback(
    (storyId: string) => {
      trackEvent({ eventType: 'story_completed', storyId });
    },
    [trackEvent]
  );

  const trackPageViewed = useCallback(
    (storyId: string, pageNumber: number) => {
      const timeSpent = getPageTimeSpent();
      trackEvent({
        eventType: 'page_viewed',
        storyId,
        pageNumber,
        timeSpentSeconds: timeSpent,
      });
      startPageTimer();
    },
    [trackEvent, getPageTimeSpent, startPageTimer]
  );

  const trackFeatureUsed = useCallback(
    (feature: string, storyId?: string) => {
      trackEvent({
        eventType: 'feature_used',
        storyId,
        metadata: { feature },
      });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackStoryStarted,
    trackStoryCompleted,
    trackPageViewed,
    trackFeatureUsed,
    startPageTimer,
    getPageTimeSpent,
  };
};
