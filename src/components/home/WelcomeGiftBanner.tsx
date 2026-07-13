import { Gift } from "lucide-react";

interface WelcomeGiftBannerProps {
  credits: number | null;
  storyCount: number;
}

const WelcomeGiftBanner = ({ credits, storyCount }: WelcomeGiftBannerProps) => {
  // Show banner to brand-new users who haven't purchased yet:
  // 0 credits AND 0 stories. The banner advertises the 1+1 launch offer,
  // which is applied automatically on their first purchase.
  const showBanner = (credits ?? 0) === 0 && storyCount === 0;
  
  if (!showBanner) return null;

  return (
    <div className="relative mx-4 mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 p-4 shadow-xl">
      {/* Sparkle decorations */}
      <div className="absolute -top-2 -right-2 text-2xl animate-pulse">✨</div>
      <div className="absolute -bottom-1 -left-1 text-xl animate-pulse delay-300">⭐</div>
      
      <div className="relative flex items-center gap-4">
        {/* Gift icon with animation */}
        <div className="flex-shrink-0 w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce">
          <Gift className="w-7 h-7 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-white text-lg leading-tight">
            🎁 מבצע 1+1 — קנו סיפור וקבלו סיפור נוסף במתנה!
          </h3>
          <p className="text-white/90 text-sm mt-0.5">
            הבונוס יתווסף אוטומטית ברכישה הראשונה
          </p>
        </div>
      </div>
      
    </div>
  );
};

export default WelcomeGiftBanner;
