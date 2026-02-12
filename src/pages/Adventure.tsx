import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2, Coins } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useChildAvatar } from "@/hooks/use-child-avatar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import heroBackground from "@/assets/hero-solstories-library.png";
import WelcomeGiftBanner from "@/components/home/WelcomeGiftBanner";
import MobileNavigation from "@/components/MobileNavigation";

const Adventure = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits } = useCredits();
  const { shareCoins } = useReferral();
  const { avatarUrl } = useChildAvatar();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [storyCount, setStoryCount] = useState<number>(0);

  // Show welcome toast for new users on first visit
  useEffect(() => {
    if (!user) return;
    const welcomeKey = `welcome_shown_${user.id}`;
    if (!sessionStorage.getItem(welcomeKey)) {
      sessionStorage.setItem(welcomeKey, "true");
      // Small delay so the page renders first
      const timer = setTimeout(() => {
        toast({
          title: "ברוכים הבאים! 🎉",
          description: "קיבלתם סיפור ראשון במתנה. בואו נתחיל ליצור קסם ✨",
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      setDisplayName(data?.display_name || user.email?.split('@')[0] || null);
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchStoryCount = async () => {
      if (!user?.id) return;
      const { count, error } = await supabase
        .from("stories")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (!error && count !== null) setStoryCount(count);
    };
    fetchStoryCount();
  }, [user?.id]);

  const totalCredits = (credits ?? 0) + shareCoins;

  return (
    <div className="min-h-[100dvh] flex flex-col relative" dir="rtl">
      {/* Background */}
      <div
        className="absolute inset-0 flex items-end justify-center"
      >
        <img 
          src={heroBackground} 
          alt="" 
          className="w-full h-full object-contain object-bottom"
        />
      </div>
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, transparent 30%, transparent 75%, rgba(0,0,0,0.15) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col px-4 pt-4">
        {/* Header - compact */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {avatarUrl && (
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/50 shadow">
                <img src={avatarUrl} alt="דמות הילד" className="w-full h-full object-cover" />
              </div>
            )}
            <button
              onClick={() => navigate("/upgrade")}
              className="flex items-center gap-1.5 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full px-3 py-1.5 hover:bg-white/30 transition-colors shadow"
              aria-label="צפה בקרדיטים ושדרג"
            >
              <Coins className="w-4 h-4 text-amber-700" />
              <span className="font-bold text-amber-900 text-sm">{totalCredits}</span>
            </button>
          </div>

          <div className="bg-black/40 backdrop-blur-xl rounded-full px-3 py-1.5 shadow border border-white/10">
            <h1 className="text-sm font-bold text-white">
              שלום, {displayName || user?.email?.split('@')[0] || "משתמש"} 👋
            </h1>
          </div>
        </header>

        <div className="flex-1" />

        <WelcomeGiftBanner credits={credits} storyCount={storyCount} />

        {/* Primary CTA Button - compact, positioned above the logo */}
        <div className="pb-[72px] flex justify-center px-6">
          <button
            onClick={() => navigate("/create")}
            className="group flex items-center justify-center gap-2.5 rounded-full px-6 py-3 max-w-[260px] bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:scale-[1.03] active:scale-95 transition-all duration-300 animate-[glow-pulse_2.5s_ease-in-out_infinite] border border-white/30"
          >
            <Wand2 className="w-5 h-5 text-white drop-shadow-md group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-black text-base text-white drop-shadow-md">יוצאים להרפתקה ✨</span>
          </button>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
};

export default Adventure;
