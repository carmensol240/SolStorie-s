import { ArrowLeft, Sparkles, Star, Palette, Heart } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import soliBackground from "@/assets/soli-tree-background.png";

const GuestLanding = () => {
  const navigate = useNavigate();

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

        {/* Title Section with glassmorphism */}
        <div className="text-center space-y-1 mb-3 bg-white/70 backdrop-blur-md rounded-2xl py-3 px-4 mx-auto shadow-lg shadow-black/10">
          <h2 className="text-2xl font-black text-purple-700 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" aria-hidden="true" />
            סיפורים קסומים
            <Sparkles className="w-5 h-5 text-orange-400" aria-hidden="true" />
          </h2>
          <p className="text-base text-muted-foreground font-medium">הילד שלכם כגיבור הסיפור!</p>
        </div>

        {/* Spacer to push content to bottom */}
        <div className="flex-1" />

        {/* Feature Cards with glassmorphism */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="flex flex-col items-center text-center bg-white/80 backdrop-blur-lg rounded-xl p-3 shadow-lg shadow-black/15">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-1.5 shadow-sm">
              <Star className="w-5 h-5 text-purple-500" aria-hidden="true" />
            </div>
            <span className="text-[11px] font-semibold text-foreground leading-tight">סיפור מותאם</span>
            <span className="text-[11px] font-semibold text-foreground leading-tight">אישית</span>
          </div>
          <div className="flex flex-col items-center text-center bg-white/80 backdrop-blur-lg rounded-xl p-3 shadow-lg shadow-black/15">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-1.5 shadow-sm">
              <Palette className="w-5 h-5 text-amber-500" aria-hidden="true" />
            </div>
            <span className="text-[11px] font-semibold text-foreground leading-tight">איורים תלת-</span>
            <span className="text-[11px] font-semibold text-foreground leading-tight">מימדיים מקסימים</span>
          </div>
          <div className="flex flex-col items-center text-center bg-white/80 backdrop-blur-lg rounded-xl p-3 shadow-lg shadow-black/15">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-1.5 shadow-sm">
              <Heart className="w-5 h-5 text-pink-500" aria-hidden="true" />
            </div>
            <span className="text-[11px] font-semibold text-foreground leading-tight">חוויה ייחודית</span>
          </div>
        </div>

        {/* CTA Button - Orange-Purple Gradient with shadow */}
        <Button
          onClick={() => navigate("/create")}
          className="w-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:from-orange-500 hover:via-pink-600 hover:to-purple-700 text-white font-black text-base py-6 rounded-full shadow-xl shadow-black/25 hover:shadow-2xl hover:scale-[1.02] transition-all mb-2"
          size="lg"
          aria-label="התחילו ליצור סיפור חינם"
        >
          התחילו ליצור סיפור חינם
          <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
        </Button>

        {/* Login Link with glassmorphism */}
        <div className="bg-white/70 backdrop-blur-md rounded-xl py-2 px-4 mb-2">
          <p className="text-center text-sm text-foreground">
            כבר יש לכם חשבון?{" "}
            <Link to="/auth" className="text-purple-600 font-bold hover:underline">
              התחברו כאן
            </Link>
          </p>
        </div>

        {/* Privacy Link */}
        <p className="text-center text-xs text-white/90 drop-shadow-md pb-4">
          בהמשך, אתם מסכימים ל
          <Link to="/privacy" className="text-white font-medium hover:underline mx-1">מדיניות הפרטיות</Link>
        </p>
      </div>
    </div>
  );
};

export default GuestLanding;
