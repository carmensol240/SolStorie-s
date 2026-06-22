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
  storyTitle: string;
  coverUrl?: string | null;
  pages: { illustration_url: string | null; text: string }[];
  onDownload: () => void;
}

export const PrintBookPreviewModal = ({
  open,
  onOpenChange,
  childName,
  storyTitle,
  coverUrl,
  pages,
  onDownload,
}: PrintBookPreviewModalProps) => {
  type Slide =
    | { type: "cover"; src: string }
    | { type: "image"; src: string }
    | { type: "text"; text: string };

  const slides: Slide[] = [];
  if (coverUrl) slides.push({ type: "cover", src: coverUrl });
  pages.slice(0, 4).forEach((p) => {
    if (p.illustration_url) {
      slides.push({ type: "image", src: getPublicIllustrationUrl(p.illustration_url) });
    }
    if (p.text && p.text.trim()) {
      slides.push({ type: "text", text: p.text.trim() });
    }
  });
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

  const current = slides[idx];
  const isCover = current?.type === "cover";

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
                {current?.type === "text" ? (
                  <div
                    key={idx}
                    className="fba-cover-img flex items-center justify-center p-5 text-center"
                    style={{
                      background: "linear-gradient(180deg, #1a0a3e 0%, #2a1050 100%)",
                      transition: "transform 0.45s ease-in-out, opacity 0.45s",
                      transformOrigin: "left center",
                      transform: flipping ? "rotateY(-75deg)" : "rotateY(0)",
                      opacity: flipping ? 0.3 : 1,
                    }}
                  >
                    <p
                      className="text-white font-medium overflow-hidden"
                      style={{
                        fontSize: "0.95rem",
                        lineHeight: 1.55,
                        display: "-webkit-box",
                        WebkitLineClamp: 9,
                        WebkitBoxOrient: "vertical",
                        textShadow: "0 1px 2px rgba(0,0,0,0.35)",
                      }}
                    >
                      {current.text}
                    </p>
                  </div>
                ) : (
                  <img
                    key={idx}
                    className="fba-cover-img"
                    src={current?.src}
                    alt={current?.type === "cover" ? `כריכת הספר של ${childName}` : `איור מהספר של ${childName}`}
                    loading="lazy"
                    style={{
                      transition: "transform 0.45s ease-in-out, opacity 0.45s",
                      transformOrigin: "left center",
                      transform: flipping ? "rotateY(-75deg)" : "rotateY(0)",
                      opacity: flipping ? 0.3 : 1,
                    }}
                  />
                )}
                <div className="fba-badge">✨ SolStorie&apos;s™</div>
                {isCover && (
                  <div className="fba-overlay">
                    <div
                      className="text-white font-extrabold leading-tight"
                      style={{ fontSize: "1.25rem", textShadow: "0 2px 6px rgba(0,0,0,0.55)" }}
                    >
                      {storyTitle}
                    </div>
                    <div
                      className="font-bold mt-1"
                      style={{ color: "#fbbf24", fontSize: "1.05rem", textShadow: "0 2px 6px rgba(0,0,0,0.55)" }}
                    >
                      {childName}
                    </div>
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