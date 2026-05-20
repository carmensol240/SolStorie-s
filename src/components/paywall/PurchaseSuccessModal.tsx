import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, X } from "lucide-react";
import ConfettiCelebration from "@/components/wizard/ConfettiCelebration";
import PayPalButton from "@/components/paywall/PayPalButton";
import { EDIT_KIT_PACKAGE, CURRENCY } from "@/config/pricing";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const [showPayPal, setShowPayPal] = useState(false);

  const redirectPath = isSubscription ? "/profile" : "/create";

  // Auto-navigate only for subscriptions
  useEffect(() => {
    if (open && isSubscription) {
      const timer = setTimeout(() => {
        navigate(redirectPath);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, isSubscription, navigate, redirectPath]);

  const handleSkip = () => {
    onOpenChange(false);
    navigate(redirectPath);
  };

  const handleEditPurchaseSuccess = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("free_edits_remaining, free_edits_total")
        .eq("id", user.id)
        .maybeSingle();

      const currentRemaining = data?.free_edits_remaining ?? 0;
      const currentTotal = data?.free_edits_total ?? 0;

      await supabase
        .from("profiles")
        .update({
          free_edits_remaining: currentRemaining + EDIT_KIT_PACKAGE.edits,
          free_edits_total: currentTotal + EDIT_KIT_PACKAGE.edits,
        })
        .eq("id", user.id);

      await supabase.from("purchases").insert({
        user_id: user.id,
        package_name: EDIT_KIT_PACKAGE.id,
        credits_purchased: EDIT_KIT_PACKAGE.edits,
        amount_ils: EDIT_KIT_PACKAGE.price,
        status: "completed",
      });

      toast.success("חבילת העריכות נוספה בהצלחה! ✨");
    } catch (err) {
      console.error("Error adding edit credits:", err);
    }
    onOpenChange(false);
    navigate(redirectPath);
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
            onClick={handleSkip}
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

  // One-time purchase — upsell flow
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-0 max-w-sm overflow-hidden [&>button]:hidden"
        dir="rtl"
      >
        <div className="relative bg-gradient-to-b from-[#1a0533] to-[#2d1b69] rounded-2xl p-6 text-center">
          {/* Close / skip button */}
          <button
            onClick={handleSkip}
            className="absolute top-3 left-3 text-white/50 hover:text-white/80 transition-colors z-10"
            aria-label="סגירה"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Confetti */}
          {open && <ConfettiCelebration />}

          {/* Success section */}
          <div className="mb-5">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-4xl">🎉</span>
            </div>
            <h2 className="text-xl font-black text-white mb-1">
              הרכישה הושלמה בהצלחה! 🎉
            </h2>
            <p className="text-white/70 text-sm">
              הסיפורים שלך מוכנים לקסם!
            </p>
          </div>

          {/* Divider */}
          <div className="w-16 h-px bg-white/20 mx-auto mb-5" />

          {/* Upsell section */}
          <div className="mb-5">
            <h3 className="text-lg font-bold text-white mb-2">
              רוצה שכל סיפור יהיה מושלם? ✨
            </h3>
            <p className="text-white/80 text-sm mb-1">
              הוסיפו חבילת 5 עריכות מלאות
            </p>
            <p className="text-white/60 text-xs">
              תיקון שגיאות כתיב + עריכת תוכן לכל סיפור
            </p>
          </div>

          {/* Price */}
          <div className="bg-white/10 rounded-xl p-3 mb-5">
            <p className="text-white font-bold text-lg">
              רק ₪19.9 לכל 5 עריכות
            </p>
            <p className="text-white/60 text-xs">
              (₪4 לעריכה בלבד)
            </p>
          </div>

          {/* CTA buttons */}
          {!showPayPal ? (
            <div className="space-y-3">
              <Button
                onClick={() => setShowPayPal(true)}
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl text-base"
              >
                כן! הוסיפו לי עריכות ✅
              </Button>
              <button
                onClick={handleSkip}
                className="text-white/40 hover:text-white/60 text-xs transition-colors"
              >
                לא תודה, אני מסתדרת
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <PayPalButton
                amount={EDIT_KIT_PACKAGE.price}
                onSuccess={handleEditPurchaseSuccess}
                onError={() => {
                  toast.error("שגיאה בתשלום, נסו שוב");
                  setShowPayPal(false);
                }}
              />
              <button
                onClick={() => setShowPayPal(false)}
                className="text-white/40 hover:text-white/60 text-xs transition-colors"
              >
                ביטול
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseSuccessModal;
