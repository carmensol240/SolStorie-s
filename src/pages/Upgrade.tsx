import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, Check } from "lucide-react";

const WHITELISTED_TEST_EMAIL = "carmit1901+test@gmail.com";
import { Button } from "@/components/ui/button";
import PurchaseSuccessModal from "@/components/paywall/PurchaseSuccessModal";
import PurchaseFailedModal from "@/components/paywall/PurchaseFailedModal";
import CouponInput from "@/components/paywall/CouponInput";
import FirstPurchaseBonusModal from "@/components/paywall/FirstPurchaseBonusModal";
import SampleBookModal from "@/components/upgrade/SampleBookModal";
import PurchaseSummaryModal from "@/components/paywall/PurchaseSummaryModal";

import { useCredits } from "@/hooks/use-credits";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tier = "digital" | "full";

const TIERS = {
  digital: {
    id: "digital" as Tier,
    label: "דיגיטלי",
    price: 29.90,
    features: [
      { label: "סיפור דיגיטלי יחיד", included: true },
      { label: "קובץ PDF להדפסה עצמית והפיכת הסיפור לספר 📖", included: false },
      { label: "🎨 דף צביעה און ליין ולהדפסה", included: false },
      { label: "✏️ תיקון טקסט חינם\n\n", included: true },
      { label: "📚 ספרייה חינמית לכל החיים", included: true },
      { label: "🎙️ ניתן להקליט בקולך ולהשמיע מרחוק", included: true },
      { label: "🎵 מוזיקת רקע של יער קסום", included: true },
    ],
  },
  full: {
    id: "full" as Tier,
    label: "דיגיטלי + מודפס",
    price: 59.90,
    features: [
      { label: "✅ כולל את כל מה שבחבילה הדיגיטלית +", included: true },
      { label: "🎨 דף צביעה און ליין ולהדפסה", included: true },
      { label: "קובץ להדפסה עצמית לספר 📖", included: true },
    ],
  },
} as const;

const Upgrade = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const firstStoryId = searchParams.get("firstStory");

  const { user } = useAuth();
  const { refetch: refetchCredits } = useCredits();
  const { trackEvent } = useAnalytics();

  const [selectedTier, setSelectedTier] = useState<Tier>("full");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [showBonus, setShowBonus] = useState(false);
  const [showSampleBook, setShowSampleBook] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);

  const isTestUser = user?.email?.toLowerCase() === WHITELISTED_TEST_EMAIL.toLowerCase();

  const selectedTierData = TIERS[selectedTier];
  const discountedPrice = Math.round(selectedTierData.price * (1 - discountPercent / 100));

  const handleClose = () => {
    try {
      const raw = sessionStorage.getItem("pendingStoryReturn");
      if (raw) {
        const parsed = JSON.parse(raw);
        sessionStorage.removeItem("pendingStoryReturn");
        if (parsed?.path) {
          navigate(`${parsed.path}?paywall=1`);
          return;
        }
      }
    } catch {}
    if (user && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  useEffect(() => {
    trackEvent({ eventType: "feature_used", metadata: { feature: "paywall_view", tier: selectedTier } });
  }, [trackEvent, selectedTier]);

  const handleTestPurchase = async () => {
    if (!isTestUser || !user) return;
    try {
      const testOrderId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const { data, error } = await supabase.functions.invoke("verify-purchase", {
        body: {
          orderId: testOrderId,
          packageId: selectedTier === "digital" ? "single_story_digital" : "single_story_full",
          amount: 1,
          userId: user.id,
          testMode: true,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Test purchase failed");
      refetchCredits();
      window.dispatchEvent(new CustomEvent("purchase-completed"));
      setShowSuccess(true);
      trackEvent({ eventType: "feature_used", metadata: { feature: "test_purchase_completed", tier: selectedTier } });
      toast.success("🧪 רכישת בדיקה הצליחה");
      try {
        const { data: bonus } = await supabase.functions.invoke("grant-first-purchase-bonus");
        if (bonus?.granted) {
          setShowBonus(true);
          refetchCredits();
        }
      } catch (err) {
        console.error("bonus grant failed", err);
      }
    } catch (error) {
      console.error("Test purchase failed:", error);
      toast.error("שגיאה ברכישה");
    }
  };

  const handlePurchase = () => {
    if (!user) { navigate("/auth"); return; }
    if (isTestUser) { handleTestPurchase(); return; }
    toast.info("בקרוב — אמצעי תשלום חדשים בדרך! 🌿");
  };

  const handleRetry = () => {
    setShowFailed(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden" dir="rtl">
      {/* Magical dark background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(260,60%,15%)] via-[hsl(270,40%,20%)] to-[hsl(250,50%,12%)]" />

      {/* Floating stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/60 animate-pulse"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/3 right-5 w-56 h-56 rounded-full bg-pink-400/8 blur-3xl" />
        <div className="absolute bottom-32 left-1/4 w-48 h-48 rounded-full bg-amber-400/8 blur-3xl" />
      </div>

      {/* Close Button */}
      <div className="absolute top-3 left-3 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pb-32 relative z-10" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="container max-w-md mx-auto px-4 pt-8">
          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-black text-white mb-1">
              אהבתם את הסיפור? 💛
            </h1>
            <p className="text-sm text-white/70 font-semibold">
              בחרו איך תרצו להמשיך
            </p>
          </div>

          {/* Tier Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(Object.values(TIERS) as Array<typeof TIERS.digital>).map((tier) => {
              const isSelected = selectedTier === tier.id;
              return (
                <button
                  key={tier.id}
                  onClick={() => {
                    setSelectedTier(tier.id);
                  }}
                  className={cn(
                    "relative flex flex-col items-center p-4 pt-5 rounded-2xl border transition-all duration-200",
                    "bg-white/10 backdrop-blur-md",
                    isSelected
                      ? "border-white/50 shadow-lg scale-[1.03] bg-white/20 ring-2 ring-white/30"
                      : "border-white/15 hover:border-white/30"
                  )}
                >
                  {tier.id === "full" && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); setShowSampleBook(true); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setShowSampleBook(true); } }}
                      className="absolute -top-3 -right-3 z-10 rotate-12 px-2.5 py-1 rounded-full text-[11px] font-black text-white bg-gradient-to-br from-yellow-400 via-orange-400 to-amber-500 border border-yellow-200/70 shadow-[0_0_18px_rgba(251,191,36,0.7)] cursor-pointer hover:scale-110 active:scale-95 transition-transform animate-pulse"
                      style={{ textShadow: "0 1px 2px rgba(120,53,15,0.4)" }}
                    >
                      📖 לדוגמא לספר המודפס
                    </span>
                  )}
                  {tier.id === "digital" && (
                    <div className="mb-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[10px] font-bold border border-green-500/30">
                      🌱 מושלם להתחיל!
                    </div>
                  )}
                  <div className="text-lg font-black text-white mb-1">{tier.label}</div>
                  <div className="text-2xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent mb-3">
                    ₪{tier.price.toFixed(2)}
                  </div>
                  <div className="w-full space-y-2">
                    {(tier.id === "digital" ? tier.features.filter((f) => f.included) : tier.features).map((feature) => (
                      <div key={feature.label} className="flex items-center gap-2">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-400 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                        <span
                          className={cn(
                            "text-xs font-semibold whitespace-pre-line",
                            feature.included ? "text-white/90" : "text-white/40 line-through"
                          )}
                        >
                          {feature.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  {isSelected && (
                    <div className="mt-3 w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Coupon */}
          <div className="mb-4">
            <CouponInput
              onDiscountApplied={(percent, code) => {
                setDiscountPercent(percent);
                setAppliedCouponCode(code || null);
              }}
              onStoriesAdded={() => { refetchCredits(); }}
            />
          </div>


          {/* Terms */}
          <p className="text-xs text-center text-white/40 mt-2 mb-4">
            בלחיצה על "רכשו" הינך מסכים/ה ל
            <a href="/privacy" className="text-purple-300 underline font-semibold mx-1">מדיניות הפרטיות</a>
            ול
            <a href="/terms" className="text-purple-300 underline font-semibold mx-1">תנאי השימוש</a>
          </p>

        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-[hsl(250,50%,12%)]/95 backdrop-blur border-t border-white/10 px-4 py-3 safe-area-bottom z-20">
        <div className="container max-w-md mx-auto flex flex-col items-center gap-1">
          <Button
            onClick={() => {
              if (!user) { navigate("/auth"); return; }
              setShowSummary(true);
              trackEvent({ eventType: "feature_used", metadata: { feature: "purchase_summary_viewed", tier: selectedTier } });
            }}
            className="w-full relative overflow-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-400 hover:via-pink-400 hover:to-orange-400 text-white font-black text-sm py-3 rounded-xl shadow-xl before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.15)_50%,transparent_70%)] before:bg-[length:200%_100%] before:animate-[cta-shimmer_4s_ease-in-out_infinite]"
            style={{ boxShadow: "0 0 30px rgba(168, 85, 247, 0.4), 0 0 60px rgba(236, 72, 153, 0.2)" }}
          >
            {discountPercent > 1 ? (
              <>
                רכשו {selectedTierData.label} ב-
                <span className="line-through opacity-60 mx-1">₪{selectedTierData.price.toFixed(2)}</span>
                ₪{discountedPrice} ✨
              </>
            ) : (
              <>רכשו {selectedTierData.label} ב-₪{selectedTierData.price.toFixed(2)} ✨</>
            )}
          </Button>
        </div>
      </div>

      {/* Modals */}
      <PurchaseSuccessModal open={showSuccess} onOpenChange={setShowSuccess} creditsAdded={1} />
      <PurchaseFailedModal open={showFailed} onOpenChange={setShowFailed} onRetry={handleRetry} />
      <FirstPurchaseBonusModal open={showBonus} onOpenChange={setShowBonus} />
      <SampleBookModal open={showSampleBook} onOpenChange={setShowSampleBook} />
      <PurchaseSummaryModal
        open={showSummary}
        onOpenChange={setShowSummary}
        tier={selectedTierData}
        originalPrice={selectedTierData.price}
        finalPrice={discountedPrice}
        discountPercent={discountPercent}
        couponCode={appliedCouponCode}
        onConfirm={handlePurchase}
      />
    </div>
  );
};

export default Upgrade;
