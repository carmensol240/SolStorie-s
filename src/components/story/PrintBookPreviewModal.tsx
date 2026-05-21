import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { getPublicIllustrationUrl } from "@/lib/illustration-url";
import "@/components/upgrade/flipping-book.css";

interface PrintBookPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childName: string;
  coverUrl?: string | null;
  illustrations: string[]; // raw storage paths or urls
  onDownload: () => void;
}

export const PrintBookPreviewModal = ({
  open,
  onOpenChange,
  childName,
  coverUrl,
  illustrations,
  onDownload,
}: PrintBookPreviewModalProps) => {
  const slides = [coverUrl || null, ...illustrations.slice(0, 4).map(getPublicIllustrationUrl)].filter(Boolean) as string[];
  const [idx, setIdx] = useState(0);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (!open || slides.length <= 1) return;
    const t = setInterval(() => {
      setFlipping(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % slides.length);
        setFlipping(false);
      }, 450);
    }, 2400);
    return () => clearInterval(t);
  }, [open, slides.length]);

  useEffect(() => {
    if (open) setIdx(0);
  }, [open]);

  const currentSrc = slides[idx];
  const isCover = idx === 0 && !!coverUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-gradient-to-b from-[#1a0a3e] via-[#2a1050] to-[#1a0a3e] border-purple-500/30" dir="rtl">
        <DialogTitle className="sr-only">תצוגה מקדימה של הספר המודפס</DialogTitle>
        <div className="p-5 pt-7">
          <div className="fba-root">
            <div className="fba-heading">✨ כך ייראה הספר של {childName} מודפס</div>
            <div className="fba-scene">
              <div className="fba-spine">
                <span className="fba-spine-text">{childName} · SolStorie&apos;s™</span>
              </div>
              <div className="fba-book" style={{ perspective: "900px" }}>
                <img
                  key={idx}
                  className="fba-cover-img"
                  src={currentSrc}
                  alt=""
                  loading="lazy"
                  style={{
                    transition: "transform 0.45s ease-in-out, opacity 0.45s",
                    transformOrigin: "left center",
                    transform: flipping ? "rotateY(-75deg)" : "rotateY(0)",
                    opacity: flipping ? 0.3 : 1,
                  }}
                />
                <div className="fba-badge">✨ SolStorie&apos;s™</div>
                {isCover && (
                  <div className="fba-overlay">
                    <div className="fba-title">{childName}</div>
                    <div className="fba-subtitle">💛 הסיפור של {childName}</div>
                    <div className="fba-logo-text">SolStorie&apos;s™ · soulstory.co.il</div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-center gap-1.5 mt-3">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-amber-400 w-4" : "bg-white/30"}`}
                />
              ))}
            </div>
          </div>

          <p className="text-center text-white/85 text-sm mt-5 leading-relaxed">
            קובץ PDF מוכן להדפסה – הדפיסו בבית או שלחו לבית דפוס
          </p>

          <Button
            onClick={onDownload}
            className="w-full mt-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-amber-950 font-bold py-3 rounded-full shadow-xl gap-2"
          >
            <Printer className="w-5 h-5" />
            🖨️ להורדת קובץ ה-PDF המלא
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintBookPreviewModal;