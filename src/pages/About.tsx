import { useNavigate } from "react-router-dom";
import MobileNavigation from "@/components/MobileNavigation";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

const About = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Logged-in users skip the about screen entirely
  useEffect(() => {
    if (!loading && user) {
      navigate("/adventure", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || user) return null;

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden" dir="rtl">
      {/* Magical background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(260,60%,15%)] via-[hsl(270,40%,20%)] to-[hsl(250,50%,12%)]" />
      
      {/* Floating stars / sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
        {/* Soft glowing orbs */}
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/3 right-5 w-56 h-56 rounded-full bg-pink-400/8 blur-3xl" />
        <div className="absolute bottom-32 left-1/4 w-48 h-48 rounded-full bg-amber-400/8 blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-0 pb-24 max-w-lg mx-auto text-center relative z-10">
        
        {/* Title */}
        <h1 className="text-2xl font-black text-white/95 leading-snug mb-3">
          ברוכים הבאים ל-<span dir="ltr" className="inline-block bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">SoulStory™</span> ✨
        </h1>

        {/* Personal intro */}
        <p className="text-base font-bold text-white/90 leading-relaxed mb-1">
          שלום, אני כרמית
        </p>
        <p className="text-sm text-white/75 leading-relaxed mb-3 px-1">
          יצרתי את SoulStory עבור בתי סול, מתוך רצון להעניק לה עולם של דמיון שמבין את הקצב הייחודי שלה. רציתי ליצור עבורה מרחב שבו מילים הופכות לקסם מחבק, המותאם בדיוק לדרך שבה היא חווה את העולם.
        </p>
        <p className="text-sm text-white/75 leading-relaxed mb-3 px-1">
          זהו מקום שעוזר לעבד רגשות, בונה חוסן פנימי ומאפשר לה להיות הגיבורה בסיפור שלה – בכל ערב מחדש.
        </p>
        <p className="text-sm text-white/75 leading-relaxed mb-5 px-1">
          אני נרגשת לחלוק את הקסם הזה גם אתכם. הנה מה שתמצאו בתוך SoulStory:
        </p>

        {/* Section title */}
        <p className="text-base font-bold text-white/90 leading-relaxed mb-4">
          מה הופך את הסיפורים שלנו למיוחדים?
        </p>

        {/* Features — floating, no boxes */}
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
              <strong className="text-pink-200">התאמה מושלמת לפי גיל</strong> — אנחנו יודעים שכל גיל הוא עולם ומלואו. הסיפורים שלנו מותאמים אישית – מסיפורים קצרצרים לפעוטות (0-2), דרך עלילות מרתקות לילדי גן (3-6), ועד לסיפורים מורכבים ועשירים לילדים שכבר לומדים לקרוא (7-8).
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">🪄</span>
            <p className="text-sm text-white/80 leading-snug px-4">
              <strong className="text-purple-200">סיפורים מעצימים</strong> — כל סיפור נבנה עם דגש על בניית ביטחון עצמי, חוסן רגשי ומסרים חיוביים שנטמעים בילד בצורה טבעית ומהנה.
            </p>
          </div>
        </div>

        {/* Invitation */}
        <p className="text-sm text-white/80 leading-relaxed mb-5 px-3 font-semibold">
          אני מזמינה אתכם להצטרף אלינו למסע. כדי שתוכלו להרגיש את הקסם בעצמכם, הסיפור הראשון הוא מתנה ממני.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate("/auth")}
          className="w-full max-w-xs mx-auto flex items-center justify-center bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-400 hover:via-pink-400 hover:to-orange-400 text-white font-black text-base py-3.5 rounded-full shadow-xl transition-all hover:scale-[1.02]"
          style={{
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.4), 0 0 80px rgba(236, 72, 153, 0.2)'
          }}
        >
          בואו נתחיל (סיפור ראשון חינם) ✨
        </button>

        {/* Signature */}
        <p className="text-sm font-semibold bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent mt-3">
          באהבה, כרמית כהן
        </p>
      </div>

      <MobileNavigation />
    </div>
  );
};

export default About;
