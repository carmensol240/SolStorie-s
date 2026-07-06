import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, Check, Flame } from "lucide-react";

const WHITELISTED_TEST_EMAILS = [
  "carmit1901+test@gmail.com",
  "souldesign06@gmail.com",
];
import { Button } from "@/components/ui/button";
import PurchaseSuccessModal from "@/components/paywall/PurchaseSuccessModal";
import PurchaseFailedModal from "@/components/paywall/PurchaseFailedModal";
import CouponInput from "@/components/paywall/CouponInput";
import FirstPurchaseBonusModal from "@/components/paywall/FirstPurchaseBonusModal";
import SampleBookModal from "@/components/upgrade/SampleBookModal";
import ColoringPurchaseModal from "@/components/paywall/ColoringPurchaseModal";

import { useCredits } from "@/hooks/use-credits";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { openGrowCheckout } from "@/config/grow-links";

type ProductId = "digital" | "popular" | "coloring_pages";

interface Product {
  id: Exclude<ProductId, "coloring_pages">;
  title: string;
  description: string;
  launchPrice: number;
  originalPrice: number;
  growKey: "basic" | "popular";
  features: string[];
  badge?: string;
}

const PRODUCTS: Product[] = [
  {
    id: "digital",
    title: "דיגיטלי",
    description: "סיפור דיגיטלי בודד",
    launchPrice: 29.90,
    originalPrice: 39.90,
    growKey: "basic",
    features: [
      "✨ הילד שלך — הגיבור של הסיפור",
      "🎨 דמות מותאמת אישית עם הפנים שלו",
      "🎵 מוזיקת רקע קסומה",
      "🎙️ הקלטה והשמעה",
      "📚 הסיפור שמור לתמיד",
    ],
  },
  {
    id: "popular",
    title: "הכי פופולרי",
    description: "סיפור דיגיטלי + PDF + דפי צביעה",
    launchPrice: 99.90,
    originalPrice: 119.90,
    growKey: "popular",
    badge: "הכי פופולרי 🔥",
    features: [
      "✨ הילד שלך — הגיבור של הסיפור",
      "🎨 דמות מותאמת אישית עם הפנים שלו",
      "🎵 מוזיקת רקע קסומה",
      "🎙️ הקלטה והשמעה",
      "📖 קובץ PDF להדפסה",
      "🎨 חבילת דפי צביעה מלאה לכל איורי הסיפור",
      "📚 הסיפור שמור לתמיד",
    ],
  },
];

const LAUNCH_DEADLINE = new Date("2026-07-12T23:59:59");

function useCountdown(target: Date) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const diff = Math.max(0, target.getTime() - now.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds, expired: diff === 0 };
  }, [now, target]);
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="min-w-[3.2rem] sm:min-w-[3.6rem] bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-2 py-2 text-center">
        <span className="text-xl sm:text-2xl font-black text-white tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[10px] sm:text-xs text-white/70 font-semibold mt-1">{label}</span>
    </div>
  );
}

const Upgrade = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const firstStoryId = searchParams.get("firstStory");

  const { user } = useAuth();
  const { refetch: refetchCredits } = useCredits();
  const { trackEvent } = useAnalytics();

  const [selectedProduct, setSelectedProduct] = useState<ProductId>("popular");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [showBonus, setShowBonus] = useState(false);
  const [showSampleBook, setShowSampleBook] = useState(false);
  const [showColoringModal, setShowColoringModal] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [coloringStoryId, setColoringStoryId] = useState<string | null>(null);

  const countdown = useCountdown(LAUNCH_DEADLINE);
  const isTestUser = !!user?.email &&
    WHITELISTED_TEST_EMAILS.includes(user.email.toLowerCase());

  const selectedProductData = PRODUCTS.find((p) => p.id === selectedProduct)!;
  const selectedBasePrice = selectedProductData.launchPrice;
  const selectedFinalPrice =
    Math.round(selectedBasePrice * (1 - discountPercent / 100) * 100) / 100;

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
    trackEvent({ eventType: "feature_used", metadata: { feature: "paywall_view", product: selectedProduct } });
  }, [trackEvent, selectedProduct]);

  useEffect(() => {
    let storyIdForCheckout: string | null = null;
    try {
      const raw = sessionStorage.getItem("pendingStoryReturn");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.path && typeof parsed.path === "string") {
          const m = parsed.path.match(/\/story\/([^/?#]+)/);
          if (m) storyIdForCheckout = m[1];
        }
      }
    } catch {}
    setColoringStoryId(storyIdForCheckout);
  }, []);

  const handleTestPurchase = async () => {
    if (!isTestUser || !user) return;
    try {
      const testOrderId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const { data, error } = await supabase.functions.invoke("verify-purchase", {
        body: {
          orderId: testOrderId,
          packageId: "single_story_full",
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
      trackEvent({ eventType: "feature_used", metadata: { feature: "test_purchase_completed", product: "popular" } });
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
    if (selectedProduct === "coloring_pages") {
      setShowColoringModal(true);
      return;
    }
    let storyIdForCheckout: string | null = null;
    try {
      const raw = sessionStorage.getItem("pendingStoryReturn");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.path && typeof parsed.path === "string") {
          const m = parsed.path.match(/\/story\/([^/?#]+)/);
          if (m) storyIdForCheckout = m[1];
        }
      }
    } catch {}
    openGrowCheckout(selectedProductData.growKey, {
      ...(discountPercent > 0
        ? { discountPercent, couponCode: appliedCouponCode }
        : {}),
      userId: user.id,
      storyId: storyIdForCheckout,
    });
  };

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    let polling = false;
    let baselineCredits: number | null = null;

    const readCredits = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("story_credits, coloring_credits, editing_credits, free_edits_remaining, is_subscriber")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    };

    const startPoll = async () => {
      if (polling || cancelled) return;
      polling = true;
      try {
        const initial = await readCredits();
        baselineCredits = initial?.story_credits ?? 0;
        const baselineColoring = initial?.coloring_credits ?? 0;
        const baselineEditing = initial?.editing_credits ?? 0;
        const baselineSub = !!initial?.is_subscriber;

        const MAX_ATTEMPTS = 20;
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
          if (cancelled) return;
          await new Promise((r) => setTimeout(r, 2000));
          const fresh = await readCredits();
          if (!fresh) continue;
          const changed =
            (fresh.story_credits ?? 0) > baselineCredits! ||
            (fresh.coloring_credits ?? 0) > baselineColoring ||
            (fresh.editing_credits ?? 0) > baselineEditing ||
            (!!fresh.is_subscriber && !baselineSub);
          if (changed) {
            refetchCredits();
            window.dispatchEvent(new CustomEvent("purchase-completed"));
            toast.success("הרכישה התקבלה ✅");
            return;
          }
        }
      } finally {
        polling = false;
      }
    };

    const onFocus = () => { startPoll(); };
    const onVisibility = () => {
      if (document.visibilityState === "visible") startPoll();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user?.id, refetchCredits]);

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

      <div className="flex-1 overflow-y-auto pb-28 relative z-10" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="container max-w-md mx-auto px-4 pt-8">
          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-black text-white mb-1">
              מוכנים לסיפור הבא? 🚀
            </h1>
            <p className="text-sm text-white/70 font-semibold">
              בחרו חבילה וחזרו ליצור
            </p>
          </div>

          {/* Countdown */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-red-500/10 p-4 mb-3 text-center">
            <div className="absolute top-1 right-2 text-xl opacity-40">🔥</div>
            <div className="absolute top-1 left-2 text-xl opacity-40">🔥</div>
            <p className="text-sm font-black text-amber-200 mb-3">
              מחיר השקה מיוחד — ההצעה מסתיימת בעוד:
            </p>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <CountdownUnit value={countdown.days} label="ימים" />
              <span className="text-xl font-black text-white/60">:</span>
              <CountdownUnit value={countdown.hours} label="שעות" />
              <span className="text-xl font-black text-white/60">:</span>
              <CountdownUnit value={countdown.minutes} label="דקות" />
              <span className="text-xl font-black text-white/60">:</span>
              <CountdownUnit value={countdown.seconds} label="שניות" />
            </div>
            <p className="text-xs font-bold text-amber-200/80 mt-3">
              אחרי 12/7 המחירים יעלו
            </p>
          </div>

          {/* Product Cards */}
          <div className="space-y-3 mb-4">
            {PRODUCTS.map((product) => {
              const isSelected = selectedProduct === product.id;
              return (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product.id)}
                  className={cn(
                    "relative w-full flex flex-col rounded-2xl border transition-all duration-200 p-4 text-right",
                    "bg-white/10 backdrop-blur-md",
                    isSelected
                      ? "border-white/50 shadow-lg scale-[1.02] bg-white/20 ring-2 ring-white/30"
                      : "border-white/15 hover:border-white/30",
                    product.id === "popular" && "shadow-[0_0_25px_rgba(168,85,247,0.35)] border-purple-400/40",
                    product.id === "popular" && isSelected && "shadow-[0_0_40px_rgba(236,72,153,0.5)] border-pink-400/60 ring-2 ring-pink-400/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-lg font-black text-white">{product.title}</span>
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          <Flame className="w-3 h-3" />
                          מחיר השקה
                        </span>
                      </div>
                      <p className="text-xs text-white/70 font-semibold">{product.description}</p>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-white/50 line-through font-semibold">
                        ₪{product.originalPrice.toFixed(2)}
                      </span>
                      <span className="text-xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
                        ₪{product.launchPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {product.id === "popular" && (
                    <div className="mt-2 mb-2 flex items-center gap-1">
                      <span className="text-[11px] font-black text-green-300">
                        חסכו ₪{(product.originalPrice - product.launchPrice).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5">
                    {product.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        <span className="text-[11px] font-semibold text-white/90 leading-tight">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}

            {/* Coloring pages — unchanged price, no launch tag */}
            <button
              onClick={() => setSelectedProduct("coloring_pages")}
              className={cn(
                "relative w-full flex flex-col rounded-2xl border transition-all duration-200 p-4 text-right",
                "bg-white/10 backdrop-blur-md",
                selectedProduct === "coloring_pages"
                  ? "border-white/50 shadow-lg scale-[1.02] bg-white/20 ring-2 ring-white/30"
                  : "border-white/15 hover:border-white/30"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-lg font-black text-white mb-1">🎨 דפי צביעה</div>
                  <p className="text-xs text-white/70 font-semibold">דפי צביעה לכל איורי הסיפור</p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-xl font-black text-pink-300">₪24.90</span>
                  <span className="text-[10px] text-white/60 font-semibold">או דף בודד ₪9.90</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5">
                {[
                  "🎨 צביעה אונליין באפליקציה",
                  "🖨️ הדפסה מהבית",
                  "✨ דף לכל איור בסיפור",
                  "📚 שמור לתמיד",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-white/90 leading-tight">{feature}</span>
                  </div>
                ))}
              </div>
            </button>
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

          {/* Gift Card Entry */}
          <div dir="rtl" className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-orange-500/10 p-5 mb-4 text-center">
            <span aria-hidden className="pointer-events-none absolute top-2 right-3 text-2xl opacity-70 animate-bounce" style={{ animationDuration: "2.6s" }}>🎈</span>
            <span aria-hidden className="pointer-events-none absolute top-2 left-3 text-2xl opacity-70 animate-pulse">✨</span>
            <span aria-hidden className="pointer-events-none absolute bottom-2 right-4 text-xl opacity-60 animate-pulse" style={{ animationDelay: "0.5s" }}>🎉</span>
            <span aria-hidden className="pointer-events-none absolute bottom-2 left-4 text-xl opacity-60 animate-bounce" style={{ animationDuration: "3.2s", animationDelay: "0.3s" }}>🎁</span>
            <h3 className="relative text-lg font-black text-white mb-1">רוצה לשמח מישהו? 🎁</h3>
            <p className="relative text-xs text-white/70 mb-3 leading-relaxed">
              כרטיס מתנה דיגיטלי עם קוד אישי — מושלם ליום הולדת, חג או סתם ככה
            </p>
            <Button
              onClick={() => {
                trackEvent({ eventType: "feature_used", metadata: { feature: "gift_entry_clicked" } });
                navigate("/gift");
              }}
              className="relative w-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:from-pink-400 hover:via-purple-400 hover:to-orange-400 text-white font-black text-sm py-3 rounded-xl shadow-xl"
              style={{ boxShadow: "0 0 24px rgba(236, 72, 153, 0.35), 0 0 48px rgba(168, 85, 247, 0.2)" }}
            >
              🎁 שלח כמתנה
            </Button>
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
              trackEvent({ eventType: "feature_used", metadata: { feature: "purchase_cta_clicked", product: selectedProduct } });
              handlePurchase();
            }}
            className="w-full h-auto min-h-12 relative overflow-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-400 hover:via-pink-400 hover:to-orange-400 text-white font-black text-xs sm:text-sm py-3 px-3 rounded-xl shadow-xl whitespace-normal leading-tight break-words before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.15)_50%,transparent_70%)] before:bg-[length:200%_100%] before:animate-[cta-shimmer_4s_ease-in-out_infinite]"
            style={{ boxShadow: "0 0 30px rgba(168, 85, 247, 0.4), 0 0 60px rgba(236, 72, 153, 0.2)" }}
          >
            <span className="inline-flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 w-full">
              {selectedProduct === "coloring_pages" ? (
                <span>רכשו דפי צביעה ✨</span>
              ) : discountPercent > 1 ? (
                <>
                  <span>רכשו {selectedProductData.title} ב-</span>
                  <span className="line-through opacity-60">₪{selectedBasePrice.toFixed(2)}</span>
                  <span>₪{selectedFinalPrice.toFixed(2)} ✨</span>
                </>
              ) : (
                <span>רכשו {selectedProductData.title} ב-₪{selectedBasePrice.toFixed(2)} ✨</span>
              )}
            </span>
          </Button>
          <p className="text-[11px] text-white/70 font-semibold mt-1">
            ✏️ סבב עריכה מלא כלול בכל סיפור
          </p>
        </div>
      </div>

      {/* Modals */}
      <PurchaseSuccessModal open={showSuccess} onOpenChange={setShowSuccess} creditsAdded={1} />
      <PurchaseFailedModal open={showFailed} onOpenChange={setShowFailed} onRetry={handleRetry} />
      <FirstPurchaseBonusModal open={showBonus} onOpenChange={setShowBonus} />
      <SampleBookModal open={showSampleBook} onOpenChange={setShowSampleBook} />
      <ColoringPurchaseModal
        open={showColoringModal}
        onOpenChange={setShowColoringModal}
        storyId={coloringStoryId}
        illustrationCount={6}
        onSuccess={() => setShowSuccess(true)}
      />
    </div>
  );
};

export default Upgrade;