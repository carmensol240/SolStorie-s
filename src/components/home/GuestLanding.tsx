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
    className="landing-feature-card flex items-center gap-3 rounded-2xl p-3 w-full transition-all hover:shadow-lg" 
    dir="rtl"
  >
    <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="text-xs font-bold text-purple-900 leading-tight drop-shadow-sm">
        {title}
      </h3>
        <p 
          className="font-medium text-purple-800 drop-shadow-sm"
          style={{ fontSize: '0.9rem', lineHeight: '1.4' }}
        >
        {subtitle}
      </p>
    </div>
  </div>
);

const GuestLanding = () => {
  const features = [
    {
      icon: <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />,
      title: "התאמה אישית חכמה",
      subtitle: "סיפורים שנבנים עבור ילדכם בשילוב כלים מעולם ה-NLP, עם התאמה רגישה גם לרצף התקשורתי.",
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
      {/* Fixed full-screen hero image background */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ 
          backgroundImage: `url(${heroFlyingGirl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: -2
        }}
      />

      {/* Soft overlay for text readability */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ 
          background: 'linear-gradient(180deg, rgba(135, 206, 235, 0.4) 0%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 251, 235, 0.6) 100%)',
          zIndex: -1 
        }} 
      />

      {/* Content Container */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Logo - 3D Bubble Style */}
        <h1 className="text-6xl sm:text-7xl font-black text-center tracking-tight logo-3d-bubble mb-4 drop-shadow-2xl">
          <span className="logo-story">Story</span>
          <span className="logo-time"> Time</span>
        </h1>

        {/* Title Section */}
        <div className="text-center space-y-1 mb-6 py-2 px-4 mx-auto">
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
        <div className="flex flex-col gap-3 mb-6 px-2">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        {/* Login/Register CTA - Pink Gradient with enhanced shadow */}
        <Link
          to="/auth"
          className="w-full bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 text-white font-black text-base py-4 rounded-full shadow-2xl hover:shadow-2xl hover:scale-[1.02] transition-all mt-2 mb-4 text-center flex items-center justify-center gap-2"
          style={{
            boxShadow: '0 10px 40px -10px rgba(236, 72, 153, 0.5), 0 4px 20px -5px rgba(147, 51, 234, 0.3)'
          }}
        >
          להתחברות והרשמה לחצו כאן
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </Link>

        {/* Privacy Link */}
        <p className="text-center text-sm text-gray-800 font-medium drop-shadow-sm pb-3">
          בהמשך, אתם מסכימים ל
          <Link to="/privacy" className="text-purple-800 font-bold hover:underline mx-1">מדיניות הפרטיות</Link>
        </p>
      </div>
    </div>
  );
};

export default GuestLanding;
