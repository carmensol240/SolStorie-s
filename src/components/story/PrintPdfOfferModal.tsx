import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PersonalizedStoryCover from "@/components/paywall/PersonalizedStoryCover";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm p-0 overflow-hidden border-purple-500/30 bg-gradient-to-b from-[hsl(260,60%,15%)] via-[hsl(270,40%,20%)] to-[hsl(250,50%,12%)]"
        dir="rtl"
      >
        <DialogTitle className="sr-only">הפכו את הסיפור לספר אמיתי</DialogTitle>

        {/* Floating sparkles bg */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-6 left-8 w-32 h-32 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="absolute bottom-10 right-6 w-40 h-40 rounded-full bg-pink-400/10 blur-3xl" />
        </div>

        <div className="relative px-5 pt-6 pb-6 flex flex-col items-center text-center gap-4">
          {/* Title */}
          <div>
            <h2 className="text-xl font-black text-white leading-tight">
              🖨️ הפכו את הסיפור לספר אמיתי!
            </h2>
          </div>

          {/* Personalized cover */}
          {storyId && <PersonalizedStoryCover storyId={storyId} />}

          {/* Description */}
          <p className="text-sm text-white/80 font-semibold">
            קבלו קובץ PDF מוכן להורדה והדפסה
          </p>

          {/* Price */}
          <p className="text-sm text-amber-300 font-bold">
            69.90 ₪ בלבד — השלמה לחבילה המלאה
          </p>

          {/* CTA Button */}
          <Button
            onClick={onPurchase}
            className="w-full mt-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-400 hover:via-pink-400 hover:to-orange-400 text-white font-black text-sm py-5 rounded-xl shadow-xl gap-2"
            style={{ boxShadow: "0 0 24px rgba(168, 85, 247, 0.4)" }}
          >
            הורידו לקובץ PDF 📥
          </Button>

          {/* Sub text */}
          <p className="text-[11px] text-white/60 -mt-1">
            שמרו על המחשב והדפיסו מתי שתרצו
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPdfOfferModal;
