import React, { useState, useEffect } from "react";
import { Wand2, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useChildAvatar } from "@/hooks/use-child-avatar";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import heroBackground from "@/assets/soli-tree-background.png";
import WelcomeGiftBanner from "./WelcomeGiftBanner";

interface LoggedInHomeProps {
  user: any;
  displayName: string | null;
}

const LoggedInHome = ({ user, displayName }: LoggedInHomeProps) => {
  const navigate = useNavigate();
  const { credits } = useCredits();
  const { shareCoins } = useReferral();
  const { avatarUrl } = useChildAvatar();
  const [storyCount, setStoryCount] = useState<number>(0);

  // Fetch story count for welcome banner logic
  useEffect(() => {
    const fetchStoryCount = async () => {
      if (!user?.id) return;
      
      const { count, error } = await supabase
        .from("stories")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      if (!error && count !== null) {
        setStoryCount(count);
      }
    };
    
    fetchStoryCount();
  }, [user?.id]);

  const totalCredits = (credits ?? 0) + shareCoins;

  return (
    <div className="flex-1 flex flex-col animate-fade-in relative -mx-4 -my-3">
      {/* Full-screen Background Image - Sol and the Tree theme - COVER entire screen */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ 
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          zIndex: -2
        }}
      />
      
      {/* Very subtle overlay for readability - mostly transparent */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ 
          background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.2) 100%)',
          zIndex: -1 
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
              className="flex items-center gap-2 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full px-4 py-2 hover:bg-white/30 transition-colors shadow-lg"
              aria-label="צפה בקרדיטים ושדרג"
            >
              <Coins className="w-5 h-5 text-amber-700" />
              <span className="font-bold text-amber-900 text-lg">{totalCredits}</span>
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

        {/* Welcome Gift Banner - shows only for new users */}
        <WelcomeGiftBanner credits={credits} storyCount={storyCount} />

        {/* Single Primary CTA Button - Proportional sizing, bottom-center, maximum transparency */}
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
    </div>
  );
};

export default LoggedInHome;
