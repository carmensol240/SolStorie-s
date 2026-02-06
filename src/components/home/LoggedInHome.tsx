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
      iconBg: "bg-gradient-to-br from-purple-100 to-purple-200",
      iconColor: "text-purple-600",
    },
    {
      icon: BookOpen,
      title: "הספרייה הקסומה שלי",
      description: "צפה בכל הסיפורים שיצרת",
      path: "/library",
      iconBg: "bg-gradient-to-br from-amber-100 to-amber-200",
      iconColor: "text-amber-600",
    },
    {
      icon: Gift,
      title: "הרויחו סיפורים חינם",
      description: "הזמינו חברים וקבלו קרדיטים",
      path: "/upgrade",
      iconBg: "bg-gradient-to-br from-emerald-100 to-emerald-200",
      iconColor: "text-emerald-600",
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
          {/* Left side: Credits + Avatar - larger size */}
          <div className="flex items-center gap-3">
            {avatarUrl && (
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg">
                <img 
                  src={avatarUrl} 
                  alt="דמות הילד" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <button 
              onClick={() => navigate("/upgrade")}
              className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-5 py-3 hover:bg-white transition-colors shadow-lg"
              aria-label="צפה בקרדיטים ושדרג"
            >
              <span className="flex items-center justify-center">
                <Coins className="w-6 h-6 text-amber-500" />
              </span>
              <span className="font-bold text-amber-700 text-xl">{totalCredits}</span>
            </button>
          </div>
          {/* Right side: Greeting - larger font */}
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <h1 className="text-2xl font-black text-white drop-shadow-md">
              שלום, {displayName || user?.email?.split('@')[0] || "משתמש"} 👋
            </h1>
          </div>
        </header>

        {/* Spacer to push content to bottom */}
        <div className="flex-1" />

        {/* Child Avatar - Above Action Cards */}
        {avatarUrl && (
          <div className="flex justify-center mb-4">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl shadow-black/30">
              <img 
                src={avatarUrl} 
                alt="דמות הילד" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Action Cards - Glassmorphism style */}
        <div className="space-y-3 pb-4">
          {actionCards.map((card, index) => {
            const CardIcon = card.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(card.path)}
                className="w-full flex items-center gap-4 bg-white/40 backdrop-blur-md rounded-2xl p-4 shadow-lg shadow-black/15 border border-white/30 hover:bg-white/60 hover:shadow-xl hover:shadow-black/20 hover:scale-[1.01] transition-all text-right"
              >
                <div className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <span className="flex items-center justify-center">
                    <CardIcon className={`w-7 h-7 ${card.iconColor}`} />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-lg text-foreground">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </div>
                <span className="flex items-center justify-center flex-shrink-0">
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />
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
