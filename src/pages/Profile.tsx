import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Coins, Users, Sparkles, Crown, ChevronLeft, Gift, Copy, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useChildAvatar } from "@/hooks/use-child-avatar";
import { useAnalytics } from "@/hooks/use-analytics";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MobileNavigation from "@/components/MobileNavigation";
import profileHero from "@/assets/profile-hero.jpg";

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  gender: string | null;
}

const AGE_RANGE_MAP: Record<number, string> = {
  0: "0-2", 1: "0-2", 2: "0-2",
  3: "3-6", 4: "3-6", 5: "3-6", 6: "3-6",
  7: "7-8", 8: "7-8",
};

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits, refetch: refetchCredits } = useCredits();
  const { shareCoins, shareToWhatsApp, copyToClipboard, redeemCoin } = useReferral();
  const { avatarUrl } = useChildAvatar();
  const { trackEvent } = useAnalytics();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [copied, setCopied] = useState(false);

  const totalCredits = (credits ?? 0) + shareCoins;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, is_subscriber")
        .eq("id", user.id)
        .maybeSingle();
      setDisplayName(data?.display_name || user.email?.split("@")[0] || null);
      setIsSubscriber(data?.is_subscriber ?? false);
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("children")
        .select("id, name, age, gender")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setChildren(data ?? []);
    };
    fetchChildren();
  }, [user]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-purple-50/50 to-background pb-20 overflow-y-auto" dir="rtl" style={{ WebkitOverflowScrolling: "touch" }}>
      {/* Hero */}
      <div
        className="relative h-40 flex-shrink-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${profileHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-purple-900/70" />

        <div className="absolute bottom-4 right-4 left-4 flex items-end gap-3">
          {avatarUrl && (
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/60 shadow-lg flex-shrink-0">
              <img src={avatarUrl} alt="אווטר" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-lg font-bold truncate">
              שלום, {displayName || "משתמש"} 👋
            </h1>
            <p className="text-white/80 text-xs truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Credits & Plan */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-sm p-4 space-y-3">
          <h2 className="font-bold text-sm text-purple-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
              <Coins className="w-3.5 h-3.5 text-purple-600" />
            </span>
            מנוי וקרדיטים
          </h2>

          <div className="flex gap-3">
            {/* Credits */}
            <button
              onClick={() => navigate("/upgrade")}
              className="flex-1 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100 hover:shadow-md transition-all text-center"
            >
              <p className="text-2xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                {totalCredits}
              </p>
              <p className="text-xs text-purple-600 font-medium mt-0.5">קרדיטים זמינים</p>
            </button>

            {/* Plan */}
            <div className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-100 text-center">
              <div className="flex justify-center">
                <Crown className={`w-6 h-6 ${isSubscriber ? "text-amber-500" : "text-purple-300"}`} />
              </div>
              <p className="text-xs font-bold mt-1 text-amber-800">
                {isSubscriber ? "Pro" : "חינמי"}
              </p>
              {!isSubscriber && (
                <button
                  onClick={() => navigate("/upgrade")}
                  className="text-[10px] text-purple-600 underline mt-0.5"
                >
                  שדרגו עכשיו
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Children */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-purple-800 flex items-center gap-2">
              <span className="w-6 h-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-purple-600" />
              </span>
              הילדים שלי
            </h2>
            <button
              onClick={() => navigate("/children")}
              className="text-xs text-purple-500 hover:text-purple-700 flex items-center gap-0.5 font-medium"
            >
              ניהול
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {children.length === 0 ? (
            <button
              onClick={() => navigate("/children")}
              className="w-full py-4 border-2 border-dashed border-purple-200 rounded-xl text-purple-400 text-sm hover:border-purple-400 hover:text-purple-600 transition-colors"
            >
              + הוסיפו ילד/ה
            </button>
          ) : (
            <div className="space-y-2">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-xl px-3 py-2.5 border border-purple-50"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{child.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        גיל {child.age} · טווח {AGE_RANGE_MAP[child.age] || `${child.age}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-purple-400">
                    {child.gender === "female" ? "גיבורה" : "גיבור"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Share & Earn */}
        <section className="bg-gradient-to-l from-purple-100/50 via-pink-50 to-orange-50 rounded-2xl p-4 border border-purple-200 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">הרוויחו סיפורים חינם 🎁</h3>
              <p className="text-[10px] text-muted-foreground">שתפו עם חברים וקבלו קרדיטים</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                shareToWhatsApp();
                trackEvent({ eventType: 'feature_used', metadata: { feature: 'share_whatsapp', source: 'profile' } });
              }}
              size="sm"
              className="flex-1 h-8 text-xs bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold"
            >
              וואטסאפ
            </Button>
            <Button 
              onClick={async () => {
                const success = await copyToClipboard();
                if (success) {
                  setCopied(true);
                  toast.success("הקישור הועתק!");
                  setTimeout(() => setCopied(false), 2000);
                  trackEvent({ eventType: 'feature_used', metadata: { feature: 'share_link_copied', source: 'profile' } });
                }
              }}
              variant="outline" 
              size="sm"
              className="flex-1 h-8 text-xs font-medium border-purple-200 hover:bg-purple-50"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span className="mr-1">{copied ? 'הועתק!' : 'העתק'}</span>
            </Button>
          </div>
          {shareCoins > 0 && (
            <Button 
              onClick={async () => {
                const success = await redeemCoin();
                if (success) {
                  toast.success("🎉 קיבלתם קרדיט סיפור נוסף!");
                  await refetchCredits();
                  trackEvent({ eventType: 'feature_used', metadata: { feature: 'coin_redeemed', source: 'profile' } });
                } else {
                  toast.error("לא הצלחנו להמיר את המטבע");
                }
              }}
              size="sm"
              className="w-full h-8 text-xs bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-bold"
            >
              🪙 {shareCoins} מטבעות - השתמשו!
            </Button>
          )}
        </section>

        {/* Quick action */}
        <button
          onClick={() => navigate("/create")}
          className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white rounded-2xl py-3 px-4 flex items-center justify-center gap-2 font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]"
        >
          <Sparkles className="w-5 h-5" />
          צרו סיפור חדש
        </button>
      </div>

      <MobileNavigation />
    </div>
  );
};

export default Profile;
