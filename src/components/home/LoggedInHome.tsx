import React, { useState, useEffect } from "react";
import { Wand2, Coins, X, GraduationCap, Palette, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useChildAvatar } from "@/hooks/use-child-avatar";
import { useAuth } from "@/hooks/use-auth";
import { useColoringCredits } from "@/hooks/use-coloring-credits";
import { useEditingCredits } from "@/hooks/use-editing-credits";
import { supabase } from "@/integrations/supabase/client";
import heroBackground from "@/assets/hero-children-flying-sky.jpg";
import WelcomeGiftBanner from "./WelcomeGiftBanner";
import { getUserData, setUserData } from "@/lib/user-storage";

interface LoggedInHomeProps {
  user: any;
  displayName: string | null;
}

const LoggedInHome = ({ user, displayName }: LoggedInHomeProps) => {
  const navigate = useNavigate();
  const { credits } = useCredits();
  const { shareCoins } = useReferral();
  const { avatarUrl } = useChildAvatar();
  const { coloringCredits } = useColoringCredits();
  const { editingCredits } = useEditingCredits();
  const [storyCount, setStoryCount] = useState<number>(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showEducatorBanner, setShowEducatorBanner] = useState(true);

  // Check user-scoped localStorage for dismissed state
  useEffect(() => {
    const dismissed = getUserData(user?.id, 'educator_welcome_dismissed');
    if (dismissed === 'true') setShowEducatorBanner(false);
  }, [user?.id]);

  // Fetch story count and user_role
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      const [storiesRes, profileRes] = await Promise.all([
        supabase.from("stories").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profiles").select("user_role").eq("id", user.id).maybeSingle(),
      ]);
      
      if (!storiesRes.error && storiesRes.count !== null) setStoryCount(storiesRes.count);
      if (profileRes.data?.user_role) setUserRole(profileRes.data.user_role);
    };
    fetchData();
  }, [user?.id]);

  const totalCredits = (credits ?? 0) + shareCoins;
  const showWelcomeBanner = credits === 1 && storyCount === 0;
  const isEducator = userRole === 'educator';

  const dismissEducatorBanner = () => {
    setShowEducatorBanner(false);
    setUserData(user?.id, 'educator_welcome_dismissed', 'true');
  };

  return (
    <div className="flex-1 flex flex-col animate-fade-in relative -mx-4 -my-3">
      {/* Background Image - absolute within section */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Very subtle overlay for readability */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.2) 100%)',
        }} 
      />

      {/* Content Container */}
      <div className="relative z-10 flex-1 flex flex-col px-4 pt-4">
        {/* Header - Greeting on Right, Credits on Left (RTL) */}
        <header className="flex items-center justify-between">
          {/* Left side: Credits pill with avatar thumbnail */}
          <div className="flex items-center gap-2">
            {avatarUrl && (
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 shadow-lg">
                <img 
                  src={avatarUrl} 
                  alt="דמות הילד" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <button 
              onClick={() => navigate("/upgrade")}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full px-5 py-2.5 hover:bg-white/30 transition-colors shadow-lg"
              aria-label="צפה בקרדיטים ושדרג"
            >
              <Coins className="w-6 h-6 text-amber-700" />
              <span className="font-bold text-amber-900 text-lg">{totalCredits}</span>
            </button>
            <button 
              onClick={() => navigate("/upgrade")}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full px-5 py-2.5 hover:bg-white/30 transition-colors shadow-lg"
              aria-label="קרדיטי צביעה"
            >
              <Palette className="w-6 h-6 text-purple-400" />
              <span className="font-bold text-purple-100 text-lg">{coloringCredits}</span>
            </button>
            <button 
              onClick={() => navigate("/upgrade")}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full px-5 py-2.5 hover:bg-white/30 transition-colors shadow-lg"
              aria-label="קרדיטי עריכה"
            >
              <Pencil className="w-6 h-6 text-green-400" />
              <span className="font-bold text-green-100 text-lg">{editingCredits}</span>
            </button>
          </div>

          {/* Right side: Greeting pill - more transparent */}
          <div className="bg-black/40 backdrop-blur-xl rounded-full px-5 py-2.5 shadow-lg border border-white/10">
            <h1 className="text-lg font-bold text-white">
              שלום, {displayName || user?.email?.split('@')[0] || "משתמש"} 👋
            </h1>
          </div>
        </header>

        {/* Spacer to push content to bottom */}
        <div className="flex-1" />

        {/* Educator Welcome Banner */}
        {isEducator && showEducatorBanner && (
          <div className="mx-4 mb-4 relative overflow-hidden rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 p-4 shadow-lg">
            <button
              onClick={dismissEducatorBanner}
              className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-colors"
              aria-label="סגור"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <p className="text-white font-bold text-sm leading-relaxed pr-2">
                ברוכה הבאה לנבחרת המחנכות של <span dir="ltr" className="inline-block">SolStorie's™</span>! כפי שהובטח, 2 סיפורים לדוגמא מחכים לך בחשבון. אל תשכחי לבדוק את החבילות המיוחדות עבורך — כולל החבילה המקצועית של 10 סיפורים ב-199 ש״ח. 🎓
              </p>
            </div>
          </div>
        )}

        {/* Welcome Gift Banner - shows only for new users */}
        <WelcomeGiftBanner credits={credits} storyCount={storyCount} />

        {/* Primary CTA Button - only shown when welcome banner is NOT visible */}
        {!showWelcomeBanner && (
          <div className="pb-24 flex justify-center px-6">
            <button
              onClick={() => navigate("/create")}
              className="group flex items-center justify-center gap-4 rounded-[2rem] px-6 py-5 sm:px-10 md:px-14 md:py-6 w-full max-w-full sm:max-w-[380px] bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 shadow-[0_0_30px_rgba(251,191,36,0.4),0_0_60px_rgba(251,146,60,0.2)] hover:shadow-[0_0_40px_rgba(251,191,36,0.6),0_0_80px_rgba(251,146,60,0.3)] hover:scale-[1.04] active:scale-95 transition-all duration-300 animate-[glow-pulse_2.5s_ease-in-out_infinite] border-2 border-white/30"
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
        )}
      </div>
    </div>
  );
};

export default LoggedInHome;
