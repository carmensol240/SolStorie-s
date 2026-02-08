import { useState } from "react";
import { ArrowLeft, Sparkles, Star, Users, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroFlyingGirl from "@/assets/hero-flying-girl.jpeg";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const FeatureCard = ({ icon, title, subtitle }: FeatureCardProps) => (
  <div 
    className="landing-feature-card-opaque flex items-center gap-3 rounded-2xl p-3 w-full transition-all" 
    dir="rtl"
  >
    <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-bold text-purple-900 leading-tight">
        {title}
      </h3>
      <p className="text-xs font-semibold text-gray-700 leading-relaxed">
        {subtitle}
      </p>
    </div>
  </div>
);

interface GuestLandingProps {
  user?: User | null;
  isLoggedIn?: boolean;
}

const GuestLanding = ({ user, isLoggedIn }: GuestLandingProps) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const features = [
    {
      icon: <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />,
      title: "התאמה אישית חכמה",
      subtitle: "סיפורים שנבנים עבור ילדכם בשילוב כלים מעולם ה-NLP, עם התאמה רגישה גם לרצף התקשורתי.",
    },
    {
      icon: <Users className="w-5 h-5 text-white" aria-hidden="true" />,
      title: "הדפסה חינמית",
      subtitle: "קבלת כל סיפור בקובץ PDF להדפסה בחינם.",
    },
    {
      icon: <Star className="w-5 h-5 text-white" aria-hidden="true" />,
      title: "גלריה חינמית",
      subtitle: "גישה מלאה לגלריית סיפורים חינמית תמיד.",
    },
  ];

  const handleStart = async () => {
    if (!isLoggedIn || !user) {
      // Not logged in - go to auth
      navigate("/auth");
      return;
    }

    setIsNavigating(true);
    try {
      // Check if user has accepted terms
      const { data } = await supabase
        .from("profiles")
        .select("terms_accepted_at")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.terms_accepted_at) {
        // Terms accepted - go directly to library
        navigate("/library");
      } else {
        // Terms not accepted - go to onboarding
        navigate("/onboarding");
      }
    } catch (error) {
      console.error("Error checking user terms:", error);
      // Fallback to library on error
      navigate("/library");
    } finally {
      setIsNavigating(false);
    }
  };

  // Determine button text based on login state
  const buttonText = isLoggedIn ? "להתחלה לחצו כאן" : "להתחברות והרשמה לחצו כאן";

  return (
    <div className="flex-1 flex flex-col animate-fade-in relative">
      {/* Fixed full-screen hero image background - background-size: cover */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ 
          backgroundImage: `url(${heroFlyingGirl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          zIndex: -2
        }}
      />

      {/* Lighter overlay for better image visibility */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ 
          background: 'linear-gradient(180deg, rgba(135, 206, 235, 0.25) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 251, 235, 0.35) 100%)',
          zIndex: -1 
        }} 
      />

      {/* Content Container - with safe bottom padding for mobile */}
      <div className="relative z-10 flex-1 flex flex-col px-3 pb-20">
        {/* Logo - 3D Bubble Style */}
        <h1 className="text-5xl sm:text-6xl font-black text-center tracking-tight logo-3d-bubble mb-2 drop-shadow-2xl pt-2">
          <span className="logo-story">Story</span>
          <span className="logo-time"> Time</span>
        </h1>

        {/* Title Section - Compact */}
        <div className="text-center space-y-0.5 mb-4 px-2">
          <h2 className="text-xl font-black text-purple-700 flex items-center justify-center gap-2" style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}>
            <Sparkles className="w-5 h-5 text-purple-600" aria-hidden="true" />
            סיפורים קסומים
            <Sparkles className="w-5 h-5 text-purple-600" aria-hidden="true" />
          </h2>
          <p className="text-base text-pink-600 font-black" style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.6)' }}>הילד שלכם כגיבור הסיפור!</p>
        </div>

        {/* Spacer to push content to bottom */}
        <div className="flex-1 min-h-4" />

        {/* Feature Cards - with proper spacing */}
        <div className="flex flex-col gap-2.5 mb-5 px-1">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        {/* Login/Register CTA - with proper bottom margin */}
        <button
          onClick={handleStart}
          disabled={isNavigating}
          className="w-full bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 text-white font-black text-base py-4 rounded-full shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mx-auto mb-4"
          style={{
            boxShadow: '0 8px 30px -8px rgba(236, 72, 153, 0.5), 0 4px 15px -4px rgba(147, 51, 234, 0.3)'
          }}
        >
          {isNavigating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {buttonText}
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </button>

        {/* Privacy Link - More prominent */}
        <p className="text-center text-sm text-gray-900 font-semibold mb-2">
          בהמשך, אתם מסכימים ל
          <a href="/privacy" className="text-purple-700 font-bold hover:underline mx-1">מדיניות הפרטיות</a>
        </p>
      </div>
    </div>
  );
};

export default GuestLanding;
