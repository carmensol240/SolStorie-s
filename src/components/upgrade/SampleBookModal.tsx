import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ZOO_DEMO_STORY } from "@/data/demo-story";

interface SampleBookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BookPage {
  text: string;
  illustrationUrl: string | null;
}

const CONTENT = {
  title: ZOO_DEMO_STORY.title,
  pages: ZOO_DEMO_STORY.pages
    .map<BookPage>((p) => ({ text: p.text, illustrationUrl: p.illustrationUrl }))
    .filter((p) => p.text.trim().length > 0 && !!p.illustrationUrl),
};

const SampleBookModal = ({ open, onOpenChange }: SampleBookModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-0 max-w-sm overflow-hidden bg-transparent shadow-none"
        dir="rtl"
      >
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(to bottom, #1a0f3a, #2d1a6e)",
            boxShadow:
              "0 20px 60px rgba(45,26,110,0.5), 0 0 0 4px hsl(270 60% 40%), 0 0 0 8px rgba(108,92,231,0.4)",
          }}
        >
          <div className="px-5 pt-5 pb-2 text-center">
            <p className="text-xs text-purple-200/70 font-semibold mb-1">
              סיפור לדוגמא 📖
            </p>
            <h3 className="text-white font-black text-base leading-tight line-clamp-1">
              {CONTENT.title}
            </h3>
          </div>

          {/* Book pages */}
          <div className="px-4 pb-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {CONTENT.pages.map((page, idx) => {
              const isLast = idx === CONTENT.pages.length - 1;
              return (
              <div
                key={idx}
                className="relative rounded-xl overflow-hidden border border-purple-400/30"
              >
                {/* Illustration top */}
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-[#FFFBF5] via-[#F5E6D3] to-[#FAF3E8] overflow-hidden relative">
                  {page.illustrationUrl && (
                    <img
                      src={page.illustrationUrl}
                      alt={page.text ? `איור לעמוד: ${page.text.slice(0, 60)}` : "איור מהסיפור לדוגמא"}
                      className={`w-full object-cover ${isLast ? "h-[200%] absolute bottom-0 left-1/2 -translate-x-1/2" : "h-full"}`}
                      style={isLast ? { objectPosition: "center bottom" } : undefined}
                      loading="lazy"
                    />
                  )}
                </div>
                {/* Text bottom */}
                <div
                  className="p-4"
                  style={{ background: "linear-gradient(135deg, #2d1a6e, #1a0f3a)" }}
                >
                  <p
                    className="text-purple-100 text-right text-sm leading-relaxed font-medium"
                    dir="rtl"
                  >
                    {page.text}
                  </p>
                </div>
                {/* Spine shadow */}
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
              </div>
              );
            })}
          </div>

          <div className="px-5 pb-5 text-center">
            <p className="text-purple-200/60 text-xs">
              צרו את הסיפור הראשון שלכם וקבלו ספר אישי ✨
            </p>
            <p className="text-purple-200/40 text-[10px] italic mt-2">
              תצוגה מקדימה בלבד – הספר המודפס יהיה מעוצב במיוחד להדפסה
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SampleBookModal;