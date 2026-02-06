import { ArrowLeft, Sparkles, Star, Palette, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import soliBackground from "@/assets/soli-tree-background.png";

const GuestLanding = () => {
  return (
    <div className="flex-1 flex flex-col animate-fade-in relative">
      {/* Full-screen Background Image */}
      <div 
        className="absolute inset-0 -mx-4 -mt-3 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${soliBackground})`,
          marginBottom: '-4rem'
        }}
      >
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Logo - 3D Bubble Style - LARGER */}
        <h1 className="text-5xl sm:text-6xl font-black text-center tracking-tight logo-3d-bubble mb-4 drop-shadow-2xl">
          <span className="logo-story">Story</span>
          <span className="logo-time"> Time</span>
        </h1>

        {/* Title Section - transparent */}
        <div className="text-center space-y-1 mb-2 py-2 px-4 mx-auto">
          <h2 className="text-2xl font-black text-purple-700 flex items-center justify-center gap-2 drop-shadow-lg">
            <span className="flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-pink-400" aria-hidden="true" />
            </span>
            סיפורים קסומים
            <span className="flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-orange-400" aria-hidden="true" />
            </span>
          </h2>
          <p className="text-lg text-white font-bold text-center w-full drop-shadow-md">הילד שלכם כגיבור הסיפור!</p>
        </div>

        {/* Spacer to push content to bottom */}
        <div className="flex-1" />

        {/* Feature Cards - compact glassmorphism */}
        <div className="flex justify-center gap-2 mb-3 px-2">
          <div className="flex flex-col items-center text-center bg-white/30 backdrop-blur-sm rounded-2xl p-2 flex-1 max-w-[100px]" dir="rtl">
            <div className="w-8 h-8 bg-purple-200/60 rounded-full flex items-center justify-center mb-1">
              <span className="flex items-center justify-center">
                <Star className="w-4 h-4 text-purple-600" aria-hidden="true" />
              </span>
            </div>
            <p className="text-[9px] font-black text-gray-900 leading-snug">
              טכנולוגיית NLP מתקדמת ליצירת תוכן חינוכי מדויק
            </p>
          </div>
          <div className="flex flex-col items-center text-center bg-white/30 backdrop-blur-sm rounded-2xl p-2 flex-1 max-w-[100px]" dir="rtl">
            <div className="w-8 h-8 bg-amber-200/60 rounded-full flex items-center justify-center mb-1">
              <span className="flex items-center justify-center">
                <Palette className="w-4 h-4 text-amber-600" aria-hidden="true" />
              </span>
            </div>
            <p className="text-[9px] font-black text-gray-900 leading-snug">
              חיזוק מיומנויות תקשורת והבנה חברתית
            </p>
          </div>
          <div className="flex flex-col items-center text-center bg-white/30 backdrop-blur-sm rounded-2xl p-2 flex-1 max-w-[100px]" dir="rtl">
            <div className="w-8 h-8 bg-pink-200/60 rounded-full flex items-center justify-center mb-1">
              <span className="flex items-center justify-center">
                <Heart className="w-4 h-4 text-pink-600" aria-hidden="true" />
              </span>
            </div>
            <p className="text-[9px] font-black text-gray-900 leading-snug">
              סיפורים מעצימים לבניית ביטחון עצמי
            </p>
          </div>
        </div>

        {/* Login/Register CTA - Gradient style */}
        <Link
          to="/auth"
          className="w-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:from-orange-500 hover:via-pink-600 hover:to-purple-700 text-white font-black text-base py-4 rounded-full shadow-xl shadow-black/25 hover:shadow-2xl hover:scale-[1.02] transition-all mb-2 text-center flex items-center justify-center gap-2"
        >
          להתחברות והרשמה לחצו כאן
          <span className="flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </span>
        </Link>

        {/* Privacy Link */}
        <p className="text-center text-xs text-white/90 drop-shadow-md pb-3">
          בהמשך, אתם מסכימים ל
          <Link to="/privacy" className="text-white font-medium hover:underline mx-1">מדיניות הפרטיות</Link>
        </p>
      </div>
    </div>
  );
};

export default GuestLanding;
