import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2, Coins } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import WelcomeGiftBanner from "@/components/home/WelcomeGiftBanner";
import MobileNavigation from "@/components/MobileNavigation";
import heroVideo from "@/assets/hero-solstories-animation-new.mp4";

const Adventure = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { credits } = useCredits();
  const { shareCoins } = useReferral();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [storyCount, setStoryCount] = useState<number>(0);
  


  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  useEffect(() => {
    if (!user) return;
    const welcomeKey = `welcome_shown_${user.id}`;
    if (!sessionStorage.getItem(welcomeKey)) {
      sessionStorage.setItem(welcomeKey, "true");
      const timer = setTimeout(() => {
        toast({
          title: "ברוכים הבאים! 🎉",
          description: "קיבלתם סיפור לדוגמא. בואו נתחיל ליצור קסם ✨",
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
      setDisplayName(data?.display_name || user.email?.split("@")[0] || null);
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchCount = async () => {
      if (!user?.id) return;
      const { count } = await supabase
        .from("stories")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (count !== null) setStoryCount(count);
    };
    fetchCount();
  }, [user?.id]);


  const handleAdventureCTA = useCallback(() => {
    navigate("/create");
  }, [navigate]);

  const totalCredits = (credits ?? 0) + shareCoins;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-amber-50/50 to-background animate-fade-in" dir="rtl">
      {/* Hero Video Section */}
      <div className="relative w-full h-[100dvh] flex-shrink-0 overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>

        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 40%, transparent 50%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        {/* Glow shimmer overlay */}
        <div
          className="absolute inset-0 pointer-events-none animate-pulse"
          style={{
            background: "radial-gradient(ellipse at 50% 60%, rgba(255,200,100,0.08) 0%, transparent 60%)",
            animationDuration: "4s",
          }}
        />

        {/* Floating sparkle particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute rounded-full float-up-particle"
              style={{
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
                left: `${5 + Math.random() * 90}%`,
                bottom: `${-5 + Math.random() * 10}%`,
                background: i % 3 === 0
                  ? "rgba(255,215,0,0.8)"
                  : i % 3 === 1
                  ? "rgba(255,255,255,0.7)"
                  : "rgba(255,180,220,0.7)",
                boxShadow: `0 0 ${4 + Math.random() * 4}px rgba(255,215,0,0.5)`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${6 + Math.random() * 6}s`,
              }}
            />
          ))}
        </div>

        {/* SolStorie's™ Title */}
        <div className="absolute top-20 left-0 right-0 z-10 flex justify-center">
          <h1 className="text-3xl sm:text-4xl font-black logo-3d-bubble">
            <span className="logo-rainbow">SolStorie's™</span>
          </h1>
        </div>

        {/* Top bar - Glassmorphism credits & profile */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top,12px),24px)] pb-2">
          <button
            onClick={() => navigate("/upgrade")}
            className="flex items-center gap-1.5 bg-white/15 backdrop-blur-xl border border-white/20 rounded-full px-3 py-1.5 hover:bg-white/25 transition-colors"
            aria-label="צפה בקרדיטים ושדרג"
          >
            <Coins className="w-4 h-4 text-amber-300" />
            <span className="font-bold text-white text-xs drop-shadow-md">{totalCredits}</span>
          </button>
        </div>

        {/* Bottom section - CTA & Welcome banner */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-3 px-4 pb-[72px]">
          {/* Spinning Gold Coin */}
          <div className="flex flex-col items-center gap-1">
            <div style={{ perspective: "800px" }}>
              <div
                className="gold-coin relative w-20 h-20 rounded-full flex items-center justify-center border-2 border-yellow-300/60"
                style={{
                  background: "radial-gradient(circle at 35% 35%, #ffe066, #f5a623 40%, #c87f0a 80%, #a56200)",
                }}
              >
                <span className="font-black text-[11px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] leading-tight text-center pointer-events-none" style={{ textShadow: "0 0 6px rgba(255,215,0,0.6)" }}>
                  סיפור<br/>לדוגמא ✨
                </span>
              </div>
            </div>
          </div>

          <WelcomeGiftBanner credits={credits} storyCount={storyCount} />

          <p className="text-white text-sm font-bold drop-shadow-md text-center">
            ✨ סיפורים מותאמים אישית עם הילד שלך כגיבור ⭐
          </p>

          <button
            onClick={handleAdventureCTA}
            className="group flex items-center justify-center gap-2.5 rounded-full px-6 py-3 w-full max-w-[300px] bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:scale-[1.03] active:scale-95 transition-all duration-300 adventure-cta-pulse border border-white/30"
          >
            <Wand2 className="w-5 h-5 text-white drop-shadow-md group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-black text-base text-white drop-shadow-md">
              יוצאים להרפתקה ✨
            </span>
          </button>

        </div>
      </div>

      <MobileNavigation />
    </div>
  );
};

export default Adventure;
