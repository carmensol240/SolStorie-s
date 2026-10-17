import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2, Coins } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import MobileNavigation from "@/components/MobileNavigation";
import HomeExplainer from "@/components/home/HomeExplainer";
import heroImage from "@/assets/topic-space-hero.jpg";

const Adventure = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { credits } = useCredits();
  const { shareCoins } = useReferral();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [storyCount, setStoryCount] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);

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
    <div id="main-content" className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-amber-50/50 to-background dark:from-background animate-fade-in" dir="rtl">
      {/* Hero: a real story illustration, the value line and the main CTA */}
      <header className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top,12px),16px)] pb-3">
        <h1 className="text-2xl font-black tracking-tight" dir="ltr">
          <span className="logo-rainbow">SolStorie's™</span>
        </h1>
        <button
          onClick={() => navigate(user ? "/upgrade" : "/auth")}
          className="flex items-center gap-1.5 min-h-[44px] rounded-full border border-border bg-card px-4 text-sm font-bold text-foreground hover:bg-muted transition-colors"
          aria-label={user ? `יש לך ${totalCredits} קרדיטים, לצפייה ולרכישה` : "התחברות"}
        >
          {user ? (
            <>
              <Coins className="w-4 h-4 text-primary" aria-hidden="true" />
              {totalCredits}
            </>
          ) : (
            "התחברות"
          )}
        </button>
      </header>

      <section className="px-5 flex flex-col gap-3 max-w-2xl w-full mx-auto">
        <div className="relative rounded-[28px] overflow-hidden shadow-xl h-[52dvh] min-h-[320px] max-h-[520px]">
          <img
            src={heroImage}
            alt="ילד בחליפת חלל מרחף בין כוכבים, איור מתוך סיפור"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-20 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-3xl font-black leading-tight">
              ספר מאויר שהילד שלכם הוא הגיבור שלו
            </p>
            <p className="text-white/90 text-base mt-2">
              עם השם, המראה והעולם של הילד, על הנושא שהכי חשוב לכם עכשיו
            </p>
          </div>
        </div>
        <button
          onClick={handleAdventureCTA}
          className="flex items-center justify-center gap-2.5 min-h-[56px] rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-lg active:scale-[0.98] transition-all"
        >
          <Wand2 className="w-5 h-5" aria-hidden="true" />
          יוצרים סיפור עכשיו
        </button>
        <p className="text-center text-sm text-muted-foreground">
          רואים את תחילת הסיפור בחינם, ומשלמים רק אם אוהבים
        </p>
      </section>
      <HomeExplainer />
      <MobileNavigation />
    </div>
  );
};

export default Adventure;
