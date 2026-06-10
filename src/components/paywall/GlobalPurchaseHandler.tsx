import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import PurchaseSuccessModal from "./PurchaseSuccessModal";

/**
 * Global handler mounted at the app root. When ANY component triggers
 * `openGrowCheckout`, a sessionStorage flag is set. When the user returns
 * from the Grow tab (focus/visibility) we poll the profile for credit
 * changes and surface the PurchaseSuccessModal on every flow — not just
 * the Upgrade page.
 */
const GlobalPurchaseHandler = () => {
  const { user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [creditsAdded, setCreditsAdded] = useState(1);
  const pollingRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return;

    const hasPending = () => {
      try {
        const raw = sessionStorage.getItem("growCheckoutPending");
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        // Expire after 30 minutes
        if (Date.now() - (parsed?.startedAt ?? 0) > 30 * 60 * 1000) {
          sessionStorage.removeItem("growCheckoutPending");
          return false;
        }
        return true;
      } catch {
        return false;
      }
    };

    const readProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("story_credits, coloring_credits, editing_credits, free_edits_remaining, is_subscriber")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    };

    const poll = async () => {
      if (pollingRef.current) return;
      if (!hasPending()) return;
      pollingRef.current = true;
      try {
        const baseline = await readProfile();
        if (!baseline) return;
        const bStory = baseline.story_credits ?? 0;
        const bColoring = baseline.coloring_credits ?? 0;
        const bEditing = baseline.editing_credits ?? 0;
        const bSub = !!baseline.is_subscriber;

        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const fresh = await readProfile();
          if (!fresh) continue;
          const storyDelta = (fresh.story_credits ?? 0) - bStory;
          const coloringDelta = (fresh.coloring_credits ?? 0) - bColoring;
          const editingDelta = (fresh.editing_credits ?? 0) - bEditing;
          const subChanged = !!fresh.is_subscriber && !bSub;
          if (storyDelta > 0 || coloringDelta > 0 || editingDelta > 0 || subChanged) {
            sessionStorage.removeItem("growCheckoutPending");
            window.dispatchEvent(new CustomEvent("purchase-completed"));
            window.dispatchEvent(new CustomEvent("coloring-credits-updated"));
            setCreditsAdded(Math.max(storyDelta, coloringDelta, editingDelta, 1));
            setShowSuccess(true);
            return;
          }
        }
      } finally {
        pollingRef.current = false;
      }
    };

    const onFocus = () => { void poll(); };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void poll();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    // Also kick off immediately in case the tab regained focus before mount.
    void poll();
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user?.id]);

  return (
    <PurchaseSuccessModal
      open={showSuccess}
      onOpenChange={setShowSuccess}
      creditsAdded={creditsAdded}
    />
  );
};

export default GlobalPurchaseHandler;