import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2, Coins, Pause, Play, ChevronDown, Volume2, VolumeX } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import MobileNavigation from "@/components/MobileNavigation";
import HomeExplainer from "@/components/home/HomeExplainer";
import heroVideoAsset from "@/assets/hero-noam-land.mp4.asset.json";
import heroPosterAsset from "@/assets/hero-noam-land-poster.jpg.asset.json";

const heroVideo = heroVideoAsset.url;
const heroPoster = heroPosterAsset.url;
const HERO_VIDEO_LABEL =
  "סרטון קצר: צילום של ילד הופך לדמות מצוירת ולגיבור של ספר מאויר, עם דפי צביעה מהסיפור";


const Adventure = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { credits } = useCredits();
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
  const [soundOn, setSoundOn] = useState(false);
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = !soundOn;
  }, [soundOn]);
  const toggleSound = () => {
    const next = !soundOn;
    const v = videoRef.current;
    if (v) v.muted = !next;
    setSoundOn(next);
    if (next && !videoPlaying) setVideoPlaying(true);
  };

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

  const totalCredits = (credits ?? 0);

  return (
    <div id="main-content" className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-amber-50/50 to-background dark:from-background animate-fade-in" dir="rtl">
      {/* Hero Section: header above, landscape 16:9 video in the middle, CTA below.
          On desktop the section is exactly one screen tall so the whole frame
          (logo + title above, buttons below) is visible without scrolling.
          On phone the video sits at its natural 16:9 height and the page flows on. */}
      <div className="relative w-full flex-shrink-0 flex flex-col md:h-[100dvh] md:min-h-[560px]">
        {/* Top bar - credits, sound & pause */}
        <div className="relative z-20 shrink-0 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top,12px),20px)]">
          <button
            onClick={() => navigate(user ? "/upgrade" : "/auth")}
            className="flex items-center gap-1.5 bg-foreground/70 backdrop-blur-xl border border-background/30 rounded-full px-3 py-1.5 hover:bg-foreground/80 transition-colors"
            aria-label="צפה בקרדיטים ושדרג"
          >
            <Coins className="w-4 h-4 text-amber-300" />
            <span className="font-bold text-background text-sm">{totalCredits}</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              className="flex items-center gap-1.5 h-11 px-3 rounded-full bg-foreground/70 backdrop-blur-md border border-background/40 text-background text-sm font-semibold hover:bg-foreground/80 transition-colors"
              aria-label={soundOn ? "השתקה" : "הפעלת קול"}
              aria-pressed={soundOn}
            >
              {soundOn ? <Volume2 className="w-5 h-5" aria-hidden="true" /> : <VolumeX className="w-5 h-5" aria-hidden="true" />}
              <span>{soundOn ? "השתקה" : "הפעלת קול"}</span>
            </button>
            <button
              type="button"
              onClick={() => setVideoPlaying((p) => !p)}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-foreground/70 backdrop-blur-md border border-background/40 text-background hover:bg-foreground/80 transition-colors"
              aria-label={videoPlaying ? "עצירת האנימציה" : "הפעלת האנימציה"}
              aria-pressed={!videoPlaying}
            >
              {videoPlaying ? <Pause className="w-5 h-5" aria-hidden="true" /> : <Play className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Logo + tagline (above the video, never on top of it) */}
        <div className="relative z-10 shrink-0 flex flex-col items-center gap-1 px-4 pt-1 pb-3 text-center">
          <h1
            className="leading-tight font-black tracking-tight"
            style={{ fontSize: "clamp(2.5rem, 11vw, 4.5rem)", fontFamily: "'Baloo 2', 'Heebo', sans-serif" }}
          >
            <span className="logo-rainbow">SolStorie's™</span>
          </h1>
          <p className="-mt-1 text-sm font-semibold text-muted-foreground">
            עולמה הקסום של סול
          </p>
          <p className="text-lg sm:text-xl font-bold text-foreground">
            ספר מאויר שהילד שלכם הוא הגיבור שלו
          </p>
        </div>

        {/* Landscape 16:9 video, never cropped (object-contain).
            On phone it keeps its natural 16:9 height at full screen width, so
            there is no empty band above or below it. On desktop it takes exactly
            the space left on screen, and the blurred poster fills the sides
            whenever the 16:9 frame is wider than the space available. */}
        <div className="relative w-full aspect-video shrink-0 overflow-hidden md:aspect-auto md:flex-1 md:min-h-0">
          <div
            className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-60"
            style={{ backgroundImage: `url(${heroPoster})` }}
            aria-hidden="true"
          />
          <video
            ref={videoRef}
            autoPlay={videoPlaying}
            loop
            muted
            playsInline
            poster={heroPoster}
            preload="metadata"
            aria-label={HERO_VIDEO_LABEL}
            className="absolute inset-0 w-full h-full object-contain"
            onPause={() => { if (videoRef.current && !videoRef.current.ended) setVideoPlaying(false); }}
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
        </div>
        <p className="sr-only">{HERO_VIDEO_LABEL}</p>

        {/* CTA + scroll hint (below the video) */}
        <div className="relative z-10 shrink-0 flex flex-col items-center gap-1 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+76px)] md:pb-6">
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
            className="flex flex-col items-center text-foreground text-sm font-semibold min-h-[44px] px-3 pt-1"
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
