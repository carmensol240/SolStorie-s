import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type AdminViewMode = "demo" | "admin";

/** Pure rule: only a real admin (server role) in admin mode gets admin access. */
export function effectiveAdminFor(isAdmin: boolean, mode: AdminViewMode | null): boolean {
  return isAdmin && mode !== "demo";
}

const EVENT = "admin-mode-changed";

/** Admin role + saved view mode, both read from the server. Never from the browser or URL. */
export function useAdminMode() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mode, setModeState] = useState<AdminViewMode>("admin");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) { setIsAdmin(false); setModeState("admin"); setLoaded(true); return; }
    const { data: role } = await supabase.from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "admin").maybeSingle();
    const admin = !!role;
    let m: AdminViewMode = "admin";
    if (admin) {
      const { data } = await supabase.from("admin_view_mode").select("mode").eq("user_id", user.id).maybeSingle();
      if (data?.mode === "demo") m = "demo";
    }
    setIsAdmin(admin); setModeState(m); setLoaded(true);
  }, [user?.id]);

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener(EVENT, h);
    return () => window.removeEventListener(EVENT, h);
  }, [load]);

  const setMode = useCallback(async (next: AdminViewMode) => {
    if (!user?.id || !isAdmin) return;
    const { error } = await supabase.from("admin_view_mode")
      .upsert({ user_id: user.id, mode: next, updated_at: new Date().toISOString() });
    if (error) { console.error("[admin-mode]", error.message); return; }
    window.dispatchEvent(new Event(EVENT));
    window.location.reload();
  }, [user?.id, isAdmin]);

  return { isAdmin, mode, effectiveAdmin: effectiveAdminFor(isAdmin, mode), loaded, setMode };
}
