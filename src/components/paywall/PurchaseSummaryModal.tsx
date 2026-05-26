import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface Feature {
  label: string;
  included: boolean;
}

interface Tier {
  id: string;
  label: string;
  price: number;
  features: readonly Feature[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tier: Tier;
  originalPrice: number;
  finalPrice: number;
  discountPercent: number;
  couponCode: string | null;
  onConfirm: () => void;
}

const PurchaseSummaryModal = ({
  open,
  onOpenChange,
  tier,
  originalPrice,
  finalPrice,
  discountPercent,
  couponCode,
  onConfirm,
}: Props) => {
  const includedFeatures = tier.features.filter((f) => f.included);
  const hasDiscount = discountPercent > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-w-md border-white/20 bg-gradient-to-b from-[hsl(260,60%,18%)] via-[hsl(270,40%,22%)] to-[hsl(250,50%,14%)] text-white p-0 overflow-hidden"
      >
        <div className="p-5">
          <h2 className="text-xl font-black text-center mb-1">סיכום הרכישה 🌿</h2>
          <p className="text-xs text-white/60 text-center mb-4">
            רגע לפני שמשלימים — ודאו שהכל נכון
          </p>

          <div className="rounded-2xl bg-white/10 border border-white/15 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/70 font-semibold">חבילה</span>
              <span className="text-base font-black">{tier.label}</span>
            </div>

            <div className="border-t border-white/10 pt-3 mb-3">
              <div className="text-sm text-white/70 font-semibold mb-2">מה כלול</div>
              <ul className="space-y-1.5">
                {includedFeatures.map((f) => (
                  <li key={f.label} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-white/90 whitespace-pre-line">
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {couponCode && hasDiscount && (
              <div className="flex items-center justify-between border-t border-white/10 pt-3 mb-3">
                <span className="text-sm text-white/70 font-semibold">קופון</span>
                <span className="text-sm font-black text-green-300">
                  {couponCode} (-{discountPercent}%)
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-sm text-white/70 font-semibold">לתשלום</span>
              <span className="text-xl font-black">
                {hasDiscount && (
                  <span className="line-through opacity-50 text-sm mx-1 font-bold">
                    ₪{tier.id === "full" ? "59.90" : originalPrice.toFixed(2)}
                  </span>
                )}
                ₪{(tier.id === "full" && !hasDiscount) ? "59.90" : Number(finalPrice).toFixed(2)}
              </span>
            </div>
          </div>

          <p className="text-xs text-center text-white/60 mb-4">
            📚 הסיפור נשמר בספרייה החינמית שלך לכל החיים
          </p>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                onOpenChange(false);
                onConfirm();
              }}
              className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-400 hover:via-pink-400 hover:to-orange-400 text-white font-black text-sm py-3 rounded-xl shadow-xl"
              style={{ boxShadow: "0 0 30px rgba(168, 85, 247, 0.4)" }}
            >
              אישור ורכישה ₪{(tier.id === "full" && !hasDiscount) ? "59.90" : Number(finalPrice).toFixed(2)} ✨
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full text-white/80 hover:text-white hover:bg-white/10 font-semibold"
            >
              חזרה
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseSummaryModal;