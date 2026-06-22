import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import PurchaseSuccessModal from "./PurchaseSuccessModal";

/**
 * Global handler mounted at the app root. Primary mechanism is a Supabase
 * Realtime subscription on the user's `profiles` row — credit deltas are
 * pushed instantly. A focus/visibility-driven poll remains as a fallback
 * for environments where WebSocket is blocked.
 */
const GlobalPurchaseHandler = () => {
  const { user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [creditsAdded, setCreditsAdded] = useState(1);
  const pollingRef = useRef(false);
  const baselineRef = useRef<{
    story: number;
    coloring: number;
    editing: number;
    subscriber: boolean;
  } | null>(null);

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

    const handleDelta = (
      storyDelta: number,
      coloringDelta: number,
      editingDelta: number,
      subChanged: boolean,
    ) => {
      if (storyDelta <= 0 && coloringDelta <= 0 && editingDelta <= 0 && !subChanged) {
        return false;
      }
      window.dispatchEvent(new CustomEvent("purchase-completed"));
      window.dispatchEvent(new CustomEvent("coloring-credits-updated"));
      if (hasPending()) {
        sessionStorage.removeItem("growCheckoutPending");
        setCreditsAdded(Math.max(storyDelta, coloringDelta, editingDelta, 1));
        setShowSuccess(true);
      }
      return true;
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

        // Slower fallback cadence — Realtime is the primary path.
        for (let i = 0; i < 6; i++) {
          await new Promise((r) => setTimeout(r, 5000));
          const fresh = await readProfile();
          if (!fresh) continue;
          const storyDelta = (fresh.story_credits ?? 0) - bStory;
          const coloringDelta = (fresh.coloring_credits ?? 0) - bColoring;
          const editingDelta = (fresh.editing_credits ?? 0) - bEditing;
          const subChanged = !!fresh.is_subscriber && !bSub;
          if (handleDelta(storyDelta, coloringDelta, editingDelta, subChanged)) {
            return;
          }
        }
      } finally {
        pollingRef.current = false;
      }
    };

    // --- Realtime subscription (primary path) ---
    let cancelled = false;
    (async () => {
      const baseline = await readProfile();
      if (cancelled || !baseline) return;
      baselineRef.current = {
        story: baseline.story_credits ?? 0,
        coloring: baseline.coloring_credits ?? 0,
        editing: baseline.editing_credits ?? 0,
        subscriber: !!baseline.is_subscriber,
      };
    })();

    const channel = supabase
      .channel(`profile-credits-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const nw: any = payload.new ?? {};
          const od: any = payload.old ?? {};
          // Prefer payload.old when available (REPLICA IDENTITY FULL),
          // otherwise fall back to the cached baseline.
          const prev = baselineRef.current;
          const bStory = (od.story_credits ?? prev?.story ?? 0) as number;
          const bColoring = (od.coloring_credits ?? prev?.coloring ?? 0) as number;
          const bEditing = (od.editing_credits ?? prev?.editing ?? 0) as number;
          const bSub = !!(od.is_subscriber ?? prev?.subscriber ?? false);

          const storyDelta = (nw.story_credits ?? 0) - bStory;
          const coloringDelta = (nw.coloring_credits ?? 0) - bColoring;
          const editingDelta = (nw.editing_credits ?? 0) - bEditing;
          const subChanged = !!nw.is_subscriber && !bSub;

          handleDelta(storyDelta, coloringDelta, editingDelta, subChanged);

          baselineRef.current = {
            story: nw.story_credits ?? bStory,
            coloring: nw.coloring_credits ?? bColoring,
            editing: nw.editing_credits ?? bEditing,
            subscriber: !!nw.is_subscriber,
          };
        },
      )
      .subscribe();

    const onFocus = () => { void poll(); };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void poll();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    // Also kick off immediately in case the tab regained focus before mount.
    void poll();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
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