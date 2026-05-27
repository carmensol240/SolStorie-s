import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ConfettiCelebration from "@/components/wizard/ConfettiCelebration";
import solHero from "@/assets/sol-hero-celebrate.png";

interface PurchaseSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditsAdded: number;
  isSubscription?: boolean;
}

const PurchaseSuccessModal = ({
  open,
  onOpenChange,
  creditsAdded,
  isSubscription = false,
}: PurchaseSuccessModalProps) => {
  const navigate = useNavigate();

  // After a one-time purchase, prefer returning to the story the user came from
  const getRedirectPath = () => {
    if (isSubscription) return "/profile";
    try {
      const raw = sessionStorage.getItem("pendingStoryReturn");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.path && typeof parsed.path === "string") return parsed.path as string;
      }
    } catch {}
    return "/create";
  };
  const consumePendingReturn = () => {
    try { sessionStorage.removeItem("pendingStoryReturn"); } catch {}
  };

  // Auto-navigate only for subscriptions
  useEffect(() => {
    if (open && isSubscription) {
      const timer = setTimeout(() => {
        navigate(getRedirectPath());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, isSubscription, navigate]);

  const handleGo = () => {
    onOpenChange(false);
    const path = getRedirectPath();
    consumePendingReturn();
    navigate(path);
  };

  // Subscription flow — unchanged
  if (isSubscription) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="text-center max-w-sm" dir="rtl">
          <DialogHeader>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✨</span>
            </div>
            <DialogTitle className="text-2xl font-black text-foreground">
              ברוכים הבאים למשפחת <span dir="ltr" className="inline-block">SolStorie's™</span>!
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground mb-2 leading-relaxed text-sm">
            שמחה שהצטרפתם. מעכשיו תקבלו כל חודש כלים חדשים מעולם ה-NLP והחינוך המקרב שיעזרו לכם להפוך כל סיפור לרגע של חיבור אמיתי.
          </p>
          <p className="text-sm text-foreground font-medium whitespace-pre-line mb-4">
            {`בהצלחה ובשמחה,\nאמא של סול`}
          </p>
          <Button
            onClick={handleGo}
            size="lg"
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl"
          >
            לערכת הכלים שלי ✨
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            מעבר אוטומטי בעוד 3 שניות...
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  // One-time purchase — celebration with Sol
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-0 max-w-md overflow-hidden [&>button]:hidden bg-transparent shadow-none"
        dir="rtl"
      >
        <div className="relative bg-gradient-to-br from-[#1a0533] via-[#2d1b69] to-[#3b1d6b] rounded-3xl p-6 pt-8 text-center overflow-hidden border border-white/10 shadow-[0_20px_60px_-10px_rgba(168,85,247,0.5)]">
          {/* Twinkling stars background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 28 }).map((_, i) => {
              const left = (i * 37) % 100;
              const top = (i * 53) % 100;
              const size = 6 + ((i * 7) % 10);
              const delay = (i % 8) * 0.25;
              const colors = ["#fbbf24", "#f0abfc", "#7dd3fc", "#fde68a", "#c4b5fd"];
              const color = colors[i % colors.length];
              return (
                <span
                  key={i}
                  className="absolute animate-pulse"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    color,
                    animationDelay: `${delay}s`,
                    animationDuration: "2.2s",
                    filter: "drop-shadow(0 0 6px currentColor)",
                  }}
                  aria-hidden
                >
                  ✦
                </span>
              );
            })}
          </div>

          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 left-3 text-white/50 hover:text-white/80 transition-colors z-20"
            aria-label="סגירה"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Confetti */}
          {open && <ConfettiCelebration />}

          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-black text-white text-center drop-shadow-lg">
              הרכישה הושלמה בהצלחה! 🎉
            </DialogTitle>
          </DialogHeader>

          {/* Sol + speech bubble */}
          <div className="relative z-10 mt-4 flex flex-col items-center">
            {/* Speech bubble */}
            <div className="relative bg-white rounded-2xl px-5 py-3 mb-3 shadow-xl max-w-[260px]">
              <p className="text-[#2d1b69] font-bold text-base leading-snug">
                הסיפור שלך מוכן לקסם! ✨
              </p>
              {/* Tail pointing down to Sol */}
              <div className="absolute -bottom-2 right-10 w-4 h-4 bg-white rotate-45" />
            </div>

            <img
              src={solHero}
              alt="סול חוגגת"
              width={220}
              height={293}
              loading="lazy"
              className="w-44 sm:w-52 h-auto drop-shadow-[0_10px_25px_rgba(0,0,0,0.4)] animate-bounce-slow"
              style={{ animation: "float 3s ease-in-out infinite" }}
            />
          </div>

          {/* CTA */}
          <div className="relative z-10 mt-5">
            <Button
              onClick={handleGo}
              size="lg"
              className="w-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 hover:opacity-95 text-white font-black rounded-2xl text-lg h-14 shadow-[0_8px_25px_-5px_rgba(236,72,153,0.6)]"
            >
              בואו ניצור! 🚀
            </Button>
          </div>

          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-8px); }
            }
          `}</style>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseSuccessModal;
