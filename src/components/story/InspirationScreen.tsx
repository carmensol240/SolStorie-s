import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import soliTreeBackground from "@/assets/soli-tree-background.png";

interface InspirationScreenProps {
  onContinue: () => void;
}

const InspirationScreen = ({ onContinue }: InspirationScreenProps) => {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-center min-h-[70vh] -mx-3 -mt-3">
      {/* Background Image */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${soliTreeBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Gradient Overlay for text readability */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.5) 100%)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 text-center p-8 flex flex-col items-center justify-end h-full pb-16">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl max-w-sm mx-auto">
          <h2 className="text-2xl font-black text-purple-700 mb-3 flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            מוכנים ליצור סיפור קסום?
            <Sparkles className="w-6 h-6 text-purple-500" />
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            הילד שלכם עומד להפוך לגיבור של סיפור מותאם אישית
          </p>
          <Button 
            onClick={onContinue}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-black text-lg py-6 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
          >
            בואו נתחיל! ✨
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InspirationScreen;
