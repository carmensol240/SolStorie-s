import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, FlaskConical } from "lucide-react";

// Whitelisted test email - hardcoded for security
const WHITELISTED_TEST_EMAIL = "carmit1901+test@gmail.com";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PurchaseSuccessModal from "@/components/paywall/PurchaseSuccessModal";
import PurchaseFailedModal from "@/components/paywall/PurchaseFailedModal";
import PayPalButton from "@/components/paywall/PayPalButton";
import CouponInput from "@/components/paywall/CouponInput";

import { useCredits } from "@/hooks/use-credits";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import elephantImage from "@/assets/elephant-hero.jpeg";
import { PRICING_PACKAGES } from "@/config/pricing";

const Upgrade = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const firstStoryId = searchParams.get('firstStory');
  const noCredits = searchParams.get('noCredits') === 'true';
  const { user } = useAuth();
  const { addCredits, refetch: refetchCredits } = useCredits();
  const { trackEvent } = useAnalytics();
  
  const [selectedPackage, setSelectedPackage] = useState<string>("popular");
  const [showPayPal, setShowPayPal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [purchasedCredits, setPurchasedCredits] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);

  const title = "נהניתם מהסיפור?";
  const subtitle = "המשיכו את הקסם עם חבילת קרדיטים חדשה";

  useEffect(() => {
    const viewType = firstStoryId ? 'first_story' : noCredits ? 'no_credits' : 'regular';
    trackEvent({ eventType: 'feature_used', metadata: { feature: 'paywall_view', view_type: viewType } });
  }, [trackEvent, firstStoryId, noCredits]);

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
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          package_name: pkg.id,
          credits_purchased: pkg.stories,
          amount_ils: pkg.price,
          status: 'completed',
        });
      if (purchaseError) throw purchaseError;
      const success = await addCredits(pkg.stories);
      if (success) {
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
              amount: pkg.price,
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

  const selectedPkg = PRICING_PACKAGES.find(p => p.id === selectedPackage);

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
                src={elephantImage} 
                alt="פיל חמוד קורא ספר" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-4">
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

          {/* Package Cards — Glassmorphism */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {PRICING_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleSelectPackage(pkg.id)}
                className={cn(
                  "relative flex flex-col items-center p-3 rounded-2xl border transition-all duration-200",
                  "bg-white/10 backdrop-blur-md",
                  selectedPackage === pkg.id
                    ? "border-white/50 shadow-lg scale-[1.03] bg-white/20"
                    : "border-white/15 hover:border-white/30"
                )}
              >
                {pkg.badge && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg">
                    {pkg.badge}
                  </div>
                )}

                <div className="text-3xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
                  {pkg.stories}
                </div>
                <div className="text-sm text-white/80 font-bold mb-1">סיפורים</div>

                <div className="text-xl font-black text-white">
                  ₪{pkg.price}
                </div>
                <div className="text-xs text-purple-300 font-bold">
                  {pkg.pricePerStory} לסיפור
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg px-2 py-1 mt-2">
                  <span className="text-[10px] text-green-300 font-bold">
                    +{pkg.freeEdits} עריכות חינם
                  </span>
                </div>
              </button>
            ))}
          </div>
        
          {/* Coupon */}
          <div className="mb-4">
            <CouponInput 
              onDiscountApplied={(percent) => setDiscountPercent(percent)}
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

          {/* Test User Section */}
          {isTestUser && (
            <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-400/30 border-dashed rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="w-5 h-5 text-amber-300" />
                <h4 className="font-bold text-sm text-amber-200">🧪 מצב בדיקה (Test Mode)</h4>
              </div>
              <p className="text-xs text-amber-200/70 mb-2">
                משתמש מורשה - קרדיטים יתווספו ללא תשלום
              </p>
              <div className="flex gap-2">
                <Button onClick={() => handleAddTestCredits(5)} size="sm" variant="outline" className="flex-1 h-8 text-xs border-amber-400/40 text-amber-200 hover:bg-amber-500/20 bg-transparent">+5 קרדיטים</Button>
                <Button onClick={() => handleAddTestCredits(10)} size="sm" variant="outline" className="flex-1 h-8 text-xs border-amber-400/40 text-amber-200 hover:bg-amber-500/20 bg-transparent">+10 קרדיטים</Button>
                <Button onClick={() => handleAddTestCredits(50)} size="sm" className="flex-1 h-8 text-xs bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 border border-amber-400/30">+50 קרדיטים</Button>
              </div>
            </div>
          )}

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
              <p className="text-sm font-bold text-white text-center mb-3">
                {selectedPkg?.stories} סיפורים תמורת ₪{selectedPkg?.price}
              </p>
              <PayPalButton
                amount={selectedPkg?.price || 0}
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
        </div>
      </div>

      {/* Fixed CTA */}
      {!showPayPal && (
        <div className="fixed bottom-0 left-0 right-0 bg-[hsl(250,50%,12%)]/95 backdrop-blur border-t border-white/10 px-4 py-3 safe-area-bottom z-20">
          <div className="container max-w-md mx-auto flex flex-col items-center gap-1">
            <Button
              onClick={handlePurchase}
              className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-400 hover:via-pink-400 hover:to-orange-400 text-white font-black text-sm py-3 rounded-xl shadow-xl"
              style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.4), 0 0 60px rgba(236, 72, 153, 0.2)' }}
            >
              רכשו {selectedPkg?.stories} סיפורים ב-₪{selectedPkg?.price} ✨
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
      <PurchaseFailedModal open={showFailed} onOpenChange={setShowFailed} onRetry={handleRetry} />
    </div>
  );
};

export default Upgrade;
