import { useState, useEffect } from "react";
import { Wand2, Coins, BookOpen, ArrowLeft, Sparkles, Gift, Star, Palette, Heart } from "lucide-react";

import heroChildReading from "@/assets/hero-child-reading.jpg";
import heroChildTablet from "@/assets/hero-child-tablet-new.jpg";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MobileNavigation from "@/components/MobileNavigation";
import DebugMenu from "@/components/DebugMenu";
import OfflineIndicator from "@/components/ui/offline-indicator";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import { useOfflineStorage } from "@/hooks/use-offline-storage";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useChildAvatar } from "@/hooks/use-child-avatar";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const navigate = useNavigate();
  const { isOnline } = useOfflineStorage();
  const { user, loading: authLoading } = useAuth();
  const { credits, loading: creditsLoading } = useCredits();
  const { shareCoins } = useReferral();
  const { avatarUrl } = useChildAvatar();

  const [displayName, setDisplayName] = useState<string | null>(null);

  const totalCredits = (credits ?? 0) + shareCoins;

  // Reset state when user logs out
  useEffect(() => {
    if (!user) {
      setDisplayName(null);
      return;
    }

    const fetchUserData = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();

        setDisplayName(profile?.display_name || null);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setDisplayName(null);
      }
    };

    fetchUserData();
  }, [user]);

  const isLoggedIn = !!user && !authLoading;

  // 3 Action Cards for logged-in users
  const actionCards = [
    {
      icon: Wand2,
      title: "יוצאים להרפתקה חדשה",
      description: "סיפור מותאם אישית לילד שלך",
      path: "/create",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: BookOpen,
      title: "הספרייה הקסומה שלי",
      description: "צפה בכל הסיפורים שיצרת",
      path: "/library",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      icon: Gift,
      title: "הרויחו סיפורים חינם",
      description: "הזמינו חברים וקבלו קרדיטים",
      path: "/upgrade",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-gradient-to-b from-amber-50/50 to-background overflow-hidden">
      <OfflineIndicator isOnline={isOnline} />
      <DebugMenu />
      
      <div className="flex-1 overflow-hidden flex flex-col pb-16">
        <div className="container max-w-lg mx-auto px-3 py-1.5 flex-1 flex flex-col">
          
          {/* Logged-in User Dashboard */}
          {isLoggedIn && (
            <div className="flex-1 flex flex-col animate-fade-in">
              {/* Header - Greeting on Right, Credits on Left (RTL) */}
              <header className="flex items-center justify-between mb-1">
                {/* Left side: Credits + Avatar */}
                <div className="flex items-center gap-1.5">
                  {avatarUrl && (
                    <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-primary shadow-sm">
                      <img 
                        src={avatarUrl} 
                        alt="דמות הילד" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <button 
                    onClick={() => navigate("/upgrade")}
                    className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-full px-2 py-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                    aria-label="צפה בקרדיטים ושדרג"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                    <span className="font-semibold text-amber-700 dark:text-amber-400 text-xs">{totalCredits}</span>
                  </button>
                </div>
                {/* Right side: Greeting with actual username */}
                <h1 className="text-lg font-bold text-foreground">
                  שלום, {displayName || user?.email?.split('@')[0] || "משתמש"} 👋
                </h1>
              </header>

              {/* Hero Image - Compact */}
              <div className="bg-card rounded-xl p-1.5 shadow-md border border-border overflow-hidden mb-1.5">
                <img 
                  src={heroChildReading} 
                  alt="ילד קורא סיפור" 
                  className="w-full rounded-lg object-cover aspect-[16/9]"
                  loading="eager"
                />
              </div>

              {/* Action Cards - Compact */}
              <div className="space-y-1.5 flex-1">
                {actionCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => navigate(card.path)}
                      className="w-full flex items-center gap-2.5 bg-card rounded-xl p-2.5 shadow-sm border border-border hover:shadow-md hover:scale-[1.01] transition-all text-right"
                    >
                      <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4.5 h-4.5 ${card.iconColor}`} aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-foreground">{card.title}</h3>
                        <p className="text-[11px] text-muted-foreground truncate">{card.description}</p>
                      </div>
                      <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>

              {/* Footer Placeholder */}
              <div className="h-6 bg-gradient-to-t from-purple-100/50 to-transparent rounded-t-2xl mt-auto" />
            </div>
          )}

          {/* Guest Home - Landing Page */}
          {!isLoggedIn && (
            <div className="flex-1 flex flex-col animate-fade-in">
              
              {/* Logo - 3D Bubble Style */}
              <h1 className="text-4xl font-black text-center tracking-tight logo-3d-bubble mb-2">
                <span className="logo-story">Story</span>
                <span className="logo-time"> Time</span>
              </h1>

              {/* Hero Image Card */}
              <div className="bg-card rounded-xl p-1.5 shadow-lg border border-border mb-2">
                <img 
                  src={heroChildTablet} 
                  alt="ילד קורא סיפור בטאבלט" 
                  className="w-full rounded-lg object-cover aspect-[4/3]"
                  loading="eager"
                />
              </div>

              {/* Title Section */}
              <div className="text-center space-y-0.5 mb-2">
                <h2 className="text-xl font-black text-purple-700 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pink-400" aria-hidden="true" />
                  סיפורים קסומים
                  <Sparkles className="w-4 h-4 text-orange-400" aria-hidden="true" />
                </h2>
                <p className="text-sm text-muted-foreground">הילד שלכם כגיבור הסיפור!</p>
              </div>

              {/* Feature Cards */}
              <div className="flex justify-center gap-3 mb-3">
                <div className="flex flex-col items-center text-center">
                  <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center mb-1">
                    <Star className="w-5 h-5 text-purple-500" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight">סיפור מותאם</span>
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight">אישית</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center mb-1">
                    <Palette className="w-5 h-5 text-amber-500" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight">איורים תלת-</span>
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight">מימדיים מקסימים</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-11 h-11 bg-pink-100 rounded-xl flex items-center justify-center mb-1">
                    <Heart className="w-5 h-5 text-pink-500" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight">חוויה ייחודית</span>
                </div>
              </div>

              {/* Login/Register Button */}
              <Button
                onClick={() => navigate("/auth")}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold text-sm py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all mb-1.5"
                size="lg"
                aria-label="התחברות או הרשמה"
              >
                התחברות / הרשמה
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              </Button>

              {/* Secondary text */}
              <p className="text-center text-xs text-muted-foreground mb-2">
                הצטרפו לאלפי משפחות שכבר יוצרות סיפורים מותאמים אישית
              </p>

              {/* Testimonials Section - Compact */}
              <div className="flex-1 overflow-hidden min-h-0">
                <TestimonialsSection />
              </div>

              {/* Footer Placeholder */}
              <div className="h-4 bg-gradient-to-t from-purple-100/50 to-transparent rounded-t-2xl mt-auto" />
            </div>
          )}

        </div>
      </div>
      
      <MobileNavigation />
    </div>
  );
};

export default Home;
