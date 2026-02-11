import { useState } from "react";
import { ArrowLeft, Sparkles, Star, Users, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBackground from "@/assets/hero-soli-tree.png";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const FeatureCard = ({ icon, title, subtitle }: FeatureCardProps) => (
  <div 
    className="landing-feature-card-transparent flex items-center gap-3 rounded-2xl p-3 w-full transition-all" 
    dir="rtl"
  >
    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-base font-black text-purple-900 leading-tight">
        {title}
      </h3>
      <p className="text-sm font-bold text-gray-700 leading-snug">
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
      title: "34 נושאים מובנים",
      subtitle: "סיפורים שנבנים עבור ילדכם בשילוב כלים מעולם ה-NLP, עם 34 נושאים מובנים לפתרון סיטואציות מחיי היום-יום.",
    },
    {
      icon: <Star className="w-5 h-5 text-white" aria-hidden="true" />,
      title: "לומדים אנגלית בכיף",
      subtitle: "סיפורים והקראה קולית איכותית של ילדה ללמידת שפה בצורה חווייתית.",
    },
    {
      icon: <Users className="w-5 h-5 text-white" aria-hidden="true" />,
      title: "הדפסה וגלריה חינם",
      subtitle: "קבלו כל סיפור בקובץ PDF להדפסה + גלריית סיפורים חינמית לתמיד.",
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
        navigate("/adventure");
      } else {
        navigate("/onboarding");
      }
    } catch (error) {
      console.error("Error checking user terms:", error);
      navigate("/adventure");
    } finally {
      setIsNavigating(false);
    }
  };

  // Determine button text based on login state
  const buttonText = isLoggedIn ? "להתחלה לחצו כאן" : "להתחברות והרשמה לחצו כאן";

  return (
    <div className="flex-1 flex flex-col animate-fade-in relative">
      {/* Full-screen hero image background - absolute within section */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Very subtle overlay - keep image visible */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.15) 100%)',
        }} 
      />

      {/* Content Container - with minimal bottom padding */}
      <div className="relative z-10 flex-1 flex flex-col px-3 pb-16">
        {/* Logo - 3D Bubble Style */}
        <h1 className="text-6xl sm:text-7xl font-black text-center tracking-tight logo-3d-bubble mb-1 drop-shadow-2xl pt-2">
          <span className="logo-story">Soul</span>
          <span className="logo-time">Story</span>
        </h1>

        {/* Title Section - Compact & Centered */}
        <div className="text-center mb-2 px-2">
          <h2 className="text-2xl sm:text-3xl font-black text-purple-700 flex items-center justify-center gap-2 mb-1" style={{ textShadow: '1px 1px 3px rgba(255,255,255,0.9)' }}>
            <Sparkles className="w-6 h-6 text-purple-600" aria-hidden="true" />
            סיפורים קסומים
            <Sparkles className="w-6 h-6 text-purple-600" aria-hidden="true" />
          </h2>
          <p className="text-lg text-pink-600 font-black text-center" style={{ textShadow: '1px 1px 3px rgba(255,255,255,0.8)' }}>הילד שלכם כגיבור הסיפור!</p>
        </div>

        {/* Spacer to push content to bottom */}
        <div className="flex-1 min-h-8" />

        {/* Feature Cards - compact spacing */}
        <div className="flex flex-col gap-2 mb-3 px-1">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        {/* Login/Register CTA */}
        <button
          onClick={handleStart}
          disabled={isNavigating}
          className="w-full bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 text-white font-black text-base py-3.5 rounded-full shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mx-auto mb-2"
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

        {/* Device availability */}
        <p className="text-center text-xs text-gray-800 font-bold mb-1" style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.7)' }}>
          זמינה בכל המכשירים: נייד, טאבלט ומחשב · ניתן לשלם בכרטיס אשראי ללא חשבון פייפאל
        </p>

        {/* Privacy Link */}
        <p className="text-center text-xs text-gray-800 font-semibold">
          בהמשך, אתם מסכימים ל
          <a href="/privacy" className="text-purple-700 font-bold hover:underline mx-1">מדיניות הפרטיות</a>
        </p>
      </div>
    </div>
  );
};

export default GuestLanding;
