import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, ArrowRight, Check, Share2, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/hooks/use-analytics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/config/pricing";
import { GROW_LINKS, openGrowCheckout, type GrowLinkKey } from "@/config/grow-links";
import { PROMO_END_LABEL, isPromoActive } from "@/config/promo";

const GIFT_PACKAGES = [
  {
    id: "gift_single_digital",
    stories: 1,
    price: 29.90,
    originalPrice: 39.90,
    label: "סיפור בודד",
    subtitle: "דיגיטלי",
    growKey: "basic" as GrowLinkKey | null,
    coloringDesc: "🎨 דף צביעה אחד במתנה — לצביעה אונליין ולהדפסה" as string | undefined,
  },
  {
    id: "gift_two_stories",
    stories: 2,
    price: 59.90,
    originalPrice: 79.90,
    label: "2 סיפורים דיגיטליים",
    subtitle: "חבילה זוגית",
    growKey: "twoStories" as GrowLinkKey | null,
    coloringDesc: "✨ 2 סיפורים מותאמים אישית עם הילד כגיבור — 🎨 2 דפי צביעה במתנה — לצביעה אונליין ולהדפסה" as string | undefined,
  },
  {
    id: "gift_single_full",
    stories: 1,
    price: 99.90,
    originalPrice: 119.90,
    label: "סיפור דיגיטלי + קובץ להדפסת ספר + חבילת דפי צביעה",
    subtitle: "חוויה מלאה",
    growKey: "popular" as GrowLinkKey | null,
    coloringDesc: "🎨 חבילת דפי צביעה מלאה — לצביעה אונליין ולהדפסה" as string | undefined,
  },
];


const GiftCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const promoActive = isPromoActive();

  const [selectedPackage, setSelectedPackage] = useState("gift_single_full");
  const [childName, setChildName] = useState("");
  const [senderName, setSenderName] = useState(user?.user_metadata?.display_name || "");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [waitingForGrow, setWaitingForGrow] = useState(false);
  const pollAbortRef = useRef<{ cancelled: boolean } | null>(null);

  const selectedPkg = GIFT_PACKAGES.find(p => p.id === selectedPackage);

  const PENDING_GIFT_KEY = "pending_gift_id";

  // Poll the get-gift-coupon edge function until the webhook attaches a code
  // (or we time out after ~60s). Shows the standard success screen on completion.
  const pollForGiftCoupon = useCallback(
    async (pendingGiftId: string) => {
      setWaitingForGrow(true);
      const ctrl = { cancelled: false };
      pollAbortRef.current = ctrl;
      const deadline = Date.now() + 60_000;
      while (!ctrl.cancelled && Date.now() < deadline) {
        try {
          const { data, error } = await supabase.functions.invoke("get-gift-coupon", {
            body: { pendingGiftId },
          });
          if (!error && data?.status === "completed" && data?.code) {
            setGeneratedCode(data.code);
            setPurchaseComplete(true);
            setWaitingForGrow(false);
            localStorage.removeItem(PENDING_GIFT_KEY);
            trackEvent({
              eventType: "feature_used",
              metadata: { feature: "gift_card_purchased", provider: "grow" },
            });
            return;
          }
        } catch (_) {
          // ignore and retry
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
      if (!ctrl.cancelled) {
        setWaitingForGrow(false);
        toast.error("התשלום עדיין לא אומת. בדקו את המייל או רעננו עוד מעט.");
      }
    },
    [trackEvent]
  );

  // On mount: if we have a pending gift id stored from a Grow redirect, poll.
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(PENDING_GIFT_KEY);
    // Only resume polling if we returned from a Grow checkout in this tab
    // (sessionStorage flag set right before redirect). Otherwise clear any
    // stale pending id so the page loads normally without a waiting state.
    const resumed = sessionStorage.getItem("gift_grow_in_progress");
    if (stored && resumed) {
      sessionStorage.removeItem("gift_grow_in_progress");
      pollForGiftCoupon(stored);
    } else if (stored && !resumed) {
      localStorage.removeItem(PENDING_GIFT_KEY);
    }
    return () => {
      if (pollAbortRef.current) pollAbortRef.current.cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleGrowPurchase = async () => {
    if (!user) {
      localStorage.setItem("returnTo", "/gift");
      navigate("/auth");
      return;
    }
    if (!childName.trim()) {
      toast.error("יש להזין את שם הילד/ה מקבל/ת המתנה");
      return;
    }
    if (!selectedPkg) return;
    const growKey = selectedPkg.growKey;
    if (!growKey || !GROW_LINKS[growKey]) {
      toast.error("התשלום לחבילה זו עדיין לא זמין.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("pending_gifts")
        .insert({
          user_id: user.id,
          package_id: selectedPkg.id,
          child_name: childName.trim(),
          sender_name: senderName.trim() || null,
          status: "pending",
        })
        .select("id")
        .single();

      if (error || !data) throw error || new Error("insert failed");

      localStorage.setItem(PENDING_GIFT_KEY, data.id);
      sessionStorage.setItem("gift_grow_in_progress", "1");
      trackEvent({
        eventType: "feature_used",
        metadata: {
          feature: "gift_card_grow_started",
          package: selectedPkg.id,
        },
      });

      // Use openGrowCheckout so cField1 (userId) and cField2 (packageId) are
      // appended to the Grow URL — without these the webhook cannot identify
      // the buyer or the exact gift package, and would treat the payment as
      // a regular purchase (giving credits to the buyer instead of issuing
      // a gift coupon for the recipient).
      openGrowCheckout(growKey, {
        userId: user.id,
        packageId: selectedPkg.id,
      });
    } catch (err) {
      console.error("Failed to start Grow gift purchase:", err);
      toast.error("שגיאה בהתחלת התשלום. נסו שוב.");
    }
  };

  const handlePurchase = () => {
    handleGrowPurchase();
  };

  const handleShareWhatsApp = () => {
    if (!generatedCode || !selectedPkg) return;

    const sender = senderName.trim() || "מישהו/י שאוהב/ת אתכם";
    const child = childName.trim();

    const storiesPhrase = selectedPkg.stories === 1
      ? "סיפור אישי אחד"
      : `${selectedPkg.stories} סיפורים אישיים`;
    const redeemUrl = `https://soulstory.co.il/upgrade?coupon=${encodeURIComponent(generatedCode)}`;
    const message = `${sender} שלח/ה לך מתנה קסומה! ${storiesPhrase} שבהם ${child} הופך/ת לגיבור/ה של הרפתקאות מרגשות. איך מממשים? נכנסים לקישור הבא, נרשמים/מתחברים, והקופון יוזן עבורכם אוטומטית: ${redeemUrl} (קוד הקופון: ${generatedCode}). קריאה מהנה ומרגשת! ❤️`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");

    trackEvent({
      eventType: "feature_used",
      metadata: { feature: "gift_card_shared_whatsapp" },
    });
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast.success("הקוד הועתק!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Success screen after purchase
  if (purchaseComplete && generatedCode) {
    return (
      <div className="min-h-[100dvh] flex flex-col relative overflow-hidden" dir="rtl">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(260,60%,15%)] via-[hsl(270,40%,20%)] to-[hsl(250,50%,12%)]" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/60 animate-pulse"
              style={{
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto relative z-10 pb-24">
          <div className="container max-w-md mx-auto px-4 pt-8">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl">
                <Check className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-black text-center bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent mb-2">
              המתנה מוכנה! 🎁
            </h1>
            <p className="text-white/80 text-center text-sm mb-6">
              הקוד נוצר בהצלחה. שלחו אותו למי שתרצו!
            </p>

            {/* Gift Code Display */}
            <div className="bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-6 text-center">
              <p className="text-white/60 text-sm mb-2">קוד המתנה:</p>
              <div className="bg-white/10 rounded-xl py-3 px-4 mb-4">
                <p className="text-2xl font-black text-white tracking-widest" dir="ltr">
                  {generatedCode}
                </p>
              </div>
              <p className="text-white/70 text-sm">
                <Sparkles className="w-4 h-4 inline ml-1" />
                {selectedPkg?.stories} סיפורים מותאמים אישית
              </p>
            </div>

            {/* Gift details */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 mb-6 text-center">
              <p className="text-white/70 text-sm">
                🎁 מתנה ל<span className="text-white font-bold">{childName}</span>
                {senderName.trim() ? <> מאת <span className="text-white font-bold">{senderName}</span></> : null}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleShareWhatsApp}
                className="w-full py-3 text-base font-black rounded-xl shadow-xl"
                style={{ backgroundColor: "#25D366" }}
              >
                <Share2 className="w-5 h-5 ml-2" />
                שלחו את המתנה בוואטסאפ
              </Button>

              <Button
                onClick={handleCopyCode}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 ml-2" />
                    הועתק!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 ml-2" />
                    העתיקו את הקוד
                  </>
                )}
              </Button>

              <Button
                onClick={() => navigate("/adventure")}
                variant="ghost"
                className="w-full text-white/60 hover:text-white/90"
              >
                חזרה לדף הבית
              </Button>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // Purchase flow screen
  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(260,60%,15%)] via-[hsl(270,40%,20%)] to-[hsl(250,50%,12%)]" />

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
            }}
          />
        ))}
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute bottom-32 right-10 w-48 h-48 rounded-full bg-amber-400/8 blur-3xl" />
      </div>

      {/* Back Button */}
      <div className="absolute top-3 right-3 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <ArrowRight className="w-4 h-4 ml-1" />
          חזרה
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pb-48 relative z-10" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="container max-w-md mx-auto px-4 pt-14">
          {/* Hero */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 via-purple-500 to-amber-400 flex items-center justify-center shadow-2xl">
              <Gift className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-center bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent mb-1">
            שלחו סיפורים במתנה 🎁
          </h1>
          <p className="text-white/80 text-center text-sm mb-6 leading-relaxed">
            מחפשים מתנה מקורית וערכית ליום הולדת?
            <br />
            מעכשיו תוכלו להעניק ליקרים לכם חבילת סיפורים אישיים
            <br />
            שבהם הילד או הילדה הם הגיבורים האמיתיים.
          </p>

          {/* Package Selection */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {GIFT_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={cn(
                  "relative flex flex-col items-center p-3 rounded-2xl border transition-all duration-200",
                  "bg-white/10 backdrop-blur-md",
                  selectedPackage === pkg.id
                    ? "border-pink-400/50 shadow-lg scale-[1.03] bg-white/20"
                    : "border-white/15 hover:border-white/30"
                )}
              >
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg">
                  🔥 מחיר השקה
                </div>

                <Gift className="w-6 h-6 text-pink-300 mb-1" />
                <div className="text-sm font-black text-white text-center leading-tight min-h-[2.5rem] flex items-center">
                  {pkg.label}
                </div>
                <div className="text-xs text-white/40 line-through mt-1">
                  {CURRENCY_SYMBOL}{pkg.originalPrice.toFixed(2)}
                </div>
                <div className="text-xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
                  {CURRENCY_SYMBOL}{pkg.price.toFixed(2)}
                </div>
                <div className="text-[9px] text-amber-300/90 font-bold mt-1 text-center">
                  אחרי 12/7 המחיר עולה
                </div>
                <div className="text-[10px] text-white/70 font-bold mt-1 text-center">
                  {pkg.subtitle}
                </div>
                {pkg.coloringDesc && (
                  <div className="text-[10px] text-emerald-300/80 mt-0.5 text-center leading-tight px-1">
                    {pkg.coloringDesc}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* How it works */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-black text-white mb-3">איך זה עובד? ✨</h3>
            <div className="space-y-2.5">
              {[
                "בחרו חבילת סיפורים ושלמו בצורה מאובטחת",
                "תקבלו קוד מתנה ייחודי מיד לאחר התשלום",
                "שלחו את הקוד בוואטסאפ עם הודעה מעוצבת",
                "מזינים את הקוד ומקבלים את הסיפורים!",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-black text-white">{i + 1}</span>
                  </div>
                  <p className="text-xs text-white/70">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Name Fields */}
          <div className="space-y-3 mb-6">
            <div>
              <Label className="text-white/80 text-sm">שם הילד/ה מקבל/ת המתנה *</Label>
              <Input
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="למשל: נועה, יואב"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 mt-1"
                maxLength={50}
                required
              />
            </div>
            <div>
              <Label className="text-white/80 text-sm">השם שלך (אופציונלי)</Label>
              <Input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="למשל: שירה"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 mt-1"
                maxLength={50}
              />
            </div>
          </div>

          {waitingForGrow && (
            <div className="bg-white/15 backdrop-blur-md rounded-xl border border-white/20 p-4 mb-4 text-center">
              <div className="inline-block w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mb-2" />
              <p className="text-white/80 text-sm font-bold">ממתינים לאישור התשלום…</p>
              <p className="text-white/50 text-xs mt-1">
                לאחר השלמת התשלום ב-Grow, קוד המתנה יופיע כאן אוטומטית.
              </p>
            </div>
          )}

        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[hsl(250,50%,12%)]/95 backdrop-blur border-t border-white/10 px-4 py-3 z-[110] pointer-events-auto">
        <div className="container max-w-md mx-auto">
          <Button
            type="button"
            onClick={handlePurchase}
            disabled={!childName.trim()}
            className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:from-pink-400 hover:via-purple-400 hover:to-orange-400 text-white font-black text-sm py-3 rounded-xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              boxShadow:
                "0 0 30px rgba(236, 72, 153, 0.4), 0 0 60px rgba(168, 85, 247, 0.2)",
            }}
          >
            <Gift className="w-5 h-5 ml-2" />
            רכשו {selectedPkg?.subtitle} — {CURRENCY_SYMBOL}{selectedPkg?.price.toFixed(2)} ✨
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GiftCard;
