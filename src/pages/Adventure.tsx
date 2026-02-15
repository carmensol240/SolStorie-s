import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2, Coins } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useChildAvatar } from "@/hooks/use-child-avatar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import heroBackground from "@/assets/hero-solstories-welcome.png";
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

  // Always open at top of page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Show welcome toast for new users on first visit
  useEffect(() => {
    if (!user) return;
    const welcomeKey = `welcome_shown_${user.id}`;
    if (!sessionStorage.getItem(welcomeKey)) {
      sessionStorage.setItem(welcomeKey, "true");
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
    <div className="h-[100dvh] relative overflow-hidden flex flex-col" dir="rtl">
      {/* Background - full bleed cover */}
      <img
        src={heroBackground}
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-top"
      />
      {/* Gradient overlay - stronger at bottom for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, transparent 55%, rgba(0,0,0,0.35) 75%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Header - floating over image with safe top padding */}
      <header className="relative z-20 flex items-center justify-between px-5 pt-12 pb-2">
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
          <h1
            className="text-sm font-bold text-white"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
          >
            שלום, {displayName || user?.email?.split("@")[0] || "משתמש"} 👋
          </h1>
        </div>
      </header>

      {/* Spacer - lets the image characters show */}
      <div className="flex-1" />

      {/* Bottom content - CTA area over dark gradient */}
      <div className="relative z-10 flex flex-col items-center px-5 pb-20">
        <WelcomeGiftBanner credits={credits} storyCount={storyCount} />

        {/* Welcome message */}
        <p
          className="text-white text-sm font-bold mb-3 animate-fade-in text-center"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
        >
          ברוכים הבאים לעולמה הקסום של סול ✨
        </p>

        {/* Primary CTA Button */}
        <button
          onClick={() => navigate("/create")}
          className="group flex items-center justify-center gap-2.5 rounded-full px-6 py-3 max-w-[260px] bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:scale-[1.03] active:scale-95 transition-all duration-300 animate-[glow-pulse_2.5s_ease-in-out_infinite] border border-white/30"
        >
          <Wand2 className="w-5 h-5 text-white drop-shadow-md group-hover:rotate-12 transition-transform duration-300" />
          <span className="font-black text-base text-white drop-shadow-md">
            יוצאים להרפתקה ✨
          </span>
        </button>
      </div>

      <MobileNavigation />
    </div>
  );
};

export default Adventure;
