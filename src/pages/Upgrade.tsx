import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, Crown } from "lucide-react";

const WHITELISTED_TEST_EMAIL = "carmit1901+test@gmail.com";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PurchaseSuccessModal from "@/components/paywall/PurchaseSuccessModal";
import PurchaseFailedModal from "@/components/paywall/PurchaseFailedModal";
import PayPalButton from "@/components/paywall/PayPalButton";
import CouponInput from "@/components/paywall/CouponInput";
import UserDetailsForm, { UserDetailsRef } from "@/components/paywall/UserDetailsForm";

import { useCredits } from "@/hooks/use-credits";
import { useSubscription } from "@/hooks/use-subscription";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PRICING_PACKAGES, EDUCATOR_PACKAGES, TOOLKIT_SUBSCRIPTION } from "@/config/pricing";
import FlippingBookAnimation from "@/components/upgrade/FlippingBookAnimation";


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
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [showToolkitPayPal, setShowToolkitPayPal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSubscriptionSuccess, setShowSubscriptionSuccess] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [purchasedCredits, setPurchasedCredits] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [failedPurchaseType, setFailedPurchaseType] = useState<'stories' | 'coloring' | 'edit' | 'toolkit' | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [userDetailsValid, setUserDetailsValid] = useState(true);
  const userDetailsRef = useRef<UserDetailsRef>(null);

  const title = "אהבתם? 💛";

  useEffect(() => {
    const viewType = firstStoryId ? 'first_story' : noCredits ? 'no_credits' : 'regular';
    trackEvent({ eventType: 'feature_used', metadata: { feature: 'paywall_view', view_type: viewType } });
  }, [trackEvent, firstStoryId, noCredits]);

  // Fetch user role
  useEffect(() => {
    const fetchRole = async () => {
      if (!user) { setRoleLoaded(true); return; }
      const { data } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.user_role) setUserRole(data.user_role);
      setRoleLoaded(true);
    };
    fetchRole();
  }, [user]);

  // Default selected package to educator_popular for educators
  useEffect(() => {
    if (roleLoaded && userRole === 'educator' && selectedPackage === 'popular') {
      setSelectedPackage('educator_popular');
    }
  }, [roleLoaded, userRole]);

  const isTestUser = user?.email?.toLowerCase() === WHITELISTED_TEST_EMAIL.toLowerCase();

  const ALL_PURCHASE_PACKAGES = [...PRICING_PACKAGES, ...EDUCATOR_PACKAGES];

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId);
    const pkg = ALL_PURCHASE_PACKAGES.find(p => p.id === packageId);
    trackEvent({ 
      eventType: 'feature_used', 
      metadata: { feature: 'package_selected', package: packageId, stories: pkg?.stories } 
    });
  };

  const handleTestPurchase = async () => {
    if (!isTestUser || !user) return;
    const pkg = ALL_PURCHASE_PACKAGES.find(p => p.id === selectedPackage);
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
        const { data: profileData } = await supabase.from('profiles').select('free_edits_remaining, free_edits_total, coloring_credits').eq('id', user.id).maybeSingle();
        await supabase.from('profiles').update({
          free_edits_remaining: (profileData?.free_edits_remaining ?? 0) + pkg.freeEdits,
          free_edits_total: (profileData?.free_edits_total ?? 0) + pkg.freeEdits,
          coloring_credits: (profileData?.coloring_credits ?? 0) + (pkg.freeColoringPages ?? 0),
        }).eq('id', user.id);
        window.dispatchEvent(new CustomEvent('coloring-credits-updated'));
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

  const verifyPurchase = async (orderId: string, packageId: string, amount: number, couponCode?: string | null) => {
    if (!user) throw new Error('User not authenticated');
    console.log(`[VERIFY] Calling verify-purchase: order=${orderId}, pkg=${packageId}, amount=${amount}`);
    const { data, error } = await supabase.functions.invoke('verify-purchase', {
      body: { orderId, packageId, amount, userId: user.id, couponCode: couponCode || undefined },
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Verification failed');
    console.log('[VERIFY] ✅ Purchase verified:', data);
    return data;
  };

  const handlePayPalSuccess = async (orderId: string) => {
    const pkg = ALL_PURCHASE_PACKAGES.find(p => p.id === selectedPackage);
    if (!pkg || !user) {
      console.error('[PURCHASE] user or pkg is null at callback time', { user: !!user, pkg: !!pkg });
      setShowFailed(true);
      setFailedPurchaseType('stories');
      return;
    }
    try {
      const finalPrice = discountPercent > 0 ? Math.round(pkg.price * (1 - discountPercent / 100)) : pkg.price;
      await verifyPurchase(orderId, pkg.id, finalPrice, appliedCouponCode);
      
      refetchCredits();
      window.dispatchEvent(new CustomEvent('coloring-credits-updated'));
      setPurchasedCredits(pkg.stories);
      setShowPayPal(false);
      setShowSuccess(true);
      await userDetailsRef.current?.saveToProfile();
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
        }).catch(err => console.error('Failed to send confirmation email:', err));
      }
    } catch (error) {
      console.error('Purchase verification failed:', error);
      setShowPayPal(false);
      setShowFailed(true);
      setFailedPurchaseType('stories');
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
    setFailedPurchaseType('stories');
    const pkg = ALL_PURCHASE_PACKAGES.find(p => p.id === selectedPackage);
    trackEvent({ eventType: 'feature_used', metadata: { feature: 'purchase_failed', package: pkg?.id, error: error?.message || 'paypal_error' } });
  };

  const handleRetry = () => {
    setShowFailed(false);
    switch (failedPurchaseType) {
      case 'toolkit': setShowToolkitPayPal(true); break;
      default: setShowPayPal(true); break;
    }
    setFailedPurchaseType(null);
  };

  const handleToolkitPurchase = () => {
    if (!user) { navigate("/auth"); return; }
    setShowToolkitPayPal(true);
  };

  const handleToolkitPayPalSuccess = async (orderId: string) => {
    if (!user) return;
    try {
      await verifyPurchase(orderId, TOOLKIT_SUBSCRIPTION.id, TOOLKIT_SUBSCRIPTION.price);
      refetchSubscription();
      setShowToolkitPayPal(false);
      setShowSubscriptionSuccess(true);
      trackEvent({ eventType: 'feature_used', metadata: { feature: 'toolkit_subscription_completed', payment_method: 'paypal' } });
    } catch (error) {
      console.error('Toolkit purchase failed:', error);
      setShowToolkitPayPal(false);
      setShowFailed(true);
      setFailedPurchaseType('toolkit');
    }
  };

  const handleToolkitPayPalError = (error: any) => {
    console.error('Toolkit PayPal error:', error);
    setShowToolkitPayPal(false);
    setShowFailed(true);
    setFailedPurchaseType('toolkit');
  };

  const selectedPkg = ALL_PURCHASE_PACKAGES.find(p => p.id === selectedPackage);
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
          {/* Header */}
          <div className="text-center mb-4 flex flex-col items-center">
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent mb-1">
              {title}
            </h1>
          </div>

          {/* Holiday promotion */}
          <div className="mb-4 text-center">
            <p className="text-white text-sm font-bold">
              {"\u200B"}
            </p>
          </div>

          {/* Package Cards — Glassmorphism (parents only) */}
          {roleLoaded && userRole === 'parent' && (
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

                <div className="text-3xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
                  {pkg.stories}
                </div>
                <div className="text-sm text-white/80 font-bold mb-1">סיפורים</div>

                <div className="text-xl font-black text-white animate-price-glow">
                  ₪{pkg.price}
                </div>
                <div className="text-xs text-purple-300 font-bold">
                  {pkg.pricePerStory} לסיפור
                </div>
                <div className="text-[10px] text-white/70 font-semibold mt-1">
                  ✨ 1 קרדיט = סיפור מלא
                </div>

                {pkg.freeEdits > 0 && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg px-2 py-1 mt-2">
                  <span className="text-[10px] text-green-300 font-bold">
                    {pkg.freeEdits} עריכות 🎁
                  </span>
                </div>
                )}
                {pkg.freeColoringPages > 0 && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg px-2 py-1 mt-1">
                  <span className="text-[10px] text-orange-300 font-bold">
                    {pkg.freeColoringPages} דפי צביעה 🎨
                  </span>
                </div>
                )}
              </button>
            ))}
          </div>
          )}

          {/* Book mockup — below packages */}
          <FlippingBookAnimation />

          <p className="text-center mb-4 font-bold" style={{ fontSize: '17px', color: '#c084fc' }}>
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

          {/* Educator Packages — 3 cards */}
          {roleLoaded && userRole === 'educator' && (
            <div className="mb-4">
              <h3 className="text-center text-sm font-black text-blue-200 mb-3">
                🎓 חבילות לאנשי חינוך וטיפול
              </h3>
              <div className="grid grid-cols-3 gap-3 pt-4">
                {EDUCATOR_PACKAGES.map((pkg) => (
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
                    {pkg.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg z-10">
                        {pkg.badge}
                      </div>
                    )}
                    <div className="text-3xl font-black bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                      {pkg.stories}
                    </div>
                    <div className="text-sm text-white/80 font-bold mb-1">סיפורים</div>
                    <div className="text-xl font-black text-white animate-price-glow">
                      ₪{pkg.price}
                    </div>
                    <div className="text-xs text-blue-300 font-bold">
                      {pkg.pricePerStory} לסיפור
                    </div>
                    <div className="text-[10px] text-white/70 font-semibold mt-1">
                      ✨ 1 קרדיט = סיפור מלא
                    </div>
                    {pkg.freeEdits > 0 && (
                      <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg px-2 py-1 mt-2">
                        <span className="text-[10px] text-green-300 font-bold">
                          {pkg.freeEdits} עריכות 🎁
                        </span>
                      </div>
                    )}
                    {pkg.freeColoringPages > 0 && (
                      <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg px-2 py-1 mt-1">
                        <span className="text-[10px] text-orange-300 font-bold">
                          {pkg.freeColoringPages} דפי צביעה 🎨
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Coupon */}
          <div className="mb-4">
            <CouponInput 
              onDiscountApplied={(percent, code) => { setDiscountPercent(percent); setAppliedCouponCode(code || null); }}
              onStoriesAdded={() => { refetchCredits(); }}
            />
          </div>

          {/* Credit Card Note — glass style */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3 mb-4">
            <p className="text-sm text-center text-white/80 font-bold flex items-center justify-center gap-2">
              💳 ניתן לשלם בכרטיס אשראי גם ללא חשבון PayPal
            </p>
            <p className="text-xs text-center text-white/50 mt-1">
              Visa, Mastercard, American Express ועוד
            </p>
          </div>

          {/* Gift Card Link — disabled, coming soon */}
          <div
            className="relative flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-pink-400/20 rounded-xl p-3 mb-4 opacity-60 cursor-not-allowed"
          >
            <span className="absolute -top-2 -left-2 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow">בקרוב</span>
            <span className="text-sm font-bold text-white/90">🎁 רוצה לשלוח סיפורים במתנה?</span>
          </div>

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
              <UserDetailsForm ref={userDetailsRef} onValidChange={setUserDetailsValid} />
              {!userDetailsValid && <p className="text-red-400 text-xs text-center mb-2">נא להזין טלפון תקין להמשך</p>}
              {userDetailsValid && <PayPalButton
                amount={discountPercent > 0 ? discountedPrice : (selectedPkg?.price || 0)}
                onSuccess={handlePayPalSuccess}
                onError={handlePayPalError}
                onCancel={() => setShowPayPal(false)}
              />}
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
