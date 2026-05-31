import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const TERMS_VERSION = "1.0";

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [hasAgreedTerms, setHasAgreedTerms] = useState(false);
  const [hasAgreedPrivacy, setHasAgreedPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingTerms, setCheckingTerms] = useState(true);

  // Guard: Check if user already accepted terms
  useEffect(() => {
    const checkTermsAcceptance = async () => {
      if (loading) return;
      if (!user) {
        navigate("/auth");
        return;
      }
      setCheckingTerms(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("terms_accepted_at")
          .eq("id", user.id)
          .maybeSingle();
        if (data?.terms_accepted_at) {
          navigate("/adventure", { replace: true });
          return;
        }
      } catch (error) {
        console.error("Error checking terms:", error);
      } finally {
        setCheckingTerms(false);
      }
    };
    checkTermsAcceptance();
  }, [user, loading, navigate]);

  const getReturnTo = () => {
    const returnTo = searchParams.get('returnTo') || '/adventure';
    // Override stale/generic paths — force home after first-time terms acceptance.
    // Only honor specific deep-links from RequireTerms (e.g. /library, /create, /upgrade).
    const forceHome = ['/settings', '/', '/adventure', '/auth', '/onboarding'];
    if (
      !returnTo.startsWith('/') ||
      returnTo.startsWith('//') ||
      forceHome.includes(returnTo)
    ) {
      return '/adventure';
    }
    return returnTo;
  };

  const handleContinue = async () => {
    if (!user || !hasAgreedTerms || !hasAgreedPrivacy) return;
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      
      // Try update first, use .select() to verify it actually matched a row
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          terms_accepted_at: now,
          terms_version: TERMS_VERSION,
        })
        .eq("id", user.id)
        .select("terms_accepted_at");

      if (updateError) throw updateError;

      // If update matched zero rows, the profile doesn't exist yet — upsert as fallback
      if (!updated || updated.length === 0) {
        console.warn("Profile update matched 0 rows, falling back to upsert");
        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            terms_accepted_at: now,
            terms_version: TERMS_VERSION,
          }, { onConflict: "id" });
        if (upsertError) throw upsertError;
      }

      toast({
        title: "ברוכים הבאים ל-SolStorie's™! 🎉",
        description: "מחכה לך סיפור לדוגמא מאיתנו כדי שתתרשמו מהקסם ✨",
      });
      // Clear any stale returnTo so it doesn't leak into future navigations
      try { localStorage.removeItem('returnTo'); } catch {}
      navigate(getReturnTo(), { replace: true });
    } catch (error) {
      console.error("Error saving consent:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת שמירת ההסכמה. נסו שוב.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || checkingTerms) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-[hsl(260,60%,15%)] via-[hsl(270,40%,20%)] to-[hsl(250,50%,12%)]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-y-auto" dir="rtl" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Magical background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[hsl(260,60%,15%)] via-[hsl(270,40%,20%)] to-[hsl(250,50%,12%)]" />
      
      {/* Floating stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/60 animate-pulse"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/3 right-5 w-56 h-56 rounded-full bg-pink-400/8 blur-3xl" />
        <div className="absolute bottom-32 left-1/4 w-48 h-48 rounded-full bg-amber-400/8 blur-3xl" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-6 pt-6 pb-6 max-w-lg mx-auto text-center relative z-10">
        
        {/* Title */}
        <h1 className="text-2xl font-black text-white/95 leading-snug mb-3">
          ברוכים הבאים ל-<span dir="ltr" className="inline-block bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">SolStorie's™</span> ✨
        </h1>

        {/* Personal intro */}
        <p className="text-base font-bold text-white/90 leading-relaxed mb-1">
          שלום, אני אמא של סול
        </p>
        <p className="text-sm text-white/75 leading-relaxed mb-3 px-1">
          יצרתי את <span dir="ltr" className="inline-block">SolStorie's™</span> עבור בתי סול, מתוך רצון להעניק לה עולם של דמיון שמבין את הקצב הייחודי שלה. האפליקציה נולדה מאהבה של אמא לבתה, וכל התכנים והדמויות הם קניין רוחני מוגן.
        </p>
        <p className="text-sm text-white/75 leading-relaxed mb-3 px-1">
          באפליקציה תמצאו <strong className="text-amber-200">מעל 100 נושאים מובנים</strong> לפתרון סיטואציות מחיי היום-יום – מפחד מהחושך, דרך יום ראשון בגן ועד הגעת אח חדש. כל סיפור נבנה בשילוב כלים מעולם ה-NLP, בונה חוסן פנימי ומאפשר לילד להיות הגיבור בסיפור שלו.
        </p>
        <p className="text-sm text-white/75 leading-relaxed mb-5 px-1">
          אני נרגשת לחלוק את הקסם הזה גם אתכם. הנה מה שתמצאו בתוך <span dir="ltr" className="inline-block">SolStorie's™</span>:
        </p>

        {/* Section title */}
        <p className="text-base font-bold text-white/90 leading-relaxed mb-4">
          הופכים את הקושי לסיפור קסום ✨
        </p>

        {/* Features */}
        <div className="space-y-4 mb-5 w-full">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">⭐</span>
            <p className="text-sm text-white/80 leading-snug px-4">
              <strong className="text-amber-200">הילד שלכם הוא הגיבור</strong> — הופכים תמונה פשוטה לדמות מצוירת בסגנון אנימציה קלאסי, שמלווה את הילד לאורך כל ההרפתקה.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">🌙</span>
            <p className="text-sm text-white/80 leading-snug px-4">
              <strong className="text-pink-200">התאמה מושלמת לפי גיל</strong> — הסיפורים מותאמים אישית – מסיפורים קצרצרים לפעוטות (0-2), דרך עלילות מרתקות לילדי גן (3-6), ועד לסיפורים מורכבים ועשירים לילדים שכבר לומדים לקרוא (7-8).
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">🌟</span>
            <p className="text-sm text-white/80 leading-snug px-4">
              <strong className="text-purple-200">סיפורים מעצימים</strong> — כל סיפור נבנה עם דגש על בניית ביטחון עצמי, חוסן רגשי ומסרים חיוביים שנטמעים בילד בצורה טבעית ומהנה.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">🌍</span>
            <p className="text-sm text-white/80 leading-snug px-4">
              <strong className="text-green-200">לומדים אנגלית בכיף</strong> — סיפורים ללמידת שפה בצורה חווייתית ומהנה.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">🖨️</span>
            <p className="text-sm text-white/80 leading-snug px-4">
              <strong className="text-amber-200">הדפסה לספר פיזי</strong> — הדפיסו את הסיפור של הילד כספר אמיתי לקחת הביתה.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">🎙️</span>
            <p className="text-sm text-white/80 leading-snug px-4">
              <strong className="text-pink-200">הקלטה בקול אדם</strong> — הסיפור מוקלט בקול אדם חם ומרגש.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">🎨</span>
            <p className="text-sm text-white/80 leading-snug px-4">
              <strong className="text-purple-200">דפי צביעה</strong> — דפי צביעה מהסיפור להדפסה או לצביעה אונליין.
            </p>
          </div>
        </div>

        {/* Invitation */}
        <p className="text-sm text-white/80 leading-relaxed mb-5 px-3 font-semibold">
          אני מזמינה אתכם להצטרף אלינו למסע. כדי שתוכלו להרגיש את הקסם בעצמכם, הסיפור הראשון הוא מתנה ממני.
        </p>

        {/* Signature */}
        <p className="text-sm font-semibold bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent mb-6">
          באהבה, אמא של סול
        </p>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-3 bg-white/[0.08] backdrop-blur-md rounded-xl p-4 border border-white/10 w-full mb-3">
          <Checkbox
            id="terms-agreement"
            checked={hasAgreedTerms}
            onCheckedChange={(checked) => setHasAgreedTerms(checked === true)}
            className="h-5 w-5 mt-0.5 border-purple-300 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
          />
          <Label 
            htmlFor="terms-agreement" 
            className="text-sm leading-relaxed cursor-pointer text-white/80"
          >
            קראתי ואני מסכים/ה ל
            <Link to="/terms" className="text-purple-300 hover:underline font-medium mx-1">
              תנאי השימוש
            </Link>
          </Label>
        </div>

        {/* Privacy Checkbox */}
        <div className="flex items-start gap-3 bg-white/[0.08] backdrop-blur-md rounded-xl p-4 border border-white/10 w-full mb-3">
          <Checkbox
            id="privacy-agreement"
            checked={hasAgreedPrivacy}
            onCheckedChange={(checked) => setHasAgreedPrivacy(checked === true)}
            className="h-5 w-5 mt-0.5 border-purple-300 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
          />
          <Label 
            htmlFor="privacy-agreement" 
            className="text-sm leading-relaxed cursor-pointer text-white/80"
          >
            קראתי ואני מסכים/ה ל
            <Link to="/privacy" className="text-purple-300 hover:underline font-medium mx-1">
              מדיניות הפרטיות
            </Link>
          </Label>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!hasAgreedTerms || !hasAgreedPrivacy || isSubmitting}
          className={`w-full max-w-xs mx-auto h-14 rounded-full text-lg font-black shadow-xl transition-all ${
            hasAgreedTerms && hasAgreedPrivacy
              ? "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-400 hover:via-pink-400 hover:to-orange-400 text-white" 
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
          style={hasAgreedTerms && hasAgreedPrivacy ? {
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.4), 0 0 80px rgba(236, 72, 153, 0.2)'
          } : undefined}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              המשך
              <ArrowRight className="h-5 w-5 mr-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
