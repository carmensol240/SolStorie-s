import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { X, Crown, Gift } from "lucide-react";

const WHITELISTED_TEST_EMAIL = "carmit1901+test@gmail.com";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PurchaseSuccessModal from "@/components/paywall/PurchaseSuccessModal";
import PurchaseFailedModal from "@/components/paywall/PurchaseFailedModal";
import PayPalButton from "@/components/paywall/PayPalButton";
import CouponInput from "@/components/paywall/CouponInput";

import { useCredits } from "@/hooks/use-credits";
import { useSubscription } from "@/hooks/use-subscription";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import heroImage from "@/assets/cast-group-forest.png";
import { PRICING_PACKAGES, TOOLKIT_SUBSCRIPTION, EDUCATOR_PACKAGE, EDIT_KIT_PACKAGE, COLORING_KIT_PACKAGE } from "@/config/pricing";


const Upgrade = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const firstStoryId = searchParams.get('firstStory');
  const noCredits = searchParams.get('noCredits') === 'true';
  const { user } = useAuth();
  const { addCredits, refetch: refetchCredits } = useCredits();
  const { isSubscriber, refetch: refetchSubscription } = useSubscription();
  const { trackEvent } = useAnalytics();
  const showToolkit = searchParams.get('toolkit') === 'true';
  
  const [selectedPackage, setSelectedPackage] = useState<string>("popular");
  const [showPayPal, setShowPayPal] = useState(false);
  const [userRole, setUserRole] = useState<string>("parent");
  const [showEducatorPayPal, setShowEducatorPayPal] = useState(false);
  const [showEditKitPayPal, setShowEditKitPayPal] = useState(false);
  const [showColoringKitPayPal, setShowColoringKitPayPal] = useState(false);
  const [showToolkitPayPal, setShowToolkitPayPal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSubscriptionSuccess, setShowSubscriptionSuccess] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [purchasedCredits, setPurchasedCredits] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);

  // Countdown timer — 15 minutes from page load
  const [countdown, setCountdown] = useState(15 * 60);
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);
  const countdownMin = Math.floor(countdown / 60);
  const countdownSec = countdown % 60;
  

  const title = "אהבתם? 💛";
  const subtitle = "המשיכו את הקסם עם חבילת קרדיטים חדשה";

  useEffect(() => {
    const viewType = firstStoryId ? 'first_story' : noCredits ? 'no_credits' : 'regular';
    trackEvent({ eventType: 'feature_used', metadata: { feature: 'paywall_view', view_type: viewType } });
  }, [trackEvent, firstStoryId, noCredits]);

  // Fetch user role
  useEffect(() => {
    const fetchRole = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.user_role) setUserRole(data.user_role);
    };
    fetchRole();
  }, [user]);

  const isTestUser = user?.email?.toLowerCase() === WHITELISTED_TEST_EMAIL.toLowerCase();

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId);
    const pkg = PRICING_PACKAGES.find(p => p.id === packageId);
    trackEvent({ 
      eventType: 'feature_used', 
      metadata: { feature: 'package_selected', package: packageId, stories: pkg?.stories } 
    });
  };

  const handleTestPurchase = async () => {
    if (!isTestUser || !user) return;
    const pkg = PRICING_PACKAGES.find(p => p.id === selectedPackage);
    if (!pkg) return;
    try {
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          package_name: `test_${pkg.id}`,
          credits_purchased: pkg.stories,
          amount_ils: 0,
          status: 'test_completed',
        });
      if (purchaseError) throw purchaseError;
      const success = await addCredits(pkg.stories);
      if (success) {
        // Add free edits to profile
        const { data: profileData } = await supabase.from('profiles').select('free_edits_remaining, free_edits_total').eq('id', user.id).maybeSingle();
        await supabase.from('profiles').update({
          free_edits_remaining: (profileData?.free_edits_remaining ?? 0) + pkg.freeEdits,
          free_edits_total: (profileData?.free_edits_total ?? 0) + pkg.freeEdits,
        }).eq('id', user.id);
        setPurchasedCredits(pkg.stories);
        setShowSuccess(true);
        trackEvent({ eventType: 'feature_used', metadata: { feature: 'test_purchase_completed', package: pkg.id, stories: pkg.stories } });
        toast.success(`🧪 קרדיטים נוספו בהצלחה (מצב בדיקה)`);
      } else {
        throw new Error('Failed to add credits');
      }
    } catch (error) {
      console.error('Test purchase failed:', error);
      toast.error('שגיאה בהוספת קרדיטים');
    }
  };

  const handleAddTestCredits = async (amount: number) => {
    if (!isTestUser || !user) return;
    const success = await addCredits(amount);
    if (success) {
      toast.success(`🧪 נוספו ${amount} קרדיטים לבדיקה`);
      trackEvent({ eventType: 'feature_used', metadata: { feature: 'test_credits_added', amount } });
    } else {
      toast.error('שגיאה בהוספת קרדיטים');
    }
  };

  const handlePurchase = () => {
    if (!user) { navigate("/auth"); return; }
    if (isTestUser) { handleTestPurchase(); return; }
    setShowPayPal(true);
  };

  const handlePayPalSuccess = async () => {
    const pkg = PRICING_PACKAGES.find(p => p.id === selectedPackage);
    if (!pkg || !user) return;
    try {
      const finalPrice = discountPercent > 0 ? Math.round(pkg.price * (1 - discountPercent / 100)) : pkg.price;
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          package_name: appliedCouponCode ? `${pkg.id}_coupon_${appliedCouponCode}` : pkg.id,
          credits_purchased: pkg.stories,
          amount_ils: finalPrice,
          status: 'completed',
        });
      if (purchaseError) throw purchaseError;
      const success = await addCredits(pkg.stories);
      if (success) {
        // Add free edits to profile
        const { data: profileData } = await supabase.from('profiles').select('free_edits_remaining, free_edits_total').eq('id', user.id).maybeSingle();
        await supabase.from('profiles').update({
          free_edits_remaining: (profileData?.free_edits_remaining ?? 0) + pkg.freeEdits,
          free_edits_total: (profileData?.free_edits_total ?? 0) + pkg.freeEdits,
        }).eq('id', user.id);
        setPurchasedCredits(pkg.stories);
        setShowPayPal(false);
        setShowSuccess(true);
        trackEvent({ eventType: 'feature_used', metadata: { feature: 'purchase_completed', package: pkg.id, stories: pkg.stories, payment_method: 'paypal' } });
        if (user.email) {
          supabase.functions.invoke('send-purchase-confirmation', {
            body: {
              email: user.email,
              packageName: pkg.label,
              credits: pkg.stories,
              amount: finalPrice,
              transactionDate: new Date().toLocaleDateString('he-IL'),
            }
          }).then(({ error }) => {
            if (error) console.error('Failed to send confirmation email:', error);
          });
        }
      } else {
        throw new Error('Failed to add credits');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      setShowPayPal(false);
      setShowFailed(true);
      trackEvent({ eventType: 'feature_used', metadata: { feature: 'purchase_failed', package: pkg.id } });
    }
  };

  const handlePayPalError = (error: any) => {
    console.error('PayPal error details:', {
      message: error?.message, name: error?.name, stack: error?.stack,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error || {}))
    });
    setShowPayPal(false);
    setShowFailed(true);
    const pkg = PRICING_PACKAGES.find(p => p.id === selectedPackage);
    trackEvent({ eventType: 'feature_used', metadata: { feature: 'purchase_failed', package: pkg?.id, error: error?.message || 'paypal_error' } });
  };

  const handleRetry = () => { setShowFailed(false); setShowPayPal(true); };

  const handleToolkitPurchase = () => {
    if (!user) { navigate("/auth"); return; }
    setShowToolkitPayPal(true);
  };

  const handleToolkitPayPalSuccess = async () => {
    if (!user) return;
    try {
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          package_name: TOOLKIT_SUBSCRIPTION.id,
          credits_purchased: 0,
          amount_ils: TOOLKIT_SUBSCRIPTION.price,
          status: 'completed',
        });
      if (purchaseError) throw purchaseError;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_subscriber: true })
        .eq('id', user.id);
      if (profileError) throw profileError;
      refetchSubscription();
      setShowToolkitPayPal(false);
      setShowSubscriptionSuccess(true);
      trackEvent({ eventType: 'feature_used', metadata: { feature: 'toolkit_subscription_completed', payment_method: 'paypal' } });
    } catch (error) {
      console.error('Toolkit purchase failed:', error);
      setShowToolkitPayPal(false);
      setShowFailed(true);
    }
  };

  const handleToolkitPayPalError = (error: any) => {
    console.error('Toolkit PayPal error:', error);
    setShowToolkitPayPal(false);
    setShowFailed(true);
  };

  const selectedPkg = PRICING_PACKAGES.find(p => p.id === selectedPackage);
  const discountedPrice = selectedPkg ? Math.round(selectedPkg.price * (1 - discountPercent / 100)) : 0;

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden" dir="rtl">
      {/* Magical dark background — same as About */}
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
          onClick={() => navigate(-1)}
          className="rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pb-32 relative z-10" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="container max-w-md mx-auto px-4 pt-4">
          {/* Large Elephant Hero */}
          <div className="flex justify-center mb-4">
            <div className="w-48 h-48 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20"
              style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.3), 0 0 80px rgba(236, 72, 153, 0.15)' }}
            >
              <img 
                src={heroImage} 
                alt="דמויות SolStorie's" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-4 flex flex-col items-center">
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent mb-1">
              {title}
            </h1>
            <p className="text-white/80 text-base font-semibold leading-snug">
              {subtitle}
            </p>
          </div>

          {/* Credit Badge */}
          <div className="flex justify-center mb-4">
            <Badge className="bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 px-4 py-2 text-sm font-bold rounded-full">
              ✨ 1 קרדיט = 1 סיפור מלא + איורים
            </Badge>
          </div>


          {/* Limited-time offer badge */}
          {countdown > 0 && (
            <div className="flex justify-center mb-3">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/90 to-pink-500/90 backdrop-blur-sm text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg animate-pulse">
                <span>מחיר השקה מיוחד 🔥</span>
                <span className="bg-white/20 rounded-md px-2 py-0.5 font-mono text-xs tracking-wider">
                  {String(countdownMin).padStart(2, '0')}:{String(countdownSec).padStart(2, '0')}
                </span>
              </div>
            </div>
          )}
          <p className="text-center text-white/70 text-xs mb-3">לזמן מוגבל בלבד ⏰</p>

          {/* Package Cards — Glassmorphism */}
          <div className="grid grid-cols-3 gap-3 mb-4 pt-4">
            {PRICING_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleSelectPackage(pkg.id)}
                className={cn(
                  "relative flex flex-col items-center p-3 pt-4 rounded-2xl border transition-all duration-200",
                  "bg-white/10 backdrop-blur-md",
                  selectedPackage === pkg.id
                    ? "border-white/50 shadow-lg scale-[1.03] bg-white/20"
                    : "border-white/15 hover:border-white/30"
                )}
              >
                {/* Top badge (מומלץ / הכי משתלם) */}
                {pkg.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg z-10">
                    {pkg.badge}
                  </div>
                )}

                {/* Discount pill */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-400 text-white text-[9px] font-black px-2 py-0.5 rounded-full mb-1.5 shadow-sm border border-black/70">
                  חסכו ₪{pkg.originalPrice - pkg.price}
                </div>

                <div className="text-3xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
                  {pkg.stories}
                </div>
                <div className="text-sm text-white/80 font-bold mb-1">סיפורים</div>

                <div className="text-sm text-white/40 line-through">
                  ₪{pkg.originalPrice}
                </div>
                <div className="text-xl font-black text-white animate-price-glow">
                  ₪{pkg.price}
                </div>
                <div className="text-xs text-purple-300 font-bold">
                  {pkg.pricePerStory} לסיפור
                </div>
                
                {pkg.freeEdits > 0 && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg px-2 py-1 mt-2">
                  <span className="text-[10px] text-green-300 font-bold">
                    {pkg.freeEdits} עריכות 🎁
                  </span>
                </div>
                )}
              </button>
            ))}
          </div>

          <p className="text-center mb-4" style={{ fontSize: '13px', color: '#c084fc' }}>
            תשלום חד פעמי · הקרדיטים שלך לא פגים · אין מינוי
          </p>

          {/* Toolkit PayPal */}
          {showToolkitPayPal && (
            <div className="bg-white/15 backdrop-blur-md rounded-xl border border-amber-400/30 p-4 mb-4 shadow-lg">
              <p className="text-sm font-bold text-white text-center mb-3">
                {TOOLKIT_SUBSCRIPTION.label} — ₪{TOOLKIT_SUBSCRIPTION.price} לשנה
              </p>
              <PayPalButton
                amount={TOOLKIT_SUBSCRIPTION.price}
                onSuccess={handleToolkitPayPalSuccess}
                onError={handleToolkitPayPalError}
                onCancel={() => setShowToolkitPayPal(false)}
              />
              <button
                onClick={() => setShowToolkitPayPal(false)}
                className="w-full text-center text-white/50 text-xs mt-3 hover:text-white/70 transition-colors"
              >
                ביטול
              </button>
            </div>
          )}

          {/* Educator Package */}
          {userRole === 'educator' && (
            <div className="relative rounded-2xl p-[2px] mb-4 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, hsl(200,80%,50%), hsl(260,60%,60%), hsl(200,80%,50%))',
                backgroundSize: '300% 300%',
                animation: 'sparkle-border 4s ease-in-out infinite',
              }}>
              <div className="bg-[hsl(260,50%,13%)]/95 backdrop-blur-md rounded-[14px] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏫</span>
                  <h3 className="font-black text-sm text-blue-200">{EDUCATOR_PACKAGE.label}</h3>
                  <span className="bg-blue-500/30 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">חבילה מיוחדת</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  30 סיפורים + 2 עריכות לסיפור. מושלם לכיתה, לגן או לקליניקה.
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-black text-white">₪{EDUCATOR_PACKAGE.price}</span>
                    <span className="text-xs text-white/60 mr-1">({EDUCATOR_PACKAGE.pricePerStory} לסיפור)</span>
                  </div>
                  <Button
                    onClick={() => {
                      if (!user) { navigate("/auth"); return; }
                      setShowEducatorPayPal(true);
                    }}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-xl text-xs px-4"
                  >
                    🏫 רכשו חבילת אנשי חינוך וטיפול
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Educator PayPal */}
          {showEducatorPayPal && (
            <div className="bg-white/15 backdrop-blur-md rounded-xl border border-blue-400/30 p-4 mb-4 shadow-lg">
              <p className="text-sm font-bold text-white text-center mb-3">
                {EDUCATOR_PACKAGE.label} — {EDUCATOR_PACKAGE.stories} סיפורים תמורת ₪{EDUCATOR_PACKAGE.price}
              </p>
              <PayPalButton
                amount={EDUCATOR_PACKAGE.price}
                onSuccess={async () => {
                  if (!user) return;
                  try {
                    await supabase.from('purchases').insert({
                      user_id: user.id,
                      package_name: EDUCATOR_PACKAGE.id,
                      credits_purchased: EDUCATOR_PACKAGE.stories,
                      amount_ils: EDUCATOR_PACKAGE.price,
                      status: 'completed',
                    });
                    const success = await addCredits(EDUCATOR_PACKAGE.stories);
                    if (success) {
                      // Add free edits to profile
                      const { data: profileData } = await supabase.from('profiles').select('free_edits_remaining, free_edits_total').eq('id', user.id).maybeSingle();
                      await supabase.from('profiles').update({
                        free_edits_remaining: (profileData?.free_edits_remaining ?? 0) + EDUCATOR_PACKAGE.freeEdits,
                        free_edits_total: (profileData?.free_edits_total ?? 0) + EDUCATOR_PACKAGE.freeEdits,
                      }).eq('id', user.id);
                      setPurchasedCredits(EDUCATOR_PACKAGE.stories);
                      setShowEducatorPayPal(false);
                      setShowSuccess(true);
                    }
                  } catch (error) {
                    console.error('Educator purchase failed:', error);
                    setShowEducatorPayPal(false);
                    setShowFailed(true);
                  }
                }}
                onError={() => { setShowEducatorPayPal(false); setShowFailed(true); }}
                onCancel={() => setShowEducatorPayPal(false)}
              />
              <p className="text-center text-white/60 text-[11px] mt-2">💳 ניתן לשלם גם בכרטיס אשראי ללא חשבון פייפאל</p>
              <button onClick={() => setShowEducatorPayPal(false)} className="w-full text-center text-white/50 text-xs mt-3 hover:text-white/70 transition-colors">
                ביטול
              </button>
            </div>
          )}

          {/* Coupon */}
          <div className="mb-4">
            <CouponInput 
              onDiscountApplied={(percent, code) => { setDiscountPercent(percent); setAppliedCouponCode(code || null); }}
              onStoriesAdded={() => { refetchCredits(); }}
            />
          </div>

          {/* Upsell Packages — 2 column grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Coloring Kit */}
            <div className="relative rounded-2xl p-[2px] overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, hsl(30,80%,55%), hsl(340,70%,55%), hsl(30,80%,55%))',
                backgroundSize: '300% 300%',
                animation: 'sparkle-border 4s ease-in-out infinite',
              }}>
              <div className="bg-[hsl(260,50%,13%)]/95 backdrop-blur-md rounded-[14px] p-3 space-y-2 h-full flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">🎨</span>
                  <h3 className="font-black text-xs text-orange-200">{COLORING_KIT_PACKAGE.label}</h3>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed flex-1">
                  {COLORING_KIT_PACKAGE.pages} דפי צביעה מקוריים מבוססי AI לסיפורים שלכם
                </p>
                <div className="text-center">
                  <span className="text-lg font-black text-white">₪{COLORING_KIT_PACKAGE.price}</span>
                </div>
                <Button
                  onClick={() => {
                    if (!user) { navigate("/auth"); return; }
                    setShowColoringKitPayPal(true);
                  }}
                  size="sm"
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold rounded-xl text-xs"
                >
                  🎨 רכשו
                </Button>
              </div>
            </div>

            {/* Edit Kit */}
            <div className="relative rounded-2xl p-[2px] overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, hsl(150,60%,50%), hsl(200,70%,50%), hsl(150,60%,50%))',
                backgroundSize: '300% 300%',
                animation: 'sparkle-border 4s ease-in-out infinite',
              }}>
              <div className="bg-[hsl(260,50%,13%)]/95 backdrop-blur-md rounded-[14px] p-3 space-y-2 h-full flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">✏️</span>
                  <h3 className="font-black text-xs text-green-200">{EDIT_KIT_PACKAGE.label}</h3>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed flex-1">
                  {EDIT_KIT_PACKAGE.edits} עריכות לסיפורים קיימים — תיקון שגיאות ותוכן
                </p>
                <div className="text-center">
                  <span className="text-lg font-black text-white">₪{EDIT_KIT_PACKAGE.price}</span>
                </div>
                <Button
                  onClick={() => {
                    if (!user) { navigate("/auth"); return; }
                    setShowEditKitPayPal(true);
                  }}
                  size="sm"
                  className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold rounded-xl text-xs"
                >
                  ✏️ רכשו
                </Button>
              </div>
            </div>
          </div>

          {/* Coloring Kit PayPal */}
          {showColoringKitPayPal && (
            <div className="bg-white/15 backdrop-blur-md rounded-xl border border-orange-400/30 p-4 mb-4 shadow-lg">
              <p className="text-sm font-bold text-white text-center mb-3">
                {COLORING_KIT_PACKAGE.label} — {COLORING_KIT_PACKAGE.pages} דפי צביעה תמורת ₪{COLORING_KIT_PACKAGE.price}
              </p>
              <PayPalButton
                amount={COLORING_KIT_PACKAGE.price}
                onSuccess={async () => {
                  if (!user) return;
                  try {
                    await supabase.from('purchases').insert({
                      user_id: user.id,
                      package_name: COLORING_KIT_PACKAGE.id,
                      credits_purchased: COLORING_KIT_PACKAGE.pages,
                      amount_ils: COLORING_KIT_PACKAGE.price,
                      status: 'completed',
                    });
                    // Increment coloring_credits on profile
                    const { data: profile } = await supabase
                      .from('profiles')
                      .select('coloring_credits')
                      .eq('id', user.id)
                      .maybeSingle();
                    const currentCredits = (profile as any)?.coloring_credits ?? 0;
                    await supabase
                      .from('profiles')
                      .update({ coloring_credits: currentCredits + COLORING_KIT_PACKAGE.pages } as any)
                      .eq('id', user.id);
                    setShowColoringKitPayPal(false);
                    setPurchasedCredits(0);
                    setShowSuccess(true);
                    trackEvent({ eventType: 'feature_used', metadata: { feature: 'coloring_kit_purchased', pages: COLORING_KIT_PACKAGE.pages, payment_method: 'paypal' } });
                    toast.success(`🎨 נוספו ${COLORING_KIT_PACKAGE.pages} דפי צביעה בהצלחה!`);
                  } catch (error) {
                    console.error('Coloring kit purchase failed:', error);
                    setShowColoringKitPayPal(false);
                    setShowFailed(true);
                  }
                }}
                onError={() => { setShowColoringKitPayPal(false); setShowFailed(true); }}
                onCancel={() => setShowColoringKitPayPal(false)}
              />
              <p className="text-center text-white/60 text-[11px] mt-2">💳 ניתן לשלם גם בכרטיס אשראי ללא חשבון פייפאל</p>
              <button onClick={() => setShowColoringKitPayPal(false)} className="w-full text-center text-white/50 text-xs mt-3 hover:text-white/70 transition-colors">
                ביטול
              </button>
            </div>
          )}

          {/* Edit Kit PayPal */}
          {showEditKitPayPal && (
            <div className="bg-white/15 backdrop-blur-md rounded-xl border border-green-400/30 p-4 mb-4 shadow-lg">
              <p className="text-sm font-bold text-white text-center mb-3">
                {EDIT_KIT_PACKAGE.label} — {EDIT_KIT_PACKAGE.edits} עריכות תמורת ₪{EDIT_KIT_PACKAGE.price}
              </p>
              <PayPalButton
                amount={EDIT_KIT_PACKAGE.price}
                onSuccess={async () => {
                  if (!user) return;
                  try {
                    await supabase.from('purchases').insert({
                      user_id: user.id,
                      package_name: EDIT_KIT_PACKAGE.id,
                      credits_purchased: 0,
                      amount_ils: EDIT_KIT_PACKAGE.price,
                      status: 'completed',
                    });
                    // Add edit credits to profile
                    const { data: profileData } = await supabase.from('profiles').select('free_edits_remaining, free_edits_total').eq('id', user.id).maybeSingle();
                    await supabase.from('profiles').update({
                      free_edits_remaining: (profileData?.free_edits_remaining ?? 0) + EDIT_KIT_PACKAGE.edits,
                      free_edits_total: (profileData?.free_edits_total ?? 0) + EDIT_KIT_PACKAGE.edits,
                    }).eq('id', user.id);
                    setShowEditKitPayPal(false);
                    setPurchasedCredits(0);
                    setShowSuccess(true);
                    trackEvent({ eventType: 'feature_used', metadata: { feature: 'edit_kit_purchased', edits: EDIT_KIT_PACKAGE.edits, payment_method: 'paypal' } });
                    toast.success(`✏️ נוספו ${EDIT_KIT_PACKAGE.edits} עריכות בהצלחה!`);
                  } catch (error) {
                    console.error('Edit kit purchase failed:', error);
                    setShowEditKitPayPal(false);
                    setShowFailed(true);
                  }
                }}
                onError={() => { setShowEditKitPayPal(false); setShowFailed(true); }}
                onCancel={() => setShowEditKitPayPal(false)}
              />
              <p className="text-center text-white/60 text-[11px] mt-2">💳 ניתן לשלם גם בכרטיס אשראי ללא חשבון פייפאל</p>
              <button onClick={() => setShowEditKitPayPal(false)} className="w-full text-center text-white/50 text-xs mt-3 hover:text-white/70 transition-colors">
                ביטול
              </button>
            </div>
          )}

          {/* Credit Card Note — glass style */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3 mb-4">
            <p className="text-sm text-center text-white/80 font-bold flex items-center justify-center gap-2">
              💳 ניתן לשלם בכרטיס אשראי גם ללא חשבון PayPal
            </p>
            <p className="text-xs text-center text-white/50 mt-1">
              Visa, Mastercard, American Express ועוד
            </p>
          </div>

          {/* Gift Card Link */}
          <Link
            to="/gift"
            className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-pink-400/20 rounded-xl p-3 mb-4 hover:bg-white/15 transition-colors"
          >
            <Gift className="w-5 h-5 text-pink-300" />
            <span className="text-sm font-bold text-white/90">🎁 רוצה לשלוח סיפורים במתנה?</span>
          </Link>

          {/* Privacy */}
          <p className="text-xs text-center text-white/40 mt-2 mb-4">
            בלחיצה על "רכשו" הינך מסכים/ה ל
            <a href="/privacy" className="text-purple-300 underline font-semibold mx-1">מדיניות הפרטיות</a>
            ול
            <a href="/terms" className="text-purple-300 underline font-semibold mx-1">תנאי השימוש</a>
          </p>

          {/* PayPal */}
          {showPayPal && (
            <div className="bg-white/15 backdrop-blur-md rounded-xl border border-white/20 p-4 mb-4 shadow-lg">
              <p className="text-sm font-bold text-white text-center mb-1">
                {selectedPkg?.stories} סיפורים
              </p>
              {discountPercent > 0 ? (
                <div className="text-center mb-3">
                  <span className="text-white/50 line-through text-sm">₪{selectedPkg?.price}</span>
                  <span className="text-green-300 font-black text-lg mr-2">₪{discountedPrice}</span>
                  <span className="text-green-300 text-xs font-bold">({discountPercent}% הנחה)</span>
                </div>
              ) : (
                <p className="text-sm font-bold text-white text-center mb-3">₪{selectedPkg?.price}</p>
              )}
              <PayPalButton
                amount={discountPercent > 0 ? discountedPrice : (selectedPkg?.price || 0)}
                onSuccess={handlePayPalSuccess}
                onError={handlePayPalError}
                onCancel={() => setShowPayPal(false)}
              />
              <p className="text-xs text-center text-white/60 mt-2 flex items-center justify-center gap-1.5">
                💳 ניתן לשלם גם בכרטיס אשראי ללא חשבון פייפאל
              </p>
              <button
                onClick={() => setShowPayPal(false)}
                className="w-full text-center text-white/50 text-xs mt-3 hover:text-white/70 transition-colors"
              >
                ביטול
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed CTA */}
      {!showPayPal && (
        <div className="fixed bottom-0 left-0 right-0 bg-[hsl(250,50%,12%)]/95 backdrop-blur border-t border-white/10 px-4 py-3 safe-area-bottom z-20">
          <div className="container max-w-md mx-auto flex flex-col items-center gap-1">
            <Button
              onClick={handlePurchase}
              className="w-full relative overflow-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-400 hover:via-pink-400 hover:to-orange-400 text-white font-black text-sm py-3 rounded-xl shadow-xl before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.15)_50%,transparent_70%)] before:bg-[length:200%_100%] before:animate-[cta-shimmer_4s_ease-in-out_infinite]"
              style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.4), 0 0 60px rgba(236, 72, 153, 0.2)' }}
            >
              {discountPercent > 0 ? (
                <>רכשו {selectedPkg?.stories} סיפורים ב-<span className="line-through opacity-60 mx-1">₪{selectedPkg?.price}</span> ₪{discountedPrice} ✨</>
              ) : (
                <>רכשו {selectedPkg?.stories} סיפורים ב-₪{selectedPkg?.price} ✨</>
              )}
            </Button>
            <button
              onClick={() => navigate('/adventure')}
              className="text-white/60 text-sm font-semibold hover:text-white/90 transition-colors py-1.5"
            >
              אולי אחר כך – חזרה לדף הבית ←
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <PurchaseSuccessModal open={showSuccess} onOpenChange={setShowSuccess} creditsAdded={purchasedCredits} />
      <PurchaseSuccessModal open={showSubscriptionSuccess} onOpenChange={setShowSubscriptionSuccess} creditsAdded={0} isSubscription />
      <PurchaseFailedModal open={showFailed} onOpenChange={setShowFailed} onRetry={handleRetry} />
    </div>
  );
};

export default Upgrade;
