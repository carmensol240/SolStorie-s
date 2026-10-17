import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { useLocation } from "react-router-dom";
import PersonalizedStoryCover from "@/components/paywall/PersonalizedStoryCover";
import { openGrowCheckout } from "@/config/grow-links";
import { useAuth } from "@/hooks/use-auth";
import { getPrice } from "@/config/promo";

interface DemoLockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  storyId?: string;
}

const DemoLockModal = ({ open, onOpenChange, title, description, storyId }: DemoLockModalProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const singleStoryPrice = getPrice("single_story").toFixed(2);
  const popularPrice = getPrice("popular").toFixed(2);

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
      <DialogContent dir="rtl" className="max-w-md text-center border-border bg-background text-foreground p-5">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-foreground text-center">
            {title ?? "רוצים להמשיך לקרוא?"}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-base text-muted-foreground text-center">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {storyId && (
          <div className="pt-1">
            <PersonalizedStoryCover storyId={storyId} />
          </div>
        )}

        <div className="flex flex-col gap-3 mt-2">
          {storyId && (
            <button
              onClick={goPopular}
              className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-white px-4 py-3 text-center transition-colors"
            >
              <span className="block text-center text-base font-black">סיפור מלא · {popularPrice} ₪</span>
              <span className="block text-center text-sm text-white/90">כולל קובץ להדפסה ודפי צביעה</span>
            </button>
          )}
          <button
            onClick={goSingleStory}
            className={
              storyId
                ? "w-full rounded-2xl border-2 border-border bg-card hover:bg-muted text-foreground px-4 py-3 text-center transition-colors"
                : "w-full rounded-2xl bg-primary hover:bg-primary/90 text-white px-4 py-3 text-center transition-colors"
            }
          >
            <span className="block text-center text-base font-black">סיפור דיגיטלי · {singleStoryPrice} ₪</span>
          </button>

          <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-green-700" aria-hidden="true" />
            תשלום חד-פעמי, והסיפור נשמר אצלכם לתמיד
          </p>

          <button
            onClick={() => onOpenChange(false)}
            className="min-h-[44px] text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            לא עכשיו
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoLockModal;
