import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PersonalizedStoryCover from "@/components/paywall/PersonalizedStoryCover";
import { getPrice } from "@/config/promo";

interface PrintPdfOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId?: string;
  coverUrl?: string | null;
  childName?: string;
  storyTitle?: string;
  onPurchase: () => void;
}

const PrintPdfOfferModal = ({
  open,
  onOpenChange,
  storyId,
  onPurchase,
}: PrintPdfOfferModalProps) => {
  const pdfPrice = getPrice("pdf").toFixed(2);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm p-0 overflow-hidden border-border bg-background"
        dir="rtl"
      >
        <DialogTitle className="sr-only">הפכו את הסיפור לספר אמיתי</DialogTitle>

        {/* Floating sparkles bg */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-6 left-8 w-32 h-32 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-10 right-6 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative px-5 pt-6 pb-6 flex flex-col items-center text-center gap-4">
          {/* Title */}
          <div>
            <h2 className="text-xl font-black text-foreground leading-tight">
              🖨️ הפכו את הסיפור לספר אמיתי!
            </h2>
          </div>

          {/* Personalized cover */}
          {storyId && <PersonalizedStoryCover storyId={storyId} />}

          {/* Description */}
          <p className="text-sm text-foreground font-semibold">
            קבלו קובץ PDF מוכן להורדה והדפסה
          </p>

          {/* Price */}
          <p className="text-sm text-amber-700 font-bold">
            {pdfPrice} ₪ בלבד — השלמה לחבילה המלאה
          </p>

          {/* CTA Button */}
          <Button
            onClick={onPurchase}
            className="w-full mt-2 bg-primary hover:bg-primary/90 text-white font-black text-sm py-5 rounded-xl shadow-xl gap-2"
            
          >
            הורידו לקובץ PDF 📥
          </Button>

          {/* Sub text */}
          <p className="text-xs text-muted-foreground -mt-1">
            שמרו על המחשב והדפיסו מתי שתרצו
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPdfOfferModal;
