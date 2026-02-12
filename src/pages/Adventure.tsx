import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2, Coins } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useChildAvatar } from "@/hooks/use-child-avatar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import heroBackground from "@/assets/hero-children-flying-sky.jpg";
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
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.2) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col px-4 pt-4">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {avatarUrl && (
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 shadow-lg">
                <img src={avatarUrl} alt="דמות הילד" className="w-full h-full object-cover" />
              </div>
            )}
            <button
              onClick={() => navigate("/upgrade")}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full px-4 py-2 hover:bg-white/30 transition-colors shadow-lg"
              aria-label="צפה בקרדיטים ושדרג"
            >
              <Coins className="w-5 h-5 text-amber-700" />
              <span className="font-bold text-amber-900 text-lg">{totalCredits}</span>
            </button>
          </div>

          <div className="bg-black/40 backdrop-blur-xl rounded-full px-5 py-2.5 shadow-lg border border-white/10">
            <h1 className="text-lg font-bold text-white">
              שלום, {displayName || user?.email?.split('@')[0] || "משתמש"} 👋
            </h1>
          </div>
        </header>

        <div className="flex-1" />

        <WelcomeGiftBanner credits={credits} storyCount={storyCount} />

        {/* Primary CTA Button - Large, glowing, magical */}
        <div className="pb-24 flex justify-center px-6">
          <button
            onClick={() => navigate("/create")}
            className="group flex items-center justify-center gap-4 rounded-[2rem] px-10 py-5 md:px-14 md:py-6 w-full max-w-[380px] bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 shadow-[0_0_30px_rgba(251,191,36,0.4),0_0_60px_rgba(251,146,60,0.2)] hover:shadow-[0_0_40px_rgba(251,191,36,0.6),0_0_80px_rgba(251,146,60,0.3)] hover:scale-[1.04] active:scale-95 transition-all duration-300 animate-[glow-pulse_2.5s_ease-in-out_infinite] border-2 border-white/30"
          >
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white/25 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform duration-300">
              <Wand2 className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-md" />
            </div>
            <div className="text-right">
              <h3 className="font-black text-xl md:text-2xl text-white drop-shadow-md">יוצאים להרפתקה</h3>
              <p className="text-sm md:text-base text-white/80 font-medium">סיפור מותאם אישית ✨</p>
            </div>
          </button>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
};

export default Adventure;
