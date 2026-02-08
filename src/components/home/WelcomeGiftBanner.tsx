import { useNavigate } from "react-router-dom";
import { Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeGiftBannerProps {
  credits: number | null;
  storyCount: number;
}

const WelcomeGiftBanner = ({ credits, storyCount }: WelcomeGiftBannerProps) => {
  const navigate = useNavigate();
  
  // Show banner only for new users: exactly 1 credit AND 0 stories
  const showBanner = credits === 1 && storyCount === 0;
  
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
            🎁 יש לך סיפור ראשון במתנה!
          </h3>
          <p className="text-white/90 text-sm mt-0.5">
            התחילו להרפתקה הקסומה שלכם
          </p>
        </div>
      </div>
      
      <Button
        onClick={() => navigate("/create")}
        className="w-full mt-3 bg-white hover:bg-white/90 text-purple-700 font-bold py-3 rounded-xl shadow-md transition-all hover:scale-[1.02]"
      >
        <Sparkles className="w-5 h-5 ml-2" />
        צור סיפור חדש
      </Button>
    </div>
  );
};

export default WelcomeGiftBanner;
