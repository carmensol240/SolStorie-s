import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import PersonalizedStoryCover from "@/components/paywall/PersonalizedStoryCover";
import { openGrowCheckout } from "@/config/grow-links";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { isPromoActive, getPrice } from "@/config/promo";

interface DemoLockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  storyId?: string;
}

const DemoLockModal = ({ open, onOpenChange, title, description, storyId }: DemoLockModalProps) => {
  const location = useLocation();
  const [showFeatures, setShowFeatures] = useState(false);
  const { user } = useAuth();
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(false);
  const promoActive = isPromoActive();
  const showBonusOffer = isFirstTimeBuyer && promoActive;
  const singleStoryPrice = getPrice("single_story").toFixed(2);
  const popularPrice = getPrice("popular").toFixed(2);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("first_purchase_bonus_given")
          .eq("id", user.id)
          .maybeSingle();
        if (!cancelled) setIsFirstTimeBuyer(!data?.first_purchase_bonus_given);
      } catch {
        if (!cancelled) setIsFirstTimeBuyer(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, user]);

  const features = [
    "🎨 אווטאר מצויר ומותאם אישית לילד שלך",
    "🎙️ הקלטה והשמעה",
    "📲 שיתוף בוואטסאפ",
    "🖨️ הדפסה עצמאית (PDF)",
    "🎨 דפי צביעה",
    "📴 שימוש ללא אינטרנט",
    "📚 ספריית לימוד — צבעים, צורות, אותיות ומספרים",
    "🌍 סיפורים בעברית ואנגלית",
  ];

  const rememberReturn = () => {
    try {
      const page = sessionStorage.getItem(`storyReturnPage:${location.pathname}`);
      sessionStorage.setItem(
        "pendingStoryReturn",
        JSON.stringify({ path: location.pathname, page: page ? Number(page) : 0 })
      );
    } catch {}
  };

  const goSingleStory = () => {
    onOpenChange(false);
    rememberReturn();
    openGrowCheckout("singleStory", {
      userId: user?.id ?? null,
      storyId: storyId ?? null,
    });
  };

  const goPopular = () => {
    if (!storyId) return;
    onOpenChange(false);
    rememberReturn();
    openGrowCheckout("popular", {
      userId: user?.id ?? null,
      storyId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-w-md text-center border-border bg-background text-foreground p-5"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-primary">
            {title ?? "רוצים להמשיך לקרוא? 📖"}
          </DialogTitle>
          <p className="text-sm text-foreground pt-1 text-center">
            {"\u200B"}
          </p>
          {showBonusOffer && (
            <>
              <DialogDescription className="text-sm text-foreground pt-1 text-center">
                🎁 סיפור ראשון? מגיע לך מתנה!
              </DialogDescription>
              <DialogDescription className="text-sm text-foreground pt-1 text-center">
                רכשו ב-{singleStoryPrice} ₪ וקבלו סיפור דיגיטלי נוסף
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {storyId && (
          <div className="pt-2">
            <PersonalizedStoryCover storyId={storyId} />
          </div>
        )}

        <div className="flex flex-col gap-2 mt-2">
          {/* Primary: digital story */}
          <button
            onClick={goSingleStory}
            className="w-auto max-w-[280px] mx-auto relative overflow-hidden bg-primary hover:bg-primary/90 text-white font-black text-sm py-3 px-6 rounded-xl shadow-xl text-center"
            style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.4), 0 0 60px rgba(236, 72, 153, 0.2)' }}
          >
            <div>
              {showBonusOffer
                ? `רכישת 2 סיפורים דיגיטליים - ${singleStoryPrice}₪`
                : `רכישת הסיפור הדיגיטלי 📱 – ${singleStoryPrice}₪`}
            </div>
            {showBonusOffer && (
              <div className="text-xs font-bold text-foreground mt-0.5">
                כולל סיפור דיגיטלי שני במתנה 🎁
              </div>
            )}
          </button>
          <p className="text-foreground text-xs font-bold text-center -mt-1">
            {"\u200B"}
          </p>

          {storyId && (
            <>
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/30 to-transparent" />
                <span className="text-muted-foreground text-xs font-bold px-2">{"\u200B"}או</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </div>

              {/* Secondary: story + print file */}
              <button
                onClick={goPopular}
                className="w-full bg-card border border-border hover:bg-muted transition-colors rounded-xl px-4 py-3 text-center"
              >
                <div className="text-foreground font-black text-sm">
                  {showBonusOffer
                    ? `🎉 חבילת פתיחה - ${popularPrice}₪`
                    : `רכישת הסיפור + קובץ להדפסה 📖 – ${popularPrice}₪`}
                </div>
                {showBonusOffer ? (
                  <>
                    <div className="text-muted-foreground text-xs font-semibold mt-0.5">
                      2 סיפורים דיגיטליים + 2 קבצים להדפסה
                    </div>
                    <div className="text-foreground text-xs font-bold mt-0.5">
                      חבילת דפי צביעה מלאה 🎨
                    </div>
                    <div className="text-muted-foreground text-xs font-semibold mt-0.5">
                      (מבצע חד-פעמי לרכישה ראשונה)
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-muted-foreground text-xs font-semibold mt-0.5">
                      קריאה מלאה + שיתוף בוואטסאפ + הקלטת קול
                    </div>
                    <div className="text-foreground text-xs font-bold mt-0.5">
                      + חבילת דפי צביעה מלאה 🎨
                    </div>
                  </>
                )}
              </button>
            </>
          )}

          <p className="text-muted-foreground text-xs font-semibold text-center pt-1">
            📚 הסיפור נשמר בספרייה החינמית שלך לכל החיים
          </p>

          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground text-xs font-semibold hover:text-foreground/80 transition-colors py-2 mt-1"
          >
            לא עכשיו
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoLockModal;