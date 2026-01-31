import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDeviceId } from './use-device-id';

interface UserSettings {
  avatar_emoji: string;
  nickname: string;
  silent_mode: boolean;
  sound_effects_enabled: boolean;
  screen_time_limit: number;
  age_filter_min: number;
  age_filter_max: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  avatar_emoji: '🦁',
  nickname: 'חבר קטן',
  silent_mode: false,
  sound_effects_enabled: true,
  screen_time_limit: 60,
  age_filter_min: 0,
  age_filter_max: 10,
};

export const useSettings = () => {
  const deviceId = useDeviceId();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) return;

    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        // Use edge function to securely fetch settings by device_id
        const { data: response, error } = await supabase.functions.invoke('get-settings', {
          body: { device_id: deviceId, action: 'get' }
        });

        if (error) throw error;

        const data = response?.data;

        if (data) {
          setSettings({
            avatar_emoji: data.avatar_emoji || DEFAULT_SETTINGS.avatar_emoji,
            nickname: data.nickname || DEFAULT_SETTINGS.nickname,
            silent_mode: data.silent_mode ?? DEFAULT_SETTINGS.silent_mode,
            sound_effects_enabled: data.sound_effects_enabled ?? DEFAULT_SETTINGS.sound_effects_enabled,
            screen_time_limit: data.screen_time_limit ?? DEFAULT_SETTINGS.screen_time_limit,
            age_filter_min: data.age_filter_min ?? DEFAULT_SETTINGS.age_filter_min,
            age_filter_max: data.age_filter_max ?? DEFAULT_SETTINGS.age_filter_max,
          });
        } else {
          // Create default settings for new device via edge function
          await supabase.functions.invoke('get-settings', {
            body: { device_id: deviceId, action: 'create', settings: DEFAULT_SETTINGS }
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [deviceId]);

  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      if (!deviceId) return;

      const updated = { ...settings, ...newSettings };
      setSettings(updated);

      try {
        // Update via edge function
        await supabase.functions.invoke('get-settings', {
          body: { device_id: deviceId, action: 'update', settings: updated }
        });
      } catch (error) {
        console.error('Failed to update settings:', error);
      }
    },
    [deviceId, settings]
  );

  return {
    settings,
    updateSettings,
    isLoading,
  };
};
