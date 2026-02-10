import { useNavigate } from "react-router-dom";
import { Sparkles, Brain, BookOpen } from "lucide-react";
import MobileNavigation from "@/components/MobileNavigation";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-purple-50 via-pink-50 to-amber-50" dir="rtl">
      <div className="flex-1 flex flex-col items-center justify-center px-5 pt-0 pb-1 max-w-lg mx-auto text-center">
        {/* Welcome text */}
        <div className="space-y-1.5 mb-2">
          <h1 className="text-2xl font-black text-purple-800 leading-snug">
            ברוכים הבאים ל-<span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">StoryTime</span>! 🌟
          </h1>
          <p className="text-base text-foreground/80 leading-relaxed">
            יצרתי את האפליקציה עבור בתי, סול, מתוך רצון להעניק לה עולם של דמיון שמבין את הקצב הייחודי שלה. רציתי ליצור עבורה מרחב שבו מילים הופכות לקסם מונגש, פשוט ומחבק, שמותאם בדיוק לדרך שבה היא חווה את העולם.
          </p>
          <p className="text-sm text-foreground/70 leading-relaxed font-bold">
            כדי להפוך את החזון הזה למציאות עבור כל ילד וילדה, רתמנו את הכלים המתקדמים ביותר ליצירת חוויה מושלמת:
          </p>
        </div>

        {/* Technology cards */}
        <div className="space-y-2 mb-2 w-full">
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-purple-100 shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-foreground/80 text-right leading-snug">
              <strong className="text-purple-800">טכנולוגיית NLP מתקדמת</strong> — כלים מעולם עיבוד השפה הטבעית משולבים בתוך הסיפורים, עם סוגסטיות מעצימות שעוזרות לילד לבנות ביטחון עצמי.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-pink-100 shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-foreground/80 text-right leading-snug">
              <strong className="text-pink-800">בינה מלאכותית חכמה</strong> — סיפורים מותאמים אישית בזמן הווה, בעברית פשוטה וחמה, עם ניקוד מלא ומדויק להקראה מושלמת.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-amber-100 shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-foreground/80 text-right leading-snug">
              <strong className="text-amber-800">הילד שלכם הוא הגיבור</strong> — תמונת הילד הופכת לדמות מצוירת בסגנון אנימציה קלאסי שמלווה אותו בכל הרפתקה.
            </p>
          </div>
        </div>

        {/* Invitation text */}
        <p className="text-sm text-foreground/80 leading-relaxed mt-4 mb-4 px-2 font-bold">
          אני מזמינה אתכם להצטרף אלינו למסע. כדי שתוכלו להרגיש את הקסם בעצמכם, הסיפור הראשון הוא עלינו – במתנה.
        </p>

        {/* Continue button */}
        <button
          onClick={() => navigate("/adventure")}
          className="w-full max-w-xs mx-auto flex items-center justify-center bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 text-white font-black text-base py-3.5 rounded-full shadow-xl transition-all hover:scale-[1.02]"
          style={{
            boxShadow: '0 8px 30px -8px rgba(147, 51, 234, 0.5), 0 4px 15px -4px rgba(236, 72, 153, 0.3)'
          }}
        >
          בואו נתחיל (סיפור ראשון חינם) ✨
        </button>

        {/* Signature */}
        <p className="text-sm font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent mt-2">
          באהבה, כרמית כהן
        </p>
      </div>

      <MobileNavigation />
    </div>
  );
};

export default About;
