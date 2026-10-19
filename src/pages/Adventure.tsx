import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2, Coins, Pause, Play, ChevronDown } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import MobileNavigation from "@/components/MobileNavigation";
import HomeExplainer from "@/components/home/HomeExplainer";
import heroVideo from "@/assets/hero-solstories-animation-new.mp4";
import heroPoster from "@/assets/hero-poster.jpg";

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
      <div className="relative w-full h-[92vh] h-[92svh] min-h-[540px] flex-shrink-0 overflow-hidden flex flex-col">
        {/* Video Background */}
        <video
          ref={videoRef}
          autoPlay={videoPlaying}
          loop
          muted
          playsInline
          poster={heroPoster}
          preload={videoPlaying ? "auto" : "metadata"}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover [object-position:center_35%]"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>

        {/* Soft dark gradients: top (title) and bottom (button) only */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 22%, transparent 36%, transparent 62%, rgba(0,0,0,0.65) 100%)",
          }}
        />

        {/* Top bar - credits & pause */}
        <div className="relative z-20 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top,12px),20px)]">
          <button
            onClick={() => navigate(user ? "/upgrade" : "/auth")}
            className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xl border border-white/30 rounded-full px-3 py-1.5 hover:bg-black/55 transition-colors"
            aria-label="צפה בקרדיטים ושדרג"
          >
            <Coins className="w-4 h-4 text-amber-300" />
            <span className="font-bold text-white text-sm drop-shadow-md">{totalCredits}</span>
          </button>
          <button
            type="button"
            onClick={() => setVideoPlaying((p) => !p)}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/40 text-white hover:bg-black/65 transition-colors"
            aria-label={videoPlaying ? "עצירת האנימציה" : "הפעלת האנימציה"}
            aria-pressed={!videoPlaying}
          >
            {videoPlaying ? <Pause className="w-5 h-5" aria-hidden="true" /> : <Play className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>

        {/* Top zone: logo + tagline */}
        <div className="relative z-10 flex flex-col items-center gap-1 px-4 pt-1 text-center">
          <h1
            className="leading-tight font-black tracking-tight"
            style={{ fontSize: "clamp(2.5rem, 11vw, 4.5rem)", fontFamily: "'Baloo 2', 'Heebo', sans-serif" }}
          >
            <span className="logo-rainbow">SolStorie's™</span>
          </h1>
          <p className="text-lg sm:text-xl font-bold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
            ספר מאויר שהילד שלכם הוא הגיבור שלו
          </p>
        </div>

        {/* Middle zone: free for the video */}
        <div className="flex-1" aria-hidden="true" />

        {/* Bottom zone: CTA + scroll hint */}
        <div className="relative z-10 flex flex-col items-center gap-1 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+76px)] md:pb-6">
          <button
            onClick={handleAdventureCTA}
            className="group flex items-center justify-center gap-2.5 rounded-full px-6 py-3 w-full max-w-[300px] bg-primary shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:scale-[1.03] active:scale-95 transition-all duration-300 adventure-cta-pulse border border-white/30"
          >
            <Wand2 className="w-5 h-5 text-white drop-shadow-md group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-black text-base text-white drop-shadow-md">
              יוצאים להרפתקה ✨
            </span>
          </button>
          <button
            type="button"
            onClick={() => document.getElementById("home-what")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="flex flex-col items-center text-white text-sm font-semibold min-h-[44px] px-3 pt-1 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]"
            aria-label="גללו למטה לגלות עוד על הסיפורים"
          >
            <span>גללו לגלות עוד</span>
            <ChevronDown className="w-6 h-6 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
          </button>
        </div>
      </div>
      <HomeExplainer />
      <MobileNavigation />
    </div>
  );
};

export default Adventure;
