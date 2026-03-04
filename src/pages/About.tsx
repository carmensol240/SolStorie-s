import { useNavigate } from "react-router-dom";
import MobileNavigation from "@/components/MobileNavigation";
import GlobalFooter from "@/components/shared/GlobalFooter";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

const About = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
        {/* Small twinkling stars */}
        {[...Array(45)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute rounded-full bg-white/70 animate-pulse"
            style={{
              width: `${1.5 + Math.random() * 2.5}px`,
              height: `${1.5 + Math.random() * 2.5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 4}s`,
            }}
          />
        ))}
        {/* Larger glowing stars */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`glow-${i}`}
            className="absolute rounded-full animate-pulse"
            style={{
              width: `${4 + Math.random() * 4}px`,
              height: `${4 + Math.random() * 4}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,180,255,0.4) 60%, transparent 100%)',
              boxShadow: '0 0 6px 2px rgba(200,180,255,0.5)',
            }}
          />
        ))}
        {/* Yellow scattered stars */}
        {[...Array(30)].map((_, i) => (
          <div
            key={`yellow-${i}`}
            className="absolute rounded-full bg-yellow-300 animate-pulse"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.15 + Math.random() * 0.15,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
        {/* Ambient glow orbs */}
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/4 right-8 w-56 h-56 rounded-full bg-indigo-400/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-pink-400/8 blur-3xl" />
        <div className="absolute bottom-32 left-1/4 w-48 h-48 rounded-full bg-amber-400/6 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-36 h-36 rounded-full bg-blue-400/6 blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-8 pb-16 max-w-lg mx-auto text-center relative z-10">
        
        {/* Title */}
        <h1 className="text-2xl font-black leading-snug mb-2 text-center" style={{ color: '#FFF8E7', textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(255,215,150,0.15)' }}>
          ברוכים הבאים לממלכת הסיפורים
          <br />
          <span className="inline-block">של <span dir="ltr" className="inline-block bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent" style={{ textShadow: 'none' }}>SolStorie's™</span></span>
        </h1>
        <p className="text-lg font-black mb-5" style={{ color: '#FFF0D0', textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
          המקום שבו הילד שלכם הופך לגיבור הסיפור
        </p>

        {/* Personal intro */}
        <p className="text-lg font-black text-white/95 leading-relaxed mb-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
          שלום, אני אמא של סול.
        </p>
        <p className="text-base font-normal text-white leading-[1.6] text-right mb-5 px-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          <span dir="ltr" className="inline-block bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">SolStorie's</span> נולדה מתוך רצון להעניק לבתי מרחב קסום שמעמיד את עולמה הפנימי במרכז. מה שהתחיל כפיתוח אישי שנועד להעשיר את רגעי הדמיון שלה, הפך לטכנולוגיה פורצת דרך שמעניקה לכל ילד וילדה את הכוח ליצור ולהוביל את הסיפור הייחודי שלהם.
        </p>
        <p className="text-base font-normal text-white leading-[1.6] text-right mb-5 px-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          הצורך שלי ליצור נבע מהרצון להנגיש לסול את העולם בדרך שהיא מבינה ואוהבת. השתמשתי בסיפורים כדי לתווך לה ברכות אתגרים יומיומיים - החל מביטחון בסיטואציות חברתיות חדשות ועד לצליחת רגעים קטנים כמו צחצוח שיניים או חפיפת שיער. דרך הסיפורים, אני הופכת כל התמודדות להרפתקה משותפת, מעודדת שפה חיובית ומעניקה לסול ולכל ילד וילדה את הכלים לבחור בטוב, להתרגש ולגדול בביטחון.
        </p>

        {/* Features section */}
        <p className="text-lg font-black text-white/95 leading-relaxed mb-4" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
          🌟 למה <span dir="ltr" className="inline-block bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">SolStorie's</span> היא הרבה מעבר לאפליקציה?
        </p>

        <div className="space-y-4 mb-5 w-full">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">⭐</span>
            <p className="text-base font-normal text-white leading-[1.6] text-right px-4" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              <strong className="text-amber-200 font-black">הילד שלכם בלב העלילה</strong> — תמונת הילד הופכת לדמות מאוירת בסגנון קלאסי שמובילה את הסיפור לאורך כל הדרך.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">👫</span>
            <p className="text-base font-normal text-white leading-[1.6] text-right px-4" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              <strong className="text-pink-200 font-black">החבורה של סול</strong> — הילד שלכם מצטרף לסול, ליאו, זואי, בן ומיה – חבורה של חברים טובים שיוצאים יחד איתו למסעות ומלמדים על חברות ואומץ.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">💜</span>
            <p className="text-base font-normal text-white leading-[1.6] text-right px-4" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              <strong className="text-purple-200 font-black">סיפורים חברתיים מתוך הלב</strong> — הספרייה שלנו כוללת למעלה מ-70 נושאים מהיומיום שנבחרו בקפידה כדי לתווך סיטואציות רגשיות מורכבות בשילוב כלי NLP.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">🧩</span>
            <p className="text-base font-normal text-white leading-[1.6] text-right px-4" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              <strong className="text-green-200 font-black">חיבור עמוק לרצף התקשורתי</strong> — האפליקציה מונגשת לבעלי מוגבלויות והתוכן מותאם במיוחד גם עבור ילדים על הרצף. הדיוק הזה מגיע מתוך הבנה עמוקה וניסיון אישי בחשיבותם המכרעת של סיפורים חברתיים ככלי לתווך את המציאות, להנגיש סיטואציות חברתיות ולייצר ביטחון עצמי.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">🎓</span>
            <p className="text-base font-normal text-white leading-[1.6] text-right px-4" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              <strong className="text-amber-200 font-black">ארגז כלים לאנשי חינוך</strong> — קטגוריה ייעודית הכוללת תכנים פדגוגיים מבוססי NLP לעבודה רגשית וחברתית בקבוצות ובגנים.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">🇺🇸</span>
            <p className="text-base font-normal text-white leading-[1.6] text-right px-4" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              <strong className="text-blue-200 font-black">העולם מדבר אנגלית</strong> — גרסה אנגלית מלאה המאפשרת חשיפה לשפה ולמידה חווייתית.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">📱</span>
            <p className="text-base font-normal text-white leading-[1.6] text-right px-4" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              <strong className="text-pink-200 font-black">בכל מקום ובכל זמן</strong> — הקסם מלווה אתכם בטלפון, בטאבלט ובמחשב האישי.
            </p>
          </div>
        </div>

        {/* Safety section */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 w-full">
          <p className="text-base font-normal text-white leading-[1.6] text-right" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
            🛡️ <strong className="text-green-200 font-black">מחויבות לבטיחות ואחריות</strong> — אנו שומרים על פרטיותכם לפי התקנות המחמירות ביותר. כל התכנים והדמויות הם קניין רוחני בלעדי של <span dir="ltr" className="inline-block bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">SolStorie's™</span>.
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => navigate("/auth")}
          className="w-full max-w-xs mx-auto flex items-center justify-center bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-400 hover:via-pink-400 hover:to-orange-400 text-white font-black text-base py-3.5 rounded-full shadow-xl transition-all hover:scale-[1.02] mb-4"
          style={{
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.4), 0 0 80px rgba(236, 72, 153, 0.2)'
          }}
        >
          בואו נתחיל! (סיפור ראשון חינם) ✨
        </button>

        {/* Disclaimer */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 w-full">
          <p className="text-sm font-normal text-white/70 leading-[1.6] text-right" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
            ⚕️ השימוש באפליקציה הוא כלי עזר טכנולוגי וחווייתי בלבד ואינו מהווה תחליף לייעוץ מקצועי, חינוכי או רפואי.
          </p>
        </div>
      </div>

      {/* Global Footer */}
      <div className="relative z-10">
        <GlobalFooter />
      </div>

      <MobileNavigation />
    </div>
  );
};

export default About;
