import { useNavigate } from "react-router-dom";
import MobileNavigation from "@/components/MobileNavigation";
import GlobalFooter from "@/components/shared/GlobalFooter";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

const About = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

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
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/4 right-8 w-56 h-56 rounded-full bg-indigo-400/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-pink-400/8 blur-3xl" />
        <div className="absolute bottom-32 left-1/4 w-48 h-48 rounded-full bg-amber-400/6 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-36 h-36 rounded-full bg-blue-400/6 blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-8 pb-16 max-w-lg mx-auto text-center relative z-10">
        
        {/* Title */}
        <div className="mb-8 text-center">
          <p className="text-sm font-bold tracking-widest uppercase mb-3 text-purple-300/80 text-center w-full">
            ✨ ברוכים הבאים ✨
          </p>
          <h1 className="text-3xl font-black leading-tight mb-3" style={{ color: '#FFF8E7', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
            ממלכת הסיפורים של
          </h1>
          <p dir="ltr" className="text-4xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent mb-4">
            SolStorie's™
          </p>
          <div className="w-16 h-0.5 mx-auto bg-gradient-to-r from-transparent via-amber-300/60 to-transparent mb-4" />
          <p className="text-base font-bold text-amber-200/90" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
            המקום שבו הילד שלכם הופך לגיבור הסיפור
          </p>
        </div>

        {/* Personal intro — always visible */}
        <p className="text-lg font-black text-white/95 leading-relaxed mb-4" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
          שלום, אני אמא של סול והלב הפועם מאחורי <span dir="ltr" className="inline-block bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent" style={{ textShadow: 'none' }}>SolStorie's</span>
        </p>
        <p className="text-base font-normal text-white/90 leading-[1.8] text-right mb-6 px-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          הנולדה מתוך רצון להעניק לבתי <strong className="text-amber-200 font-bold">מרחב קסום</strong>, שמעמיד את עולמה הפנימי במרכז.
          <br />
          מה שהתחיל כפרויקט אישי קטן, הפך לאפליקציה שמעניקה לכל ילד את היכולת <strong className="text-amber-200 font-bold">להיות הגיבור של הסיפור שלו</strong>.
        </p>
        {/* Read more / Close toggle */}
        {!showMore ? (
          <button
            onClick={() => setShowMore(true)}
            className="text-sm text-purple-300/80 hover:text-purple-200 underline underline-offset-4 mb-6 transition-colors"
          >
            קרא עוד ↓
          </button>
        ) : (
          <button
            onClick={() => {
              setShowMore(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-full bg-amber-400/20 backdrop-blur-sm border border-amber-400/40 text-sm text-amber-300 hover:bg-amber-400/30 transition-all mb-4"
          >
            סגור ↑
          </button>
        )}

        {/* Expandable features content */}
        {showMore && (
          <div className="animate-fade-in">
            <p className="text-base font-normal text-white/90 leading-[1.8] text-right mb-6 px-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              הצורך שלי ליצור נבע מהרצון <strong className="text-pink-200 font-bold">להנגיש לסול את העולם</strong> בדרך שהיא מבינה ואוהבת.
              <br />
              השתמשתי בסיפורים כדי לתווך לה ברכות אתגרים יומיומיים — החל מביטחון בסיטואציות חברתיות חדשות ועד לצליחת רגעים קטנים כמו צחצוח שיניים או חפיפת שיער.
            </p>
            <p className="text-base font-normal text-white/90 leading-[1.8] text-right mb-7 px-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              דרך הסיפורים, אני הופכת כל התמודדות <strong className="text-purple-200 font-bold">להרפתקה משותפת</strong>, מעודדת שפה חיובית ומעניקה לסול ולכל ילד וילדה את הכלים <strong className="text-green-200 font-bold">לבחור בטוב, להתרגש ולגדול בביטחון</strong>.
            </p>
            <p className="text-lg font-black text-white/95 leading-relaxed mb-4" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              🌟 למה <span dir="ltr" className="inline-block bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">SolStorie's</span> היא הרבה מעבר לאפליקציה?
            </p>

            <div className="space-y-1.5 mb-4 w-full">
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
                  <strong className="text-purple-200 font-black">סיפורים חברתיים מתוך הלב</strong> — הספרייה שלנו כוללת למעלה מ-90 נושאים לבחירה מהיומיום שנבחרו בקפידה כדי לתווך סיטואציות רגשיות מורכבות בשילוב כלי NLP.
                </p>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <span className="text-3xl">🧩</span>
                <p className="text-base font-normal text-white leading-[1.6] text-right px-4" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                  <strong className="text-green-200 font-black">חיבור עמוק לרצף התקשורתי</strong> — האפליקציה מונגשת לבעלי מוגבלויות והתוכן מותאם במיוחד גם עבור ילדים על הרצף. הדיוק הזה מגיע מתוך הבנה עמוקה וניסיון אישי בחשיבותם המכרעת של סיפורים חברתיים ככלי לתווך את המציאות, להנגיש סיטואציות חברתיות ולייצר ביטחון עצמי.
                </p>
              </div>

              <div className="flex flex-col items-center gap-1.5 relative rounded-xl p-3" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.10))', border: '1px solid rgba(255,215,0,0.3)' }}>
                <span className="absolute -top-2 -right-2 bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow">חדש ✨</span>
                <span className="text-3xl">🎓</span>
                <p className="text-base font-normal text-white leading-[1.6] text-right px-4" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                  <strong className="text-amber-300 font-black">ספריית הלימוד — אותיות, מספרים, צבעים וצורות</strong> — הילד פוגש כל מושג בתור הרפתקה אישית מרגשת. מושלם לגיל 3-6.
                </p>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <span className="text-3xl">🏫</span>
                <p className="text-base font-normal text-white leading-[1.6] text-right px-4" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                  <strong className="text-amber-200 font-black">ארגז כלים לאנשי חינוך</strong> — קטגוריה ייעודית הכוללת תכנים פדגוגיים מבוססי NLP לעבודה רגשית וחברתית בקבוצות ובגנים.
                </p>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <span className="text-3xl">🎨📚</span>
                <p className="text-base font-normal text-white leading-[1.6] text-right px-4" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                  <strong className="text-orange-200 font-black"> יצירה וצביעה</strong> — כל סיפור מגיע עם דף צביעה מותאם אישית להדפסה בבית — ובספריית הלימוד, הילד פוגש אותיות ומספרים בתוך הרפתקה קסומה משלו.
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

            {/* Sticky floating close button */}
            <div className="sticky bottom-4 flex justify-center mt-8 pb-4">
              <button
                onClick={() => {
                  setShowMore(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm border border-purple-500/30 text-sm text-purple-200 hover:bg-black/60 transition-all"
              >
                סגור ↑
              </button>
            </div>
          </div>
        )}

        {/* Terms checkbox */}
        <div className="flex items-center gap-2 mb-4 w-full max-w-xs mx-auto" dir="rtl">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            className="border-white/40 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
          />
          <label htmlFor="terms" className="text-sm text-white/80 cursor-pointer">
            קראתי ואני מסכימה ל
            <a href="/terms" target="_blank" className="text-purple-300 underline underline-offset-2 hover:text-purple-200 mx-1">
              תנאי השימוש
            </a>
          </label>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => navigate("/adventure")}
          disabled={!termsAccepted}
          className="w-full max-w-xs mx-auto flex items-center justify-center bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-400 hover:via-pink-400 hover:to-orange-400 text-white font-black text-lg py-4 rounded-full shadow-xl transition-all hover:scale-[1.02] mb-8 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            boxShadow: termsAccepted ? '0 0 40px rgba(168, 85, 247, 0.4), 0 0 80px rgba(236, 72, 153, 0.2)' : 'none'
          }}
        >
          בואו נתחיל! סיפור ראשון חינם ✨
        </button>
      </div>

      {/* Copyright */}
      <div className="relative z-10 text-center py-3 text-xs text-white/40">
        © {new Date().getFullYear()} SolStorie's™. כל הזכויות שמורות.
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
