import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2, Coins, Pause, Play } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import MobileNavigation from "@/components/MobileNavigation";
import HomeExplainer from "@/components/home/HomeExplainer";
import heroVideo from "@/assets/hero-solstories-animation-new.mp4";

const Adventure = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { credits } = useCredits();
  const { shareCoins } = useReferral();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [storyCount, setStoryCount] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  // Hero video: respects the OS "reduce motion" setting and can be paused
  // (accessibility: moving content longer than 5 seconds needs a pause control).
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(() => {
    try {
      return (
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        !document.documentElement.classList.contains("reduced-motion")
      );
    } catch {
      return true;
    }
  });
  // Follow the site's own "עצירת אנימציות" accessibility switch too.
  useEffect(() => {
    const root = document.documentElement;
    const obs = new MutationObserver(() => {
      if (root.classList.contains("reduced-motion")) setVideoPlaying(false);
    });
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (videoPlaying) v.play().catch(() => {});
    else v.pause();
  }, [videoPlaying]);

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!error && data) setIsAdmin(true);
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


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
        .eq("user_id", user.id)
        .or("generation_status.is.null,generation_status.not.in.(generating,failed)");
      if (count !== null) setStoryCount(count);
    };
    fetchCount();
  }, [user?.id]);


  const handleAdventureCTA = useCallback(() => {
    navigate("/create");
  }, [navigate]);

  const totalCredits = (credits ?? 0) + shareCoins;

  return (
    <div id="main-content" className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-amber-50/50 to-background dark:from-background animate-fade-in" dir="rtl">
      {/* Hero Video Section */}
      <div className="relative w-full h-[100dvh] flex-shrink-0 overflow-hidden">
        {/* Video Background */}
        <video
          ref={videoRef}
          autoPlay={videoPlaying}
          loop
          muted
          playsInline
          aria-hidden="true"
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

        {/* SolStorie's™ Title */}
        <div className="absolute top-16 sm:top-20 left-0 right-0 z-10 flex justify-center px-4">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black logo-3d-bubble tracking-tight">
            <span className="logo-rainbow">SolStorie's™</span>
          </h1>
        </div>
        <p className="absolute top-36 sm:top-44 left-0 right-0 z-10 px-6 text-center text-lg sm:text-xl font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
          ספר מאויר שהילד שלכם הוא הגיבור שלו
        </p>

        {/* Top bar - Glassmorphism credits & profile */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top,12px),24px)] pb-2">
          <button
            onClick={() => navigate(user ? "/upgrade" : "/auth")}
            className="flex items-center gap-1.5 bg-white/15 backdrop-blur-xl border border-white/20 rounded-full px-3 py-1.5 hover:bg-white/25 transition-colors"
            aria-label="צפה בקרדיטים ושדרג"
          >
            <Coins className="w-4 h-4 text-amber-300" />
            <span className="font-bold text-white text-sm drop-shadow-md">{totalCredits}</span>
          </button>
        </div>

        {/* Pause / play the background video */}
        <button
          type="button"
          onClick={() => setVideoPlaying((p) => !p)}
          className="absolute z-20 left-4 top-[max(env(safe-area-inset-top,12px),24px)] flex items-center justify-center w-11 h-11 rounded-full bg-black/30 backdrop-blur-md border border-white/30 text-white hover:bg-black/45 transition-colors"
          aria-label={videoPlaying ? "עצירת סרטון הרקע" : "הפעלת סרטון הרקע"}
          aria-pressed={!videoPlaying}
        >
          {videoPlaying ? <Pause className="w-5 h-5" aria-hidden="true" /> : <Play className="w-5 h-5" aria-hidden="true" />}
        </button>
        {/* Bottom section - CTA & Welcome banner */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-3 px-4 pb-[96px]">

          <button
            onClick={handleAdventureCTA}
            className="group flex items-center justify-center gap-2.5 rounded-full px-6 py-3 w-full max-w-[300px] bg-primary shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:scale-[1.03] active:scale-95 transition-all duration-300 adventure-cta-pulse border border-white/30"
          >
            <Wand2 className="w-5 h-5 text-white drop-shadow-md group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-black text-base text-white drop-shadow-md">
              יוצאים להרפתקה ✨
            </span>
          </button>

        </div>
      </div>
      <HomeExplainer />
      <MobileNavigation />
    </div>
  );
};

export default Adventure;
