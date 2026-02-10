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
          backgroundPosition: 'center',
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

        {/* CTA */}
        <div className="pb-24 flex justify-center px-4">
          <button
            onClick={() => navigate("/create")}
            className="logged-in-action-box flex items-center justify-center gap-3 rounded-2xl px-6 py-3 md:px-8 md:py-4 hover:scale-[1.02] transition-all w-full max-w-[280px]"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <Wand2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="text-right">
              <h3 className="font-black text-base md:text-lg bg-gradient-to-r from-purple-700 via-pink-600 to-orange-500 bg-clip-text text-transparent">יוצאים להרפתקה</h3>
              <p className="text-xs md:text-sm text-purple-900/70">סיפור מותאם אישית ✨</p>
            </div>
          </button>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
};

export default Adventure;
