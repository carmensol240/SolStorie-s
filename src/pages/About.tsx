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

      <div className="flex-1 flex flex-col items-center px-6 pt-8 pb-16 max-w-lg mx-auto text-center relative z-10">
        
        {/* Title */}
        <h1 className="text-2xl font-black text-white/95 leading-snug mb-2">
          ✨ ברוכים הבאים לממלכת הסיפורים של <span dir="ltr" className="inline-block bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">SolStorie's™</span> ✨
        </h1>
        <p className="text-base font-bold text-white/80 mb-5">
          המקום שבו הילד שלכם הופך לגיבור הסיפור
        </p>

        {/* Personal intro */}
        <p className="text-base font-bold text-white/90 leading-relaxed mb-1">
          שלום, אני אמא של סול.
        </p>
        <p className="text-sm text-white/75 leading-relaxed mb-5 px-1">
          הצורך שלי ליצור נבע מהרצון להנגיש לסול את העולם בדרך שהיא מבינה ואוהבת. השתמשתי בסיפורים כדי לתווך לה ברכות אתגרים יומיומיים – החל מביטחון בסיטואציות חברתיות חדשות ועד לצליחת רגעים קטנים כמו צחצוח שיניים או חפיפת שיער. דרך הסיפורים, אני הופכת כל התמודדות להרפתקה משותפת, מעודדת שפה חיובית ומעניקה לסול ולכל ילד וילדה את הכלים לבחור בטוב, להתרגש ולגדול בביטחון.
        </p>

        {/* Features section */}
        <p className="text-base font-bold text-white/90 leading-relaxed mb-4">
          🌟 למה <span dir="ltr" className="inline-block">SolStorie's</span> היא הרבה מעבר לאפליקציה?
        </p>

        <div className="space-y-4 mb-5 w-full">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">⭐</span>
            <p className="text-sm text-white/80 leading-snug px-4">
              <strong className="text-amber-200">הילד שלכם בלב העלילה</strong> — תמונת הילד הופכת לדמות מאוירת בסגנון קלאסי שמובילה את הסיפור לאורך כל הדרך.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">👫</span>
            <p className="text-sm text-white/80 leading-snug px-4">
              <strong className="text-pink-200">החבורה של סול</strong> — הילד שלכם מצטרף לסול, ליאו, זואי, בן ומיה – חבורה של חברים טובים שיוצאים יחד איתו למסעות ומלמדים על חברות ואומץ.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">💜</span>
            <p className="text-sm text-white/80 leading-snug px-4">
              <strong className="text-purple-200">סיפורים חברתיים מתוך הלב</strong> — הספרייה שלנו כוללת למעלה מ-50 נושאים מהיומיום שנבחרו בקפידה כדי לתווך סיטואציות רגשיות מורכבות בשילוב כלי NLP.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">🧩</span>
            <p className="text-sm text-white/80 leading-snug px-4">
              <strong className="text-green-200">חיבור עמוק לרצף התקשורתי</strong> — האפליקציה מונגשת לבעלי מוגבלויות והתוכן מותאם במיוחד גם עבור ילדים על הרצף. הדיוק הזה מגיע מתוך הבנה עמוקה וניסיון אישי בחשיבותם המכרעת של סיפורים חברתיים ככלי לתווך את המציאות, להנגיש סיטואציות חברתיות ולייצר ביטחון עצמי.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">🎓</span>
            <p className="text-sm text-white/80 leading-snug px-4">
              <strong className="text-amber-200">ארגז כלים לאנשי חינוך</strong> — קטגוריה ייעודית הכוללת תכנים פדגוגיים מבוססי NLP לעבודה רגשית וחברתית בקבוצות ובגנים.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">🇺🇸</span>
            <p className="text-sm text-white/80 leading-snug px-4">
              <strong className="text-blue-200">העולם מדבר אנגלית</strong> — גרסה אנגלית מלאה המאפשרת חשיפה לשפה ולמידה חווייתית.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">📱</span>
            <p className="text-sm text-white/80 leading-snug px-4">
              <strong className="text-pink-200">בכל מקום ובכל זמן</strong> — הקסם מלווה אתכם בטלפון, בטאבלט ובמחשב האישי.
            </p>
          </div>
        </div>

        {/* Age section */}
        <p className="text-base font-bold text-white/90 leading-relaxed mb-3">
          🎯 דיוק מושלם לכל שלב התפתחותי
        </p>
        <p className="text-sm text-white/70 mb-3">
          הסיפורים מותאמים אישית לגיל ולצרכים של הילד:
        </p>
        <div className="grid grid-cols-3 gap-2 mb-5 w-full">
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
            <p className="text-lg font-black text-amber-200">0-2</p>
            <p className="text-xs text-white/70 leading-snug">סיפורים קצרצרים וחווייתיים</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
            <p className="text-lg font-black text-pink-200">3-6</p>
            <p className="text-xs text-white/70 leading-snug">עלילות מרתקות ומרחיבות דמיון</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
            <p className="text-lg font-black text-purple-200">7-8</p>
            <p className="text-xs text-white/70 leading-snug">שפה עשירה וקריינות לראשית קריאה</p>
            <p className="text-[10px] text-amber-300/80 mt-1 leading-snug">(Coming soon - קריינות איכותית ולא רובוטית... יש למה לחכות!)</p>
          </div>
        </div>

        {/* Gift section */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-3 w-full">
          <p className="text-sm text-white/80 leading-relaxed">
            🎁 <strong className="text-amber-200">להעניק קסם במתנה</strong> — ניתן לרכוש שובר GIFT מעוצב המאפשר לכל ילד להפוך לגיבור הסיפור.
          </p>
          <p className="text-xs text-white/60 mt-1.5">
            הצטרפות קלה: ניתן לשלם בכרטיס אשראי (גם ללא חשבון פייפאל).
          </p>
        </div>

        {/* Safety section */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 w-full">
          <p className="text-sm text-white/80 leading-relaxed">
            🛡️ <strong className="text-green-200">מחויבות לבטיחות ואחריות</strong> — אנו שומרים על פרטיותכם לפי התקנות המחמירות ביותר. כל התכנים והדמויות הם קניין רוחני בלעדי של <span dir="ltr" className="inline-block">SolStorie's™</span>.
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
          <p className="text-xs text-white/60 leading-relaxed">
            ⚕️ השימוש באפליקציה הוא כלי עזר טכנולוגי וחווייתי בלבד ואינו מהווה תחליף לייעוץ מקצועי, חינוכי או רפואי.
          </p>
        </div>

        {/* Coming Soon - NLP Package */}
        <div className="bg-gradient-to-br from-amber-500/15 to-orange-400/10 border border-amber-300/20 rounded-xl p-4 w-full mt-3">
          <p className="text-sm text-white/90 font-bold mb-1.5">🧠 בקרוב: חבילת NLP למטפלים ואנשי חינוך</p>
          <p className="text-xs text-white/70 leading-relaxed">
            אנחנו עובדים על העשרת האפליקציה בארגז כלים מקצועי שיכלול: תכנים פדגוגיים, דפי צביעה ופעילות, וטבלאות מעקב חכמות. יש למה לחכות! ✨
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
