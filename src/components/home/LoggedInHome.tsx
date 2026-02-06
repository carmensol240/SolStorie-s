import React from "react";
import { Wand2, Coins, BookOpen, ArrowLeft, Gift, LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useChildAvatar } from "@/hooks/use-child-avatar";
import heroBackground from "@/assets/hero-child-reading.jpg";

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

  // Action Cards
  const actionCards: Array<{
    icon: LucideIcon;
    title: string;
    description: string;
    path: string;
    iconBg: string;
    iconColor: string;
  }> = [
    {
      icon: Wand2,
      title: "יוצאים להרפתקה חדשה",
      description: "סיפור מותאם אישית לילד שלך",
      path: "/create",
      iconBg: "bg-gradient-to-br from-[#F5E6D3] to-[#E8D5C4]",
      iconColor: "text-[#5D3A1A]",
    },
    {
      icon: BookOpen,
      title: "הספרייה הקסומה שלי",
      description: "צפה בכל הסיפורים שיצרת",
      path: "/library",
      iconBg: "bg-gradient-to-br from-[#FAF3E8] to-[#F5E6D3]",
      iconColor: "text-[#6B4423]",
    },
    {
      icon: Gift,
      title: "הרויחו סיפורים חינם",
      description: "הזמינו חברים וקבלו קרדיטים",
      path: "/upgrade",
      iconBg: "bg-gradient-to-br from-[#E8D5C4] to-[#D4C4B0]",
      iconColor: "text-[#8B5A2B]",
    },
  ];

  return (
    <div className="flex-1 flex flex-col animate-fade-in relative">
      {/* Full-screen Background Image */}
      <div 
        className="absolute inset-0 -mx-4 -mt-3 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${heroBackground})`,
          marginBottom: '-4rem'
        }}
      >
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header - Greeting on Right, Credits on Left (RTL) with more padding */}
        <header className="flex items-center justify-between mb-4 px-2 pt-2">
          {/* Left side: Credits + Avatar - larger size with natural tones */}
          <div className="flex items-center gap-3">
            {avatarUrl && (
              <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-[#8B5A2B] shadow-lg">
                <img 
                  src={avatarUrl} 
                  alt="דמות הילד" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <button 
              onClick={() => navigate("/upgrade")}
              className="flex items-center gap-2 bg-[#FAF3E8]/95 backdrop-blur-sm border-2 border-[#D4A574] rounded-full px-5 py-3 hover:bg-[#F5E6D3] transition-colors shadow-lg"
              aria-label="צפה בקרדיטים ושדרג"
            >
              <span className="flex items-center justify-center">
                <Coins className="w-7 h-7 text-[#8B5A2B]" />
              </span>
              <span className="font-bold text-[#5D3A1A] text-2xl">{totalCredits}</span>
            </button>
          </div>
          {/* Right side: Greeting - natural theme */}
          <div className="bg-[#5D3A1A]/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <h1 className="text-2xl font-black text-[#FAF3E8] drop-shadow-md">
              שלום, {displayName || user?.email?.split('@')[0] || "משתמש"} 👋
            </h1>
          </div>
        </header>

        {/* Spacer to push content to bottom */}
        <div className="flex-1" />

        {/* Child Avatar - Above Action Cards - Enlarged with earth-tone border */}
        {avatarUrl && (
          <div className="flex justify-center mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#8B5A2B] shadow-2xl shadow-black/30">
              <img 
                src={avatarUrl} 
                alt="דמות הילד" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Action Cards - Natural Glassmorphism style */}
        <div className="space-y-3 pb-4">
          {actionCards.map((card, index) => {
            const CardIcon = card.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(card.path)}
                className="w-full flex items-center gap-4 bg-[#FAF3E8]/85 backdrop-blur-md rounded-2xl p-4 shadow-lg shadow-black/15 border border-[#D4A574]/40 hover:bg-[#F5E6D3]/90 hover:shadow-xl hover:shadow-black/20 hover:scale-[1.01] transition-all text-right"
              >
                <div className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <span className="flex items-center justify-center">
                    <CardIcon className={`w-7 h-7 ${card.iconColor}`} />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-lg text-[#3D2914]">{card.title}</h3>
                  <p className="text-sm text-[#6B4423]">{card.description}</p>
                </div>
                <span className="flex items-center justify-center flex-shrink-0">
                  <ArrowLeft className="w-5 h-5 text-[#8B5A2B]" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LoggedInHome;
