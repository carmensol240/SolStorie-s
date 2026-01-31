import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export const useReferral = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [shareCoins, setShareCoins] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const generateCode = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }, []);

  const fetchReferralData = useCallback(async () => {
    if (!user) {
      setReferralCode(null);
      setShareCoins(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('referral_code, share_coins')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.referral_code) {
        setReferralCode(data.referral_code);
      } else {
        // Generate and save a new referral code
        const newCode = generateCode();
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ referral_code: newCode })
          .eq('id', user.id);

        if (!updateError) {
          setReferralCode(newCode);
        }
      }

      setShareCoins(data?.share_coins ?? 0);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, generateCode]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const getShareLink = useCallback(() => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth?ref=${referralCode}`;
  }, [referralCode]);

  const shareToWhatsApp = useCallback(() => {
    const text = `גילינו אפליקציה מדהימה לסיפורים אישיים לילדים! 📚✨ הילדים שלי מתים עליה. נסו בחינם: ${getShareLink()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }, [getShareLink]);

  const shareToFacebook = useCallback(() => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareLink())}`, '_blank');
  }, [getShareLink]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getShareLink());
      return true;
    } catch {
      return false;
    }
  }, [getShareLink]);

  const redeemCoin = useCallback(async () => {
    if (!user || shareCoins < 1) return false;

    try {
      // Get current story credits
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('story_credits, share_coins')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Update: decrease share_coins, increase story_credits
      const { error } = await supabase
        .from('profiles')
        .update({
          share_coins: (profile.share_coins ?? 0) - 1,
          story_credits: (profile.story_credits ?? 0) + 1,
        })
        .eq('id', user.id);

      if (error) throw error;

      setShareCoins(prev => prev - 1);
      return true;
    } catch (error) {
      console.error('Error redeeming coin:', error);
      return false;
    }
  }, [user, shareCoins]);

  return {
    referralCode,
    shareCoins,
    loading,
    getShareLink,
    shareToWhatsApp,
    shareToFacebook,
    copyToClipboard,
    redeemCoin,
    refetch: fetchReferralData,
  };
};
