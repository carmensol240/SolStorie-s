import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import heroBackground from "@/assets/hero-soli-tree.png";

import MobileNavigation from "@/components/MobileNavigation";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !!user && !authLoading;
  const [isNavigating, setIsNavigating] = useState(false);

  const handleStart = async () => {
    if (!isLoggedIn || !user) {
      navigate("/auth");
      return;
    }

    setIsNavigating(true);
    try {
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
    } catch (err) {
      console.error("Welcome terms check failed:", err);
      toast.error("שגיאה בטעינת הפרופיל. ממשיכים להרפתקה...");
      navigate("/adventure");
    } finally {
      setIsNavigating(false);
    }
  };

  const buttonText = isLoggedIn ? "לחצו כאן להתחלה" : "להתחברות והרשמה לחצו כאן";

  return (
    <div className="min-h-[100dvh] flex flex-col relative" dir="rtl">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.15) 100%)',
        }}
      />

      {/* Logo */}
      <div className="relative z-10 flex justify-center pt-[max(env(safe-area-inset-top,20px),36px)]">
        <h1 className="text-3xl sm:text-4xl font-black logo-3d-bubble">
          <span className="logo-rainbow">SolStorie's™</span>
        </h1>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end px-6 pb-24">
        <button
          onClick={handleStart}
          disabled={isNavigating}
          className="w-full max-w-sm bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 text-white font-black text-lg py-4 rounded-full shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70"
          style={{
            boxShadow: '0 8px 30px -8px rgba(236, 72, 153, 0.5), 0 4px 15px -4px rgba(147, 51, 234, 0.3)'
          }}
        >
          {isNavigating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            buttonText
          )}
        </button>
        <p className="text-[10px] text-white/50 font-medium mt-3 text-center" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
          כלי עזר טכנולוגי בלבד · אינו תחליף לייעוץ מקצועי
        </p>
      </div>

      <MobileNavigation />
    </div>
  );
};

export default Welcome;
