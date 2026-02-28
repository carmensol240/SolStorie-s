import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

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

  const redirectPath = isSubscription ? "/profile" : "/create";

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        navigate(redirectPath);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, navigate, redirectPath]);

  const handleGoToDestination = () => {
    onOpenChange(false);
    navigate(redirectPath);
  };

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
            onClick={handleGoToDestination}
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center max-w-sm">
        <DialogHeader>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎉</span>
          </div>
          <DialogTitle className="text-2xl font-black text-foreground">
            נוספו לך {creditsAdded} סיפורים!
          </DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground mb-6">
          עכשיו אפשר ליצור סיפורים חדשים ומיוחדים
        </p>

        <Button
          onClick={handleGoToDestination}
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
        >
          <BookOpen className="w-5 h-5 ml-2" />
          צרו סיפור חדש
        </Button>

        <p className="text-xs text-muted-foreground mt-3">
          מעבר אוטומטי בעוד 3 שניות...
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseSuccessModal;
