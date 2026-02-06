import { ArrowLeft, Sparkles, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import soliBackground from "@/assets/soli-tree-background.png";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
}

const FeatureCard = ({ icon, title, subtitle, gradientFrom, gradientTo }: FeatureCardProps) => (
  <div 
    className="flex flex-col items-center text-center bg-white/20 backdrop-blur-lg rounded-2xl p-3 flex-1 border border-white/30 shadow-lg shadow-black/10 hover:bg-white/30 hover:scale-[1.02] transition-all duration-300" 
    dir="rtl"
  >
    <div className={`w-7 h-7 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-lg flex items-center justify-center mb-2 shadow-lg animate-pulse-glow-soft`}>
      <span className="animate-float-gentle">
        {icon}
      </span>
    </div>
    <h3 className="text-xs font-black text-white leading-tight mb-1 drop-shadow-md">
      {title}
    </h3>
    <p className="text-[10px] font-bold text-white/90 leading-snug drop-shadow-sm">
      {subtitle}
    </p>
  </div>
);

const GuestLanding = () => {
  const features = [
    {
      icon: <span className="flex items-center justify-center"><Sparkles className="w-3.5 h-3.5 text-white" aria-hidden="true" /></span>,
      title: "טכנולוגיית NLP מתקדמת",
      subtitle: "ליצירת תוכן חינוכי מדוייק ומותאם אישית",
      gradientFrom: "from-purple-500",
      gradientTo: "to-pink-500",
    },
    {
      icon: <span className="flex items-center justify-center"><Users className="w-3.5 h-3.5 text-white" aria-hidden="true" /></span>,
      title: "חיזוק מיומנויות תקשורת",
      subtitle: "והבנה חברתית, מותאם גם לילדים על הרצף האוטיסטי",
      gradientFrom: "from-amber-500",
      gradientTo: "to-orange-500",
    },
    {
      icon: <span className="flex items-center justify-center"><Star className="w-3.5 h-3.5 text-white" aria-hidden="true" /></span>,
      title: "סיפורים מעצימים",
      subtitle: "לבניית ביטחון עצמי ודימוי עצמי חיובי בדמות הילד",
      gradientFrom: "from-pink-500",
      gradientTo: "to-rose-500",
    },
  ];

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
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />
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

        {/* Feature Cards - Striking Glassmorphism */}
        <div className="flex justify-center gap-3 mb-4 px-2">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
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
