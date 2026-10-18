import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import PersonalizedStoryCover from "@/components/paywall/PersonalizedStoryCover";
import { openGrowCheckout } from "@/config/grow-links";
import { useAuth } from "@/hooks/use-auth";
import { CATALOG, formatPrice } from "@/config/promo";
import { useCreditKinds, type CreditKind } from "@/hooks/use-credit-kinds";
import CreditChoiceDialog from "@/components/story/CreditChoiceDialog";

interface DemoLockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  storyId?: string;
  /** Unpaid free taste: also offers opening it with an existing credit. */
  isTaste?: boolean;
  onUnlocked?: () => void;
}

const DemoLockModal = ({ open, onOpenChange, title, description, storyId, isTaste, onUnlocked }: DemoLockModalProps) => {
  const location = useLocation();
  const [showFeatures, setShowFeatures] = useState(false);
  const { user } = useAuth();
  const [unlocking, setUnlocking] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const credits = useCreditKinds(user?.id, open && !!isTaste);

  const startUnlock = () => {
    if (credits.full > 0 && credits.digital > 0) { setChoiceOpen(true); return; }
    unlockWithCredit(credits.full > 0 ? "full" : "digital");
  };

  const unlockWithCredit = async (creditKind: CreditKind) => {
    setChoiceOpen(false);
    if (!storyId || unlocking) return;
    setUnlocking(true);
    let id = storyId;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      const { data: row } = await supabase.from("stories").select("id").eq("slug", id).maybeSingle();
      id = row?.id ?? id;
    }
    const { error } = await supabase.functions.invoke("unlock-taste-story", { body: { storyId: id, creditKind } });
    setUnlocking(false);
    if (error) {
      toast({ variant: "destructive", title: "לא הצלחנו לפתוח את הסיפור", description: "נסו שוב בעוד רגע." });
      return;
    }
    toast({ title: "משלימים את הסיפור שלך…", description: "העמודים הנותרים יופיעו תוך דקה-שתיים ✨" });
    onUnlocked?.();
  };


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
    openGrowCheckout("digital", {
      userId: user?.id ?? null,
      storyId: storyId ?? null,
    });
  };

  const goPopular = () => {
    if (!storyId) return;
    onOpenChange(false);
    rememberReturn();
    openGrowCheckout("full", {
      userId: user?.id ?? null,
      storyId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-w-md text-center border-white/20 bg-gradient-to-b from-[hsl(260,60%,15%)] via-[hsl(270,40%,20%)] to-[hsl(250,50%,12%)] text-white p-5"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
            {title ?? "רוצים להמשיך לקרוא? 📖"}
          </DialogTitle>
          <p className="text-sm text-white/80 pt-1 text-center">
            {"\u200B"}
          </p>
        </DialogHeader>

        {storyId && (
          <div className="pt-2">
            <PersonalizedStoryCover storyId={storyId} />
          </div>
        )}

        <div className="flex flex-col gap-2 mt-2">
          {isTaste && credits.total > 0 && (
            <button
              onClick={startUnlock}
              disabled={unlocking}
              className="w-full min-h-[48px] bg-primary hover:bg-primary/90 text-white font-black text-base py-3 px-6 rounded-xl shadow-xl disabled:opacity-60"
            >
              {unlocking ? "פותחים…" : "פתחו את הסיפור הזה בקרדיט אחד"}
            </button>
          )}
          {/* Primary: digital story */}
          <button
            onClick={goSingleStory}
            className="w-auto max-w-[280px] mx-auto relative overflow-hidden bg-primary hover:bg-primary/90 text-white font-black text-sm py-3 px-6 rounded-xl shadow-xl text-center"
            style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.4), 0 0 60px rgba(236, 72, 153, 0.2)' }}
          >
            <div>
              {`${CATALOG.digital.title} – ${formatPrice("digital")} ₪`}
            </div>
          </button>
          <p className="text-white/80 text-sm font-semibold text-center -mt-1">
            כולל את כל דפי הצביעה מאיורי הסיפור
          </p>

          {storyId && (
            <>
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/30 to-transparent" />
                <span className="text-white/70 text-xs font-bold px-2">{"\u200B"}או</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </div>

              {/* Secondary: story + print file */}
              <button
                onClick={goPopular}
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-colors rounded-xl px-4 py-3 text-center"
              >
                <div className="text-white font-black text-sm">
                  {`${CATALOG.full.title} – ${formatPrice("full")} ₪`}
                </div>
                <ul className="mt-1.5 space-y-1 text-right">
                  {CATALOG.full.includes.map((t, i) => (
                    <li
                      key={t}
                      className={i === CATALOG.full.includes.length - 1 ? "text-xs font-black text-primary leading-snug" : "text-xs font-semibold text-white/80 leading-snug"}
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </button>
            </>
          )}

          <p className="text-white/60 text-xs font-semibold text-center pt-1">
            📚 הסיפור נשמר בספרייה החינמית שלך לכל החיים
          </p>

          <button
            onClick={() => onOpenChange(false)}
            className="text-white/50 text-xs font-semibold hover:text-white/80 transition-colors py-2 mt-1"
          >
            לא עכשיו
          </button>
        </div>
      </DialogContent>
      <CreditChoiceDialog
        open={choiceOpen}
        onOpenChange={setChoiceOpen}
        digital={credits.digital}
        full={credits.full}
        onChoose={unlockWithCredit}
      />
    </Dialog>
  );
};

export default DemoLockModal;