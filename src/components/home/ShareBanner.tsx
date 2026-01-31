import { Gift, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ShareBanner = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/share")}
      className="w-full bg-gradient-to-l from-secondary/20 via-primary/10 to-accent/20 rounded-2xl p-4 comic-shadow border-2 border-foreground/10 flex items-center gap-4 hover:scale-[1.01] transition-transform focus-ring"
      aria-label="עברו למסך הרוויחו סיפורים חינם"
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0">
        <Gift className="w-6 h-6 text-accent" aria-hidden="true" />
      </div>

      {/* Text */}
      <div className="flex-1 text-right">
        <h4 className="font-bold text-foreground">הרוויחו סיפורים חינם 🎁</h4>
        <p className="text-sm text-muted-foreground">הזמינו חברים וקבלו קרדיטים</p>
      </div>

      {/* Arrow */}
      <ChevronLeft className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
    </button>
  );
};

export default ShareBanner;
