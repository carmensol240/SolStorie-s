import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CreditKind = "digital" | "full";

/** Story credits split by package: full-story credits are tracked separately; the rest are digital. */
export function splitCredits(total: number, fullRemaining: number) {
  const full = Math.max(0, Math.min(total, fullRemaining));
  return { full, digital: Math.max(0, total - full), total: Math.max(0, total) };
}

export function useCreditKinds(userId?: string | null, enabled = true) {
  const [state, setState] = useState({ digital: 0, full: 0, total: 0, loaded: false });
  const refresh = useCallback(async () => {
    if (!userId) { setState({ digital: 0, full: 0, total: 0, loaded: true }); return { digital: 0, full: 0, total: 0 }; }
    const [{ data: prof }, { data: lots }] = await Promise.all([
      supabase.from("profiles").select("story_credits").eq("id", userId).maybeSingle(),
      supabase.from("story_credit_lots").select("remaining").eq("user_id", userId),
    ]);
    const fullRemaining = (lots ?? []).reduce((a, r) => a + (r.remaining ?? 0), 0);
    const split = splitCredits(prof?.story_credits ?? 0, fullRemaining);
    setState({ ...split, loaded: true });
    return split;
  }, [userId]);
  useEffect(() => { if (enabled) refresh(); }, [enabled, refresh]);
  return { ...state, refresh };
}
