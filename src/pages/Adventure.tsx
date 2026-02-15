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
      {/* Background - full bleed cover, object-center to show characters & title */}
      <img
        src={heroBackground}
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Very subtle vignette - only at very bottom for CTA readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, transparent 65%, rgba(0,0,0,0.4) 85%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {/* Credits pill - top left, small and transparent */}
      <div className="absolute top-12 left-4 z-20">
        <button
          onClick={() => navigate("/upgrade")}
          className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md border border-white/20 rounded-full px-2.5 py-1 hover:bg-black/40 transition-colors"
          aria-label="צפה בקרדיטים ושדרג"
        >
          <Coins className="w-3.5 h-3.5 text-amber-300" />
          <span className="font-bold text-white/90 text-xs">{totalCredits}</span>
        </button>
      </div>

      {/* Greeting pill - top right, small and transparent */}
      <div className="absolute top-12 right-4 z-20">
        <div className="flex items-center gap-2 bg-black/25 backdrop-blur-md border border-white/20 rounded-full px-3 py-1">
          {avatarUrl && (
            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40">
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <span
            className="text-xs font-bold text-white/90"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
          >
            שלום, {displayName || user?.email?.split("@")[0] || "משתמש"} 👋
          </span>
        </div>
      </div>

      {/* Spacer - lets the image characters and title show fully */}
      <div className="flex-1" />

      {/* Bottom CTA area - compact, centered, above nav */}
      <div className="relative z-10 flex flex-col items-center px-5 pb-[72px]">
        <WelcomeGiftBanner credits={credits} storyCount={storyCount} />

        <p
          className="text-white text-sm font-bold mb-2 text-center animate-fade-in"
          style={{ textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}
        >
          ברוכים הבאים לעולמה הקסום של סול ✨
        </p>

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
