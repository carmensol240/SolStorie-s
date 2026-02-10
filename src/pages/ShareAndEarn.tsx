import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Share2, UserPlus, Coins, BookOpen, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useReferral } from "@/hooks/use-referral";
import { useAnalytics } from "@/hooks/use-analytics";
import { useToast } from "@/hooks/use-toast";
import MobileNavigation from "@/components/MobileNavigation";
import { useState } from "react";

const ShareAndEarn = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { referralCode, shareCoins, loading, shareToWhatsApp, shareToFacebook, copyToClipboard, redeemCoin } = useReferral();
  const { trackEvent } = useAnalytics();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    trackEvent({ eventType: 'share_screen_view' });
  }, [trackEvent]);

  const handleWhatsAppShare = () => {
    trackEvent({ eventType: 'share_clicked', metadata: { platform: 'whatsapp' } });
    shareToWhatsApp();
  };

  const handleFacebookShare = () => {
    trackEvent({ eventType: 'share_clicked', metadata: { platform: 'facebook' } });
    shareToFacebook();
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard();
    if (success) {
      setCopied(true);
      trackEvent({ eventType: 'share_clicked', metadata: { platform: 'copy' } });
      toast({
        title: "הקישור הועתק! 📋",
        description: "עכשיו אפשר לשתף בכל מקום",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRedeemCoin = async () => {
    setRedeeming(true);
    const success = await redeemCoin();
    setRedeeming(false);
    
    if (success) {
      trackEvent({ eventType: 'coin_redeemed' });
      toast({
        title: "מטבע הומר בהצלחה! 🎉",
        description: "קרדיט סיפור נוסף לחשבון שלך",
      });
    } else {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו להמיר את המטבע",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const steps = [
    { icon: Share2, text: "משתפים קישור לאפליקציה", color: "text-blue-500" },
    { icon: UserPlus, text: "חבר/ה נרשמים דרך הקישור", color: "text-green-500" },
    { icon: Coins, text: "קיבלתם מטבע 🎉", color: "text-amber-500" },
    { icon: BookOpen, text: "יוצרים סיפור חינם", color: "text-purple-500" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-y-auto pb-20" dir="rtl" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Header */}
      <header className="flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container flex h-12 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="ml-2"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">שתפו והרוויחו</h1>
        </div>
      </header>

      <main className="container px-4 py-3 max-w-lg mx-auto space-y-4 flex-1 overflow-y-auto pb-20">
        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold">רוצים להרוויח סיפורים חינם? 🎉</h2>
          <p className="text-muted-foreground text-sm">
            שתפו את האפליקציה עם משפחה וחברים, ועל כל משתמש חדש שנרשם – תקבלו מטבע שיתוף 🎁
          </p>
          <p className="text-base font-semibold text-primary">
            כל מטבע = סיפור חינם
          </p>
        </div>

        {/* How it works */}
        <Card className="p-3">
          <h3 className="font-semibold mb-2 text-center text-sm">איך זה עובד?</h3>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center ${step.color}`}>
                  <step.icon className="w-4 h-4" />
                </div>
                <span className="flex-1 text-sm">{step.text}</span>
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Referral Code */}
        {referralCode && (
          <Card className="p-3 text-center bg-primary/5 border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">הקוד האישי שלך:</p>
            <p className="text-xl font-bold tracking-wider text-primary">{referralCode}</p>
          </Card>
        )}

        {/* Share Buttons */}
        <div className="space-y-2">
          <h3 className="font-semibold text-center text-sm">שתפו עכשיו</h3>
          
          <Button
            onClick={handleWhatsAppShare}
            className="w-full h-11 text-base gap-2"
            style={{ backgroundColor: '#25D366' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            שיתוף בוואטסאפ
          </Button>

          <Button
            onClick={handleFacebookShare}
            className="w-full h-11 text-base gap-2"
            style={{ backgroundColor: '#1877F2' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            שיתוף בפייסבוק
          </Button>

          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="w-full h-11 text-base gap-2"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 text-green-500" />
                הועתק!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                העתקת קישור
              </>
            )}
          </Button>
        </div>

        {/* Coins Status */}
        {shareCoins > 0 && (
          <Card className="p-4 text-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="w-6 h-6 text-amber-500" />
              <span className="text-2xl font-bold text-amber-600">{shareCoins}</span>
            </div>
            <p className="text-muted-foreground text-sm mb-2">מטבעות זמינים</p>
            <Button
              onClick={handleRedeemCoin}
              disabled={redeeming}
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {redeeming ? "ממיר..." : "השתמשו במטבע ליצירת סיפור"}
            </Button>
          </Card>
        )}

        {/* Anti-fraud microcopy - clearer explanation */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          הסיפור החינמי יתקבל רק לאחר שהחבר יסיים להירשם וליצור חשבון ב-SoulStory.
        </p>
      </main>

      <MobileNavigation />
    </div>
  );
};

export default ShareAndEarn;
