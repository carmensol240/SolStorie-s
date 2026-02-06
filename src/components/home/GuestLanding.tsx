import { ArrowLeft, Sparkles, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import childReadingBackground from "@/assets/child-reading-tablet.jpeg";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const FeatureCard = ({ icon, title, subtitle }: FeatureCardProps) => (
  <div 
    className="flex items-center gap-3 bg-gradient-to-r from-purple-900/80 to-[#5D3A1A]/80 backdrop-blur-lg rounded-xl p-3 w-full border border-purple-400/30 shadow-lg shadow-black/20" 
    dir="rtl"
  >
    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="text-sm font-black text-white leading-tight drop-shadow-md">
        {title}
      </h3>
      <p className="text-sm font-black text-purple-200 leading-snug drop-shadow-sm">
        {subtitle}
      </p>
    </div>
  </div>
);

const GuestLanding = () => {
  const features = [
    {
      icon: <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />,
      title: "טכנולוגיית NLP מתקדמת",
      subtitle: "ליצירת תוכן חינוכי מדוייק ומותאם אישית",
    },
    {
      icon: <Users className="w-5 h-5 text-white" aria-hidden="true" />,
      title: "חיזוק מיומנויות תקשורת",
      subtitle: "מותאם גם לילדים על הרצף האוטיסטי",
    },
    {
      icon: <Star className="w-5 h-5 text-white" aria-hidden="true" />,
      title: "סיפורים מעצימים",
      subtitle: "לבניית ביטחון עצמי ודימוי עצמי חיובי",
    },
  ];

  return (
    <div className="flex-1 flex flex-col animate-fade-in relative">
      {/* Full-screen Background Image - Child Reading */}
      <div 
        className="absolute inset-0 -mx-4 -mt-3 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${childReadingBackground})`,
          marginBottom: '-4rem'
        }}
      >
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-transparent to-black/70" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Logo - 3D Bubble Style - LARGER */}
        <h1 className="text-6xl sm:text-7xl font-black text-center tracking-tight logo-3d-bubble mb-2 drop-shadow-2xl">
          <span className="logo-story">Story</span>
          <span className="logo-time"> Time</span>
        </h1>

        {/* Title Section */}
        <div className="text-center space-y-1 mb-2 py-2 px-4 mx-auto">
          <h2 className="text-2xl font-black text-purple-300 flex items-center justify-center gap-2 drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            <Sparkles className="w-6 h-6 text-purple-400" aria-hidden="true" />
            סיפורים קסומים
            <Sparkles className="w-6 h-6 text-purple-400" aria-hidden="true" />
          </h2>
          <p className="text-lg text-white font-black text-center w-full drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>הילד שלכם כגיבור הסיפור!</p>
        </div>

        {/* Spacer to push content to bottom */}
        <div className="flex-1" />

        {/* Feature Cards - Horizontal Stack */}
        <div className="flex flex-col gap-2 mb-4 px-2">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        {/* Login/Register CTA - Purple & Brown Gradient */}
        <Link
          to="/auth"
          className="w-full bg-gradient-to-r from-purple-700 via-purple-600 to-[#8B5A2B] hover:from-purple-800 hover:via-purple-700 hover:to-[#6B4423] text-white font-black text-base py-4 rounded-full shadow-xl shadow-black/25 hover:shadow-2xl hover:scale-[1.02] transition-all mb-2 text-center flex items-center justify-center gap-2"
        >
          להתחברות והרשמה לחצו כאן
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </Link>

        {/* Privacy Link */}
        <p className="text-center text-xs text-white/90 drop-shadow-md pb-3">
          בהמשך, אתם מסכימים ל
          <Link to="/privacy" className="text-purple-300 font-bold hover:underline mx-1">מדיניות הפרטיות</Link>
        </p>
      </div>
    </div>
  );
};

export default GuestLanding;
