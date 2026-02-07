import { ArrowLeft, Sparkles, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import heroFlyingGirl from "@/assets/hero-flying-girl.jpeg";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const FeatureCard = ({ icon, title, subtitle }: FeatureCardProps) => (
  <div 
    className="flex items-center gap-3 bg-white/90 backdrop-blur-lg rounded-xl p-3 w-full border border-purple-200 shadow-md" 
    dir="rtl"
  >
    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="text-sm font-bold text-purple-800 leading-tight">
        {title}
      </h3>
      <p className="text-xs font-medium text-purple-600 leading-snug">
        {subtitle}
      </p>
    </div>
  </div>
);

const GuestLanding = () => {
  const features = [
    {
      icon: <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />,
      title: "התאמה אישית מתקדמת",
      subtitle: "שימוש בטכנולוגיית NLP להתאמה אישית לילדים על הרצף התקשורתי.",
    },
    {
      icon: <Users className="w-5 h-5 text-white" aria-hidden="true" />,
      title: "הדפסה חינמית",
      subtitle: "קבלת כל סיפור בקובץ PDF להדפסה בחינם.",
    },
    {
      icon: <Star className="w-5 h-5 text-white" aria-hidden="true" />,
      title: "גלריה חינמית",
      subtitle: "גישה מלאה לגלריית סיפורים חינמית תמיד.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col animate-fade-in relative">
      {/* Soft blue sky background with clouds */}
      <div 
        className="absolute inset-0 -mx-4 -mt-3"
        style={{ 
          marginBottom: '-4rem',
          background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 40%, #E0F4FF 70%, #F0F8FF 100%)'
        }}
      >
        {/* Cloud decorations */}
        <div className="absolute top-8 left-4 w-24 h-12 bg-white/60 rounded-full blur-sm" />
        <div className="absolute top-12 left-12 w-16 h-8 bg-white/50 rounded-full blur-sm" />
        <div className="absolute top-6 right-8 w-20 h-10 bg-white/55 rounded-full blur-sm" />
        <div className="absolute top-10 right-16 w-14 h-7 bg-white/45 rounded-full blur-sm" />
        <div className="absolute top-24 left-1/3 w-28 h-14 bg-white/40 rounded-full blur-md" />
        <div className="absolute top-32 right-1/4 w-18 h-9 bg-white/35 rounded-full blur-md" />
        
        {/* Hero flying children image - positioned between titles and feature boxes with glass effect */}
        <div className="absolute top-44 sm:top-48 left-1/2 -translate-x-1/2 w-52 h-52 sm:w-64 sm:h-64">
          <div 
            className="w-full h-full rounded-3xl overflow-hidden backdrop-blur-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(135, 206, 235, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <img 
              src={heroFlyingGirl} 
              alt="ילדים עפים בשמיים" 
              className="w-full h-full object-cover opacity-90"
              style={{ 
                filter: 'drop-shadow(0 4px 15px rgba(0,0,0,0.1))',
                mixBlendMode: 'normal'
              }}
            />
          </div>
        </div>
        
        {/* Subtle warm overlay at bottom for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-amber-50/30" />
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
          <h2 className="text-2xl font-black text-purple-700 flex items-center justify-center gap-2 drop-shadow-lg" style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}>
            <Sparkles className="w-6 h-6 text-purple-600" aria-hidden="true" />
            סיפורים קסומים
            <Sparkles className="w-6 h-6 text-purple-600" aria-hidden="true" />
          </h2>
          <p className="text-lg text-pink-600 font-black text-center w-full drop-shadow-sm" style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.6)' }}>הילד שלכם כגיבור הסיפור!</p>
        </div>

        {/* Spacer to push content to bottom */}
        <div className="flex-1" />

        {/* Feature Cards - Horizontal Stack */}
        <div className="flex flex-col gap-2 mb-4 px-2">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        {/* Login/Register CTA - Pink Gradient */}
        <Link
          to="/auth"
          className="w-full bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 text-white font-black text-base py-4 rounded-full shadow-xl shadow-pink-500/25 hover:shadow-2xl hover:scale-[1.02] transition-all mb-2 text-center flex items-center justify-center gap-2"
        >
          להתחברות והרשמה לחצו כאן
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </Link>

        {/* Privacy Link */}
        <p className="text-center text-xs text-gray-700 drop-shadow-sm pb-3">
          בהמשך, אתם מסכימים ל
          <Link to="/privacy" className="text-purple-700 font-bold hover:underline mx-1">מדיניות הפרטיות</Link>
        </p>
      </div>
    </div>
  );
};

export default GuestLanding;
