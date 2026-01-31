import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, BookOpen, Gift, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PurchaseSuccessModal from "@/components/paywall/PurchaseSuccessModal";
import PurchaseFailedModal from "@/components/paywall/PurchaseFailedModal";
import PayPalButton from "@/components/paywall/PayPalButton";
import GlobalFooter from "@/components/GlobalFooter";
import { useCredits } from "@/hooks/use-credits";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import { useReferral } from "@/hooks/use-referral";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import elephantImage from "@/assets/elephant-hero.jpeg";
import { PRICING_PACKAGES, type PricingPackage } from "@/config/pricing";

const Upgrade = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const firstStoryId = searchParams.get('firstStory');
  const noCredits = searchParams.get('noCredits') === 'true';
  const { user } = useAuth();
  const { addCredits, refetch: refetchCredits } = useCredits();
  const { trackEvent } = useAnalytics();
  const { shareCoins, shareToWhatsApp, copyToClipboard, redeemCoin } = useReferral();
  
  const [selectedPackage, setSelectedPackage] = useState<string>("popular");
  const [showPayPal, setShowPayPal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [purchasedCredits, setPurchasedCredits] = useState(0);
  const [copied, setCopied] = useState(false);

  // Dynamic content based on state
  const title = firstStoryId 
    ? "🎉 הסיפור הראשון שלכם מוכן!"
    : noCredits 
      ? "✨ בואו נמשיך את הקסם"
      : "✨ רכשו עוד סיפורים";

  const subtitle = firstStoryId
    ? "המשיכו ליצור עוד סיפורים קסומים עם איורים מרהיבים בסגנון עכשווי שהילדים אוהבים!"
    : noCredits
      ? "אבל אפשר להמשיך ליצור סיפורים מדהימים! בחרו חבילה או שתפו עם חברים והרוויחו חינם."
      : "בחרו חבילה שמתאימה לכם והמשיכו ליצור סיפורים קסומים!";

  useEffect(() => {
    const viewType = firstStoryId ? 'first_story' : noCredits ? 'no_credits' : 'regular';
    trackEvent({ eventType: 'feature_used', metadata: { feature: 'paywall_view', view_type: viewType } });
  }, [trackEvent, firstStoryId, noCredits]);

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId);
    const pkg = PRICING_PACKAGES.find(p => p.id === packageId);
    trackEvent({ 
      eventType: 'feature_used', 
      metadata: { feature: 'package_selected', package: packageId, stories: pkg?.stories } 
    });
  };

  const handlePurchase = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setShowPayPal(true);
  };

  const handlePayPalSuccess = async () => {
    const pkg = PRICING_PACKAGES.find(p => p.id === selectedPackage);
    if (!pkg || !user) return;

    try {
      // Save purchase record
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

      // Add credits instantly
      const success = await addCredits(pkg.stories);
      
      if (success) {
        setPurchasedCredits(pkg.stories);
        setShowPayPal(false);
        setShowSuccess(true);
        trackEvent({ 
          eventType: 'feature_used', 
          metadata: { feature: 'purchase_completed', package: pkg.id, stories: pkg.stories, payment_method: 'paypal' } 
        });

        // Send confirmation email (non-blocking)
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
            if (error) {
              console.error('Failed to send confirmation email:', error);
            } else {
              console.log('Purchase confirmation email sent');
            }
          });
        }
      } else {
        throw new Error('Failed to add credits');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      setShowPayPal(false);
      setShowFailed(true);
      trackEvent({ 
        eventType: 'feature_used', 
        metadata: { feature: 'purchase_failed', package: pkg.id } 
      });
    }
  };

  const handlePayPalError = (error: any) => {
    console.error('PayPal error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error || {}))
    });
    setShowPayPal(false);
    setShowFailed(true);
    const pkg = PRICING_PACKAGES.find(p => p.id === selectedPackage);
    trackEvent({ 
      eventType: 'feature_used', 
      metadata: { feature: 'purchase_failed', package: pkg?.id, error: error?.message || 'paypal_error' } 
    });
  };

  const handleRetry = () => {
    setShowFailed(false);
    setShowPayPal(true);
  };

  const selectedPkg = PRICING_PACKAGES.find(p => p.id === selectedPackage);

  const handleCopyLink = async () => {
    const success = await copyToClipboard();
    if (success) {
      setCopied(true);
      toast.success("הקישור הועתק!");
      setTimeout(() => setCopied(false), 2000);
      trackEvent({ eventType: 'feature_used', metadata: { feature: 'share_link_copied', source: 'upgrade' } });
    }
  };

  const handleWhatsAppShare = () => {
    shareToWhatsApp();
    trackEvent({ eventType: 'feature_used', metadata: { feature: 'share_whatsapp', source: 'upgrade' } });
  };

  const handleRedeemCoin = async () => {
    const success = await redeemCoin();
    if (success) {
      toast.success("🎉 קיבלתם קרדיט סיפור נוסף!");
      await refetchCredits();
      trackEvent({ eventType: 'feature_used', metadata: { feature: 'coin_redeemed', source: 'upgrade' } });
    } else {
      toast.error("לא הצלחנו להמיר את המטבע");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-white overflow-hidden">
      {/* Close Button */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full bg-white/80 backdrop-blur"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="container max-w-md mx-auto px-4 py-3">
          {/* Elephant Image */}
          <div className="flex justify-center mb-4">
            <div className="w-28 h-28 rounded-xl overflow-hidden shadow-lg bg-white">
              <img 
                src={elephantImage} 
                alt="פיל חמוד קורא ספר" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-black text-foreground mb-2">
              {title}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Credit Badge */}
          <div className="flex justify-center mb-5">
            <Badge className="bg-purple text-purple-foreground px-4 py-1.5 text-sm font-medium rounded-full">
              ✨ 1 קרדיט = 1 סיפור מלא + איורים
            </Badge>
          </div>

          {/* Package Selection */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {PRICING_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleSelectPackage(pkg.id)}
                className={cn(
                  "relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 bg-card",
                  selectedPackage === pkg.id
                    ? "border-purple shadow-lg scale-[1.02]"
                    : "border-border hover:border-purple/50"
                )}
              >
                {/* Badge */}
                {pkg.badge && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-purple text-purple-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {pkg.badge}
                  </div>
                )}

                {/* Stories count */}
                <div className="text-2xl font-black text-foreground">
                  {pkg.stories}
                </div>
                <div className="text-xs text-muted-foreground mb-1">סיפורים</div>

                {/* Total Price */}
                <div className="text-xl font-bold text-foreground">
                  ₪{pkg.price}
                </div>

                {/* Price per story */}
                <div className="text-xs text-purple font-medium">
                  {pkg.pricePerStory} לסיפור
                </div>
                
                {/* Free edits badge */}
                <div className="text-[10px] text-green-600 mt-1.5 leading-tight text-center">
                  ✓ {pkg.freeEdits === 1 ? 'עריכה חינם' : `${pkg.freeEdits} עריכות חינם`}
                </div>
              </button>
            ))}
          </div>
        
          {/* Credit Card Note */}
          <p className="text-[10px] text-center text-muted-foreground mb-3">
            💳 ניתן לשלם בכרטיס אשראי גם ללא חשבון PayPal
          </p>

          {/* Earn Free Section */}
          <div className="bg-gradient-to-l from-secondary/20 via-primary/10 to-accent/20 rounded-xl p-3 border border-foreground/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-accent/30 flex items-center justify-center">
                <Gift className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-foreground">או הרוויחו חינם 🎁</h4>
                <p className="text-[10px] text-muted-foreground">שתפו וקבלו קרדיטים</p>
              </div>
            </div>
            
            {/* Share Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleWhatsAppShare} 
                size="sm"
                className="flex-1 h-8 text-xs bg-[#25D366] hover:bg-[#20BD5A] text-white"
              >
                וואטסאפ
              </Button>
              <Button 
                onClick={handleCopyLink} 
                variant="outline" 
                size="sm"
                className="flex-1 h-8 text-xs"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span className="mr-1">{copied ? 'הועתק!' : 'העתק'}</span>
              </Button>
            </div>
            
            {/* Redeem Coins */}
            {shareCoins > 0 && (
              <Button 
                onClick={handleRedeemCoin}
                size="sm"
                className="w-full mt-2 h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold"
              >
                🪙 {shareCoins} מטבעות - השתמשו!
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-2 safe-area-bottom">
        <div className="container max-w-md mx-auto flex flex-col items-center gap-1">
          {showPayPal ? (
            <div className="w-full space-y-2">
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">
                  {selectedPkg?.stories} סיפורים תמורת ₪{selectedPkg?.price}
                </p>
              </div>
              <PayPalButton
                amount={selectedPkg?.price || 0}
                onSuccess={handlePayPalSuccess}
                onError={handlePayPalError}
                onCancel={() => setShowPayPal(false)}
              />
              <button
                onClick={() => setShowPayPal(false)}
                className="w-full text-center text-muted-foreground text-xs py-0.5 hover:text-foreground transition-colors"
              >
                ביטול
              </button>
            </div>
          ) : (
            <>
              <Button
                onClick={handlePurchase}
                className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold text-base py-5 px-8 rounded-xl shadow-lg"
              >
                רכשו {selectedPkg?.stories} סיפורים ב-₪{selectedPkg?.price} ✨
              </Button>
          
              {firstStoryId ? (
                <button
                  onClick={() => navigate(`/story/${firstStoryId}`)}
                  className="text-muted-foreground text-xs py-0.5 hover:text-foreground transition-colors"
                >
                  אולי מאוחר יותר
                </button>
              ) : (
                <button
                  onClick={() => navigate('/')}
                  className="text-muted-foreground text-xs py-0.5 hover:text-foreground transition-colors"
                >
                  אולי מאוחר יותר
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <PurchaseSuccessModal
        open={showSuccess}
        onOpenChange={setShowSuccess}
        creditsAdded={purchasedCredits}
      />
      <PurchaseFailedModal
        open={showFailed}
        onOpenChange={setShowFailed}
        onRetry={handleRetry}
      />
      <GlobalFooter />
    </div>
  );
};

export default Upgrade;
