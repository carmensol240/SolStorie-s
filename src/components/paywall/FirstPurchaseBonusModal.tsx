import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FirstPurchaseBonusModal = ({ open, onOpenChange }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-w-sm border-0 p-0 overflow-hidden bg-gradient-to-b from-[hsl(260,60%,18%)] via-[hsl(270,45%,22%)] to-[hsl(250,55%,14%)]"
      >
        <div className="relative px-6 pt-8 pb-6 text-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-6 w-24 h-24 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="absolute bottom-4 right-6 w-28 h-28 rounded-full bg-pink-400/20 blur-3xl" />
          </div>
          <div className="relative">
            <div className="text-7xl mb-4 animate-bounce">🎁</div>
            <h2 className="text-2xl font-black text-white mb-3">
              מתנה בשבילך!
            </h2>
            <p className="text-sm text-white/80 font-semibold mb-6 leading-relaxed">
              קיבלת סיפור נוסף במתנה! יוסף אוטומטית לחשבונך
            </p>
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-400 hover:via-pink-400 hover:to-orange-400 text-white font-black text-sm py-3 rounded-xl shadow-xl"
              style={{ boxShadow: "0 0 30px rgba(168, 85, 247, 0.4), 0 0 60px rgba(236, 72, 153, 0.2)" }}
            >
              תודה! ✨
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FirstPurchaseBonusModal;