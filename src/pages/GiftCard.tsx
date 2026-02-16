import { useState } from "react";
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
import { PRICING_PACKAGES, CURRENCY_SYMBOL } from "@/config/pricing";
import MobileNavigation from "@/components/MobileNavigation";

const GIFT_PACKAGES = PRICING_PACKAGES.map(pkg => ({
  ...pkg,
  giftLabel: `${pkg.stories} סיפורים במתנה`,
}));

const generateCouponCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GIFT-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const GiftCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();

  const [selectedPackage, setSelectedPackage] = useState("popular");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [showPayPal, setShowPayPal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedPkg = GIFT_PACKAGES.find(p => p.id === selectedPackage);

  const handlePurchase = () => {
    if (!user) {
      localStorage.setItem("returnTo", "/gift");
      navigate("/auth");
      return;
    }
    setShowPayPal(true);
  };

  const handlePayPalSuccess = async () => {
    if (!user || !selectedPkg) return;

    try {
      const code = generateCouponCode();

      // Create coupon in database
      const { error: couponError } = await supabase.from("coupons").insert({
        code,
        coupon_type: "extra_stories",
        free_stories: selectedPkg.stories,
        max_uses: 1,
        current_uses: 0,
        is_active: true,
      });

      if (couponError) throw couponError;

      // Record purchase
      await supabase.from("purchases").insert({
        user_id: user.id,
        package_name: `gift_${selectedPkg.id}`,
        credits_purchased: selectedPkg.stories,
        amount_ils: selectedPkg.price,
        status: "completed",
      });

      setGeneratedCode(code);
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

    const message = `מתנה קסומה מחכה לכם! ${sender} שלחה לכם חבילה של ${selectedPkg.stories} סיפורים אישיים במתנה, שבהם סול (או שם הילד) הופכת לגיבורה של הרפתקאות מרגשות. איך מממשים? נכנסים ונרשמים בקלות בכתובת https://soulstory.co.il (או מתחברים), ומזינים את קוד הקופון האישי שלכם: ${generatedCode}! קריאה מהנה ומרגשת! ❤️`;

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
              הקוד נוצר בהצלחה. שלחי אותו למי שתרצי!
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

            {/* Recipient Name */}
            <div className="space-y-4 mb-6">
              <div>
                <Label className="text-white/80 text-sm">שם המקבלת (אופציונלי)</Label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="למשל: מיכל"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 mt-1"
                />
              </div>
              <div>
                <Label className="text-white/80 text-sm">השם שלך (אופציונלי)</Label>
                <Input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="למשל: שירה"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 mt-1"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleShareWhatsApp}
                className="w-full py-3 text-base font-black rounded-xl shadow-xl"
                style={{ backgroundColor: "#25D366" }}
              >
                <Share2 className="w-5 h-5 ml-2" />
                שלחי את המתנה בוואטסאפ
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
                    העתיקי את הקוד
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
                <div className="text-2xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
                  {pkg.stories}
                </div>
                <div className="text-xs text-white/80 font-bold mb-1">סיפורים</div>
                <div className="text-lg font-black text-white">
                  {CURRENCY_SYMBOL}{pkg.price}
                </div>
                <div className="text-[10px] text-purple-300 font-bold">
                  {pkg.pricePerStory} לסיפור
                </div>
              </button>
            ))}
          </div>

          {/* How it works */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-black text-white mb-3">איך זה עובד? ✨</h3>
            <div className="space-y-2.5">
              {[
                "בחרי חבילת סיפורים ושלמי בצורה מאובטחת",
                "תקבלי קוד מתנה ייחודי מיד לאחר התשלום",
                "שלחי את הקוד בוואטסאפ עם הודעה מעוצבת",
                "המקבלת מזינה את הקוד ומקבלת את הסיפורים!",
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
              <button
                onClick={() => setShowPayPal(false)}
                className="w-full text-center text-white/50 text-xs mt-3 hover:text-white/70 transition-colors"
              >
                ביטול
              </button>
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
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:from-pink-400 hover:via-purple-400 hover:to-orange-400 text-white font-black text-sm py-3 rounded-xl shadow-xl"
              style={{
                boxShadow:
                  "0 0 30px rgba(236, 72, 153, 0.4), 0 0 60px rgba(168, 85, 247, 0.2)",
              }}
            >
              <Gift className="w-5 h-5 ml-2" />
              רכשי {selectedPkg?.stories} סיפורים במתנה — {CURRENCY_SYMBOL}{selectedPkg?.price} ✨
            </Button>
          </div>
        </div>
      )}

      <MobileNavigation />
    </div>
  );
};

export default GiftCard;
