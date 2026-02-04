import { ArrowLeft, Sparkles, Star, Palette, Heart } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import magicalReadingHero from "@/assets/magical-reading-hero.jpg";

const GuestLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      {/* Logo - 3D Bubble Style */}
      <h1 className="text-4xl font-black text-center tracking-tight logo-3d-bubble mb-3">
        <span className="logo-story">Story</span>
        <span className="logo-time"> Time</span>
      </h1>

      {/* Hero Image Card - Magical Reading Scene */}
      <div className="bg-card rounded-xl p-1.5 shadow-lg border border-border mb-3">
        <img 
          src={magicalReadingHero} 
          alt="ילדה קוראת ספר באווירה קסומה" 
          className="w-full rounded-lg object-cover aspect-[4/3]"
          loading="eager"
        />
      </div>

      {/* Title Section */}
      <div className="text-center space-y-1 mb-3">
        <h2 className="text-2xl font-black text-purple-700 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-400" aria-hidden="true" />
          סיפורים קסומים
          <Sparkles className="w-5 h-5 text-orange-400" aria-hidden="true" />
        </h2>
        <p className="text-base text-muted-foreground font-medium">הילד שלכם כגיבור הסיפור!</p>
      </div>

      {/* Feature Cards */}
      <div className="flex justify-center gap-4 mb-4">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-1.5 shadow-sm">
            <Star className="w-6 h-6 text-purple-500" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground leading-tight">סיפור מותאם</span>
          <span className="text-[11px] font-semibold text-muted-foreground leading-tight">אישית</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-1.5 shadow-sm">
            <Palette className="w-6 h-6 text-amber-500" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground leading-tight">איורים תלת-</span>
          <span className="text-[11px] font-semibold text-muted-foreground leading-tight">מימדיים מקסימים</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-1.5 shadow-sm">
            <Heart className="w-6 h-6 text-pink-500" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground leading-tight">חוויה ייחודית</span>
        </div>
      </div>

      {/* CTA Button - Orange-Purple Gradient */}
      <Button
        onClick={() => navigate("/create")}
        className="w-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:from-orange-500 hover:via-pink-600 hover:to-purple-700 text-white font-black text-base py-6 rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all mb-2"
        size="lg"
        aria-label="התחילו ליצור סיפור חינם"
      >
        התחילו ליצור סיפור חינם
        <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
      </Button>

      {/* Login Link */}
      <p className="text-center text-sm text-muted-foreground mb-2">
        כבר יש לכם חשבון?{" "}
        <Link to="/auth" className="text-purple-600 font-bold hover:underline">
          התחברו כאן
        </Link>
      </p>

      {/* Privacy Link */}
      <p className="text-center text-xs text-muted-foreground/70">
        בהמשך, אתם מסכימים ל
        <Link to="/privacy" className="text-purple-500 hover:underline mx-1">מדיניות הפרטיות</Link>
      </p>
    </div>
  );
};

export default GuestLanding;
