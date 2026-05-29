import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import PayPalButton from "./PayPalButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { openGrowCheckout } from "@/config/grow-links";

interface ColoringPurchaseModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  storyId: string | null;
  illustrationCount: number;
  onSuccess?: () => void;
}

type Option = "single" | "story";

const ColoringPurchaseModal = ({
  open,
  onOpenChange,
  storyId,
  illustrationCount,
  onSuccess,
}: ColoringPurchaseModalProps) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Option>("story");
  const [showPaypal, setShowPaypal] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const options = {
    single: {
      packageId: "coloring_single",
      price: 9.9,
      title: "דף צביעה אחד",
      subtitle: "עמוד אחד לבחירה",
      badge: null as string | null,
    },
    story: {
      packageId: "coloring_story",
      price: 24.9,
      title: "כל דפי הסיפור",
      subtitle: `${illustrationCount} דפי צביעה — אחד לכל איור`,
      badge: "הכי משתלם 💰",
    },
  } as const;

  const current = options[selected];

  const handleGrowCheckout = () => {
    openGrowCheckout(selected === "single" ? "coloringSingle" : "coloringBundle");
    onOpenChange(false);
  };

  const handlePayPalSuccess = async (orderId: string) => {
    if (!user) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-purchase", {
        body: {
          orderId,
          packageId: current.packageId,
          amount: current.price,
          userId: user.id,
          storyId: storyId ?? undefined,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Verification failed");
      window.dispatchEvent(new CustomEvent("coloring-credits-updated"));
      toast.success("🎨 דפי הצביעה נפתחו!");
      setShowPaypal(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error("[ColoringPurchase] verify failed", err);
      toast.error("שגיאה באימות הרכישה. נסו שוב.");
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) setShowPaypal(false);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        dir="rtl"
        className="max-w-md border-white/20 bg-gradient-to-b from-[hsl(260,60%,18%)] via-[hsl(270,40%,22%)] to-[hsl(250,50%,14%)] text-white p-0 overflow-hidden"
      >
        <div className="p-5">
          <h2 className="text-xl font-black text-center mb-1">🎨 רוצה לצבוע את הסיפור?</h2>
          <p className="text-xs text-white/70 text-center mb-4">
            הפכו כל איור לדף צביעה קסום ✨
          </p>

          {!showPaypal && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {(Object.keys(options) as Option[]).map((key) => {
                  const opt = options[key];
                  const isSel = selected === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelected(key)}
                      className={cn(
                        "relative flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all",
                        isSel
                          ? "border-pink-400 bg-white/15 scale-[1.02]"
                          : "border-white/15 bg-white/5 hover:border-white/30"
                      )}
                    >
                      {opt.badge && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg">
                          {opt.badge}
                        </div>
                      )}
                      <div className="text-sm font-black mb-1">{opt.title}</div>
                      <div className="text-[11px] text-white/70 mb-2 leading-tight min-h-[28px]">
                        {opt.subtitle}
                      </div>
                      <div className="text-xl font-black text-amber-300">
                        ₪{opt.price.toFixed(2)}
                      </div>
                      <div
                        className={cn(
                          "mt-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                          isSel ? "bg-pink-500" : "border-2 border-white/30"
                        )}
                      >
                        {isSel && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={handleGrowCheckout}
                disabled={!user}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-95 text-white font-black rounded-xl"
                style={{ boxShadow: "0 0 30px rgba(168, 85, 247, 0.4)" }}
              >
                לרכישה — ₪{current.price.toFixed(2)} ✨
              </Button>

              <button
                onClick={() => setShowPaypal(true)}
                disabled={!user}
                className="w-full mt-2 text-xs text-white/60 hover:text-white py-2 underline"
              >
                לתשלום ב-PayPal
              </button>

              <button
                onClick={() => onOpenChange(false)}
                className="w-full mt-2 text-xs text-white/60 hover:text-white py-2"
              >
                אולי בפעם אחרת
              </button>
            </>
          )}

          {showPaypal && (
            <div className="space-y-3">
              <div className="rounded-xl bg-white/10 border border-white/15 p-3 text-center">
                <div className="text-xs text-white/70">לתשלום</div>
                <div className="text-2xl font-black">
                  ₪{current.price.toFixed(2)}
                </div>
                <div className="text-[11px] text-white/60">{current.title}</div>
              </div>

              {verifying ? (
                <div className="flex items-center justify-center py-6 text-white/80">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  מאמת את הרכישה...
                </div>
              ) : (
                <div className="bg-white rounded-xl p-2">
                  <PayPalButton
                    amount={current.price}
                    onSuccess={handlePayPalSuccess}
                    onError={(e) => {
                      console.error(e);
                      toast.error("שגיאה בתשלום. נסו שוב.");
                    }}
                    onCancel={() => setShowPaypal(false)}
                  />
                </div>
              )}

              <button
                onClick={() => setShowPaypal(false)}
                className="w-full text-xs text-white/60 hover:text-white py-2"
              >
                חזרה
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ColoringPurchaseModal;