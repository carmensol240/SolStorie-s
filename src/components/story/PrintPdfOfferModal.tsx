import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, BookOpen } from "lucide-react";

interface PrintPdfOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coverUrl?: string | null;
  childName?: string;
  storyTitle?: string;
  onPurchase: () => void;
}

const PrintPdfOfferModal = ({
  open,
  onOpenChange,
  coverUrl,
  childName,
  storyTitle,
  onPurchase,
}: PrintPdfOfferModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm p-0 overflow-hidden border-purple-500/30 bg-gradient-to-b from-[hsl(260,60%,15%)] via-[hsl(270,40%,20%)] to-[hsl(250,50%,12%)]"
        dir="rtl"
      >
        <DialogTitle className="sr-only">קבלו קובץ PDF להדפסה</DialogTitle>

        {/* Floating sparkles bg */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-6 left-8 w-32 h-32 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="absolute bottom-10 right-6 w-40 h-40 rounded-full bg-pink-400/10 blur-3xl" />
        </div>

        <div className="relative px-5 pt-6 pb-6 flex flex-col items-center text-center gap-4">
          {/* Title */}
          <div>
            <h2 className="text-xl font-black text-white leading-tight">
              הסיפור שלך מוכן להדפסה! 📖
            </h2>
            <p className="text-sm text-white/70 font-semibold mt-1">
              תדפיס ותחזיק בידיים
            </p>
          </div>

          {/* Book mockup */}
          <div className="relative w-44 h-56 mt-1">
            {/* Book spine shadow */}
            <div className="absolute inset-y-2 -right-1 w-3 rounded-l-md bg-gradient-to-l from-black/60 to-transparent" />
            {/* Book body */}
            <div
              className="relative w-full h-full rounded-md overflow-hidden border-2 border-amber-300/40"
              style={{
                boxShadow:
                  "0 25px 50px -12px rgba(0,0,0,0.7), 0 0 30px rgba(168,85,247,0.35)",
                transform: "perspective(700px) rotateY(-10deg)",
                transformOrigin: "right center",
              }}
            >
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={storyTitle || "סיפור"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-700 to-pink-700">
                  <BookOpen className="w-12 h-12 text-white/70" />
                </div>
              )}
              {/* Page edge */}
              <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-white/60 to-transparent" />
              {/* Title overlay */}
              {(storyTitle || childName) && (
                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  {storyTitle && (
                    <div className="text-white font-extrabold text-[11px] leading-tight line-clamp-2">
                      {storyTitle}
                    </div>
                  )}
                  {childName && (
                    <div className="text-amber-300 font-bold text-[10px] mt-0.5">
                      {childName}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Badge */}
            <div className="absolute -top-2 -left-2 rotate-[-12deg] px-2 py-0.5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-amber-950 text-[10px] font-black shadow-lg border border-yellow-200/70">
              PDF
            </div>
          </div>

          {/* Price button */}
          <Button
            onClick={onPurchase}
            className="w-full mt-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-400 hover:via-pink-400 hover:to-orange-400 text-white font-black text-sm py-5 rounded-xl shadow-xl gap-2"
            style={{ boxShadow: "0 0 24px rgba(168, 85, 247, 0.4)" }}
          >
            <Printer className="w-4 h-4" />
            קבל קובץ PDF – 39.90₪
          </Button>
          <p className="text-[11px] text-white/50 -mt-2">תשלום חד פעמי</p>
          <p className="text-[10px] text-orange-300/90 font-semibold -mt-1">
            🔥 מחיר השקה — המחיר יעלה בקרוב
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPdfOfferModal;