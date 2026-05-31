import { useState, useEffect } from "react";
import { Printer, Sparkles, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "pdf_feature_popup_shown";

interface PdfFeaturePopupProps {
  userId: string | undefined;
}

const PdfFeaturePopup = ({ userId }: PdfFeaturePopupProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    // Only show after a new story was just created
    const justCreated = sessionStorage.getItem("just_created_story");
    if (!justCreated) return;
    
    const key = `${STORAGE_KEY}_${userId}`;
    if (!localStorage.getItem(key)) {
      const timer = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  const handleClose = () => {
    if (userId) {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, "true");
    }
    sessionStorage.removeItem("just_created_story");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[360px] rounded-3xl border-2 border-white/30 bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 p-0 overflow-hidden" dir="rtl">
        {/* Decorative top bar */}
        <div className="h-2 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400" />

        <div className="px-6 pt-5 pb-6 flex flex-col items-center text-center gap-4">
          {/* Icon cluster */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Printer className="w-8 h-8 text-white" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-amber-400 animate-pulse" />
            <Sparkles className="absolute -bottom-1 -left-2 w-4 h-4 text-purple-400 animate-pulse" style={{ animationDelay: "0.5s" }} />
          </div>

          <DialogHeader className="gap-2">
            <DialogTitle className="text-lg font-black bg-gradient-to-r from-purple-700 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              הסיפור שלכם מוכן לקריאה ולדפוס! ✨
            </DialogTitle>
            <DialogDescription className="text-sm text-foreground/70 leading-relaxed">
              הידעתם? ניתן להוריד כל סיפור שיצרתם כקובץ PDF מעוצב להדפסה ביתית – ללא כל עלות נוספת. כך תוכלו להוסיף את הסיפור שלכם לספרייה הפיזית בבית!
            </DialogDescription>
          </DialogHeader>

          <Button
            onClick={handleClose}
            className="w-full rounded-xl py-5 text-base font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white hover:opacity-90 transition-opacity"
          >
            איזה כיף! בואו נקרא 🎉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfFeaturePopup;
