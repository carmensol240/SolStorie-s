import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ShareCompletionBannerProps {
  open: boolean;
  onClose: () => void;
  onShare: () => void;
}

const ShareCompletionBanner = ({ open, onClose, onShare }: ShareCompletionBannerProps) => {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        dir="rtl"
        className="sm:max-w-md p-0 overflow-hidden border-0 bg-gradient-to-br from-[#2a1030] via-[#3a1840] to-[#1a0a1a] text-white"
      >
        <button
          onClick={onClose}
          aria-label="סגירה"
          className="absolute top-3 left-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 pt-8 flex flex-col items-center text-center gap-5">
          <div className="text-5xl" aria-hidden>💛</div>
          <p className="text-lg md:text-xl font-semibold leading-relaxed">
            שתפו את הסיפור שלכם בוואטסאפ עם האנשים שאתם אוהבים 💛
          </p>

          <Button
            onClick={onShare}
            className="w-full gap-2 bg-[#25D366] hover:bg-[#1fb855] text-white font-bold text-base h-12 rounded-full shadow-lg"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
              <path d="M20.52 3.48A11.93 11.93 0 0 0 12.05 0C5.5 0 .2 5.3.2 11.85c0 2.09.55 4.13 1.6 5.93L0 24l6.38-1.67a11.85 11.85 0 0 0 5.67 1.45h.01c6.55 0 11.85-5.3 11.85-11.85 0-3.17-1.23-6.15-3.39-8.45ZM12.06 21.6h-.01a9.74 9.74 0 0 1-4.96-1.36l-.36-.21-3.79.99 1.01-3.69-.23-.38a9.74 9.74 0 0 1-1.5-5.2c0-5.4 4.4-9.79 9.81-9.79 2.62 0 5.08 1.02 6.93 2.87a9.74 9.74 0 0 1 2.87 6.93c0 5.41-4.4 9.81-9.79 9.81Zm5.37-7.34c-.29-.15-1.73-.86-2-.96-.27-.1-.46-.15-.66.15-.2.29-.76.96-.93 1.16-.17.2-.34.22-.63.07-.29-.15-1.23-.45-2.34-1.44a8.7 8.7 0 0 1-1.61-2c-.17-.29-.02-.45.13-.6.14-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.66-1.59-.9-2.18-.24-.57-.48-.49-.66-.5l-.56-.01c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.45 0 1.45 1.05 2.85 1.2 3.05.15.2 2.07 3.16 5.02 4.43.7.3 1.25.48 1.68.62.71.23 1.35.2 1.86.12.57-.08 1.73-.71 1.97-1.39.24-.68.24-1.27.17-1.39-.07-.12-.27-.2-.56-.34Z"/>
            </svg>
            שתפו בוואטסאפ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareCompletionBanner;