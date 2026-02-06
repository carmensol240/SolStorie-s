import React from "react";
import { Wand2, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useChildAvatar } from "@/hooks/use-child-avatar";
import heroBackground from "@/assets/soli-tree-background.png";

interface LoggedInHomeProps {
  user: any;
  displayName: string | null;
}

const LoggedInHome = ({ user, displayName }: LoggedInHomeProps) => {
  const navigate = useNavigate();
  const { credits } = useCredits();
  const { shareCoins } = useReferral();
  const { avatarUrl } = useChildAvatar();

  const totalCredits = (credits ?? 0) + shareCoins;

  return (
    <div className="flex-1 flex flex-col animate-fade-in relative">
      {/* Full-screen Background Image - Sol and the Tree theme */}
      <div 
        className="absolute inset-0 -mx-4 -mt-3 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${heroBackground})`,
          marginBottom: '-4rem'
        }}
      >
        {/* Subtle gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header - Greeting on Right, Credits on Left (RTL) */}
        <header className="flex items-center justify-between px-2 pt-3">
          {/* Left side: Credits pill with avatar thumbnail */}
          <div className="flex items-center gap-2">
            {avatarUrl && (
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#D4A574] shadow-md">
                <img 
                  src={avatarUrl} 
                  alt="דמות הילד" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <button 
              onClick={() => navigate("/upgrade")}
              className="flex items-center gap-2 bg-[#FAF3E8]/90 backdrop-blur-sm border-2 border-[#D4A574] rounded-full px-4 py-2 hover:bg-[#F5E6D3] transition-colors shadow-md"
              aria-label="צפה בקרדיטים ושדרג"
            >
              <Coins className="w-5 h-5 text-[#8B5A2B]" />
              <span className="font-bold text-[#5D3A1A] text-lg">{totalCredits}</span>
            </button>
          </div>

          {/* Right side: Greeting pill */}
          <div className="bg-[#5D3A1A]/85 backdrop-blur-sm rounded-full px-5 py-2.5 shadow-md">
            <h1 className="text-lg font-bold text-[#FAF3E8]">
              שלום, {displayName || user?.email?.split('@')[0] || "משתמש"} 👋
            </h1>
          </div>
        </header>

        {/* Spacer to push CTA to bottom-center area */}
        <div className="flex-1" />

        {/* Single Primary CTA Button - Centered at bottom */}
        <div className="pb-8 px-4">
          <button
            onClick={() => navigate("/create")}
            className="w-full flex items-center justify-center gap-4 bg-gradient-to-r from-[#8B5A2B] to-[#6B4423] rounded-2xl p-5 shadow-xl shadow-black/30 border-2 border-[#D4A574]/50 hover:from-[#9B6A3B] hover:to-[#7B5433] hover:shadow-2xl hover:scale-[1.02] transition-all"
          >
            <div className="w-12 h-12 bg-[#FAF3E8]/20 rounded-xl flex items-center justify-center">
              <Wand2 className="w-7 h-7 text-[#FAF3E8]" />
            </div>
            <div className="text-right">
              <h3 className="font-black text-xl text-[#FAF3E8]">יוצאים להרפתקה חדשה</h3>
              <p className="text-sm text-[#F5E6D3]/80">סיפור מותאם אישית לילד שלך ✨</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoggedInHome;
