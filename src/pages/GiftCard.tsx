import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, ArrowRight, Check, Share2, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PayPalButton from "@/components/paywall/PayPalButton";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/hooks/use-analytics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/config/pricing";
import MobileNavigation from "@/components/MobileNavigation";
import { GROW_LINKS, type GrowLinkKey } from "@/config/grow-links";

const GIFT_PACKAGES = [
  {
    id: "gift_single_digital",
    stories: 1,
    price: 39.90,
    label: "סיפור בודד",
    subtitle: "דיגיטלי",
    badge: undefined as string | undefined,
    growKey: "basic" as GrowLinkKey | null,
  },
  {
    id: "gift_single_full",
    stories: 1,
    price: 99.90,
    label: "סיפור דיגיטלי+ קובץ להדפסת ספר  +דף צביעה ",
    subtitle: "חוויה מלאה",
    badge: "הכי פופולרי 🔥" as string | undefined,
    growKey: "popular" as GrowLinkKey | null,
  },
  {
    id: "gift_two_stories",
    stories: 2,
    price: 79.90,
    label: "2 סיפורים דיגיטליים",
    subtitle: "חבילה זוגית",
    badge: undefined as string | undefined,
    growKey: null as GrowLinkKey | null,
  },
];


const GiftCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();

  const [selectedPackage, setSelectedPackage] = useState("gift_single_full");
  const [childName, setChildName] = useState("");
  const [senderName, setSenderName] = useState(user?.user_metadata?.display_name || "");
  const [showPayPal, setShowPayPal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [waitingForGrow, setWaitingForGrow] = useState(false);
  const pollAbortRef = useRef<{ cancelled: boolean } | null>(null);

  const selectedPkg = GIFT_PACKAGES.find(p => p.id === selectedPackage);

  const PENDING_GIFT_KEY = "pending_gift_id";

  // Poll the get-gift-coupon edge function until the webhook attaches a code
  // (or we time out after ~60s). Reuses the same success screen as PayPal.
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
    if (stored) {
      pollForGiftCoupon(stored);
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
      toast.error("התשלום באשראי לחבילה זו יתווסף בקרוב — אפשר להשלים ב-PayPal.");
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
      trackEvent({
        eventType: "feature_used",
        metadata: {
          feature: "gift_card_grow_started",
          package: selectedPkg.id,
        },
      });

      const url = GROW_LINKS[growKey];
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (!win) window.location.href = url;
    } catch (err) {
      console.error("Failed to start Grow gift purchase:", err);
      toast.error("שגיאה בהתחלת התשלום. נסו שוב.");
    }
  };

  const handlePurchase = () => {
    if (!user) {
      localStorage.setItem("returnTo", "/gift");
      navigate("/auth");
      return;
    }
    if (!childName.trim()) {
      toast.error("יש להזין את שם הילד/ה מקבל/ת המתנה");
      return;
    }
    setShowPayPal(true);
  };

  const handlePayPalSuccess = async () => {
    if (!user || !selectedPkg) return;

    try {
      const { data, error } = await supabase.functions.invoke("create-gift-coupon", {
        body: {
          stories: selectedPkg.stories,
          price: selectedPkg.price,
          packageId: selectedPkg.id,
        },
      });

      if (error || !data?.code) {
        throw new Error(data?.error || "Failed to create gift coupon");
      }

      setGeneratedCode(data.code);
      setPurchaseComplete(true);
      setShowPayPal(false);

      trackEvent({
        eventType: "feature_used",
        metadata: {
          feature: "gift_card_purchased",
          package: selectedPkg.id,
          stories: selectedPkg.stories,
        },
      });
    } catch (error) {
      console.error("Gift card purchase failed:", error);
      toast.error("שגיאה ביצירת כרטיס המתנה. נסו שוב.");
      setShowPayPal(false);
    }
  };

  const handlePayPalError = () => {
    toast.error("שגיאה בתשלום. נסו שוב.");
    setShowPayPal(false);
  };

  const handleShareWhatsApp = () => {
    if (!generatedCode || !selectedPkg) return;

    const sender = senderName.trim() || "מישהו/י שאוהב/ת אתכם";
    const child = childName.trim();

    const storiesPhrase = selectedPkg.stories === 1
      ? "סיפור אישי אחד"
      : `${selectedPkg.stories} סיפורים אישיים`;
    const message = `${sender} שלח/ה לך מתנה קסומה! ${storiesPhrase} שבהם ${child} הופך/ת לגיבור/ה של הרפתקאות מרגשות. איך מממשים? נכנסים ונרשמים בקלות בכתובת https://soulstory.co.il (או מתחברים), ומזינים את קוד הקופון האישי שלכם: ${generatedCode}! קריאה מהנה ומרגשת! ❤️`;

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

        <MobileNavigation />
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

      <div className="flex-1 overflow-y-auto pb-32 relative z-10" style={{ WebkitOverflowScrolling: "touch" }}>
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
                {pkg.badge && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg">
                    {pkg.badge}
                  </div>
                )}

                <Gift className="w-6 h-6 text-pink-300 mb-1" />
                <div className="text-sm font-black text-white text-center leading-tight min-h-[2.5rem] flex items-center">
                  {pkg.label}
                </div>
                <div className="text-lg font-black bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent mt-1">
                  {CURRENCY_SYMBOL}{pkg.price.toFixed(2)}
                </div>
                <div className="text-[10px] text-white/70 font-bold mt-1 text-center">
                  {pkg.subtitle}
                </div>
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

          {/* PayPal Section */}
          {showPayPal && selectedPkg && (
            <div className="bg-white/15 backdrop-blur-md rounded-xl border border-pink-400/30 p-4 mb-4 shadow-lg">
              <p className="text-sm font-bold text-white text-center mb-3">
                🎁 {selectedPkg.stories} סיפורים במתנה — {CURRENCY_SYMBOL}{selectedPkg.price}
              </p>
              <PayPalButton
                amount={selectedPkg.price}
                onSuccess={handlePayPalSuccess}
                onError={handlePayPalError}
                onCancel={() => setShowPayPal(false)}
              />
              {selectedPkg && (GROW_LINKS as any)[selectedPkg.id] && (
                <>
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-white/15" />
                    <span className="text-white/50 text-xs">או</span>
                    <div className="flex-1 h-px bg-white/15" />
                  </div>
                  <Button
                    onClick={handleGrowPurchase}
                    className="w-full bg-white text-[hsl(250,50%,15%)] hover:bg-white/90 font-black py-3 rounded-xl"
                  >
                    💳 תשלום בכרטיס אשראי (Grow)
                  </Button>
                </>
              )}
              <button
                onClick={() => setShowPayPal(false)}
                className="w-full text-center text-white/50 text-xs mt-3 hover:text-white/70 transition-colors"
              >
                ביטול
              </button>
            </div>
          )}

          {waitingForGrow && (
            <div className="bg-white/15 backdrop-blur-md rounded-xl border border-white/20 p-4 mb-4 text-center">
              <div className="inline-block w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mb-2" />
              <p className="text-white/80 text-sm font-bold">ממתינים לאישור התשלום…</p>
              <p className="text-white/50 text-xs mt-1">
                לאחר השלמת התשלום ב-Grow, קוד המתנה יופיע כאן אוטומטית.
              </p>
            </div>
          )}

          {/* Credit Card Note */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3 mb-4">
            <p className="text-sm text-center text-white/80 font-bold">
              💳 ניתן לשלם בכרטיס אשראי גם ללא חשבון PayPal
            </p>
          </div>
        </div>
      </div>

      {/* Fixed CTA */}
      {!showPayPal && (
        <div className="fixed bottom-[4.5rem] left-0 right-0 bg-[hsl(250,50%,12%)]/95 backdrop-blur border-t border-white/10 px-4 py-3 z-20">
          <div className="container max-w-md mx-auto">
            <Button
              onClick={handlePurchase}
              disabled={!childName.trim()}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:from-pink-400 hover:via-purple-400 hover:to-orange-400 text-white font-black text-sm py-3 rounded-xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                boxShadow:
                  "0 0 30px rgba(236, 72, 153, 0.4), 0 0 60px rgba(168, 85, 247, 0.2)",
              }}
            >
              <Gift className="w-5 h-5 ml-2" />
              רכשו {selectedPkg?.stories} סיפורים במתנה — {CURRENCY_SYMBOL}{selectedPkg?.price} ✨
            </Button>
          </div>
        </div>
      )}

      <MobileNavigation />
    </div>
  );
};

export default GiftCard;
