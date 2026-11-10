import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// Red banner at the top of the admin dashboard while an "AI balance ran out" alert is open.
export const AI_CREDIT_ALERT_TYPE = "ai_credits_exhausted";
export const AI_CREDIT_BANNER_TEXT = "נגמרה יתרת ה-AI. לקוחות לא יכולים ליצור סיפורים";

type Alert = { id: string; created_at: string | null; message: string };

export default function AiCreditAlertBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("admin_alerts")
      .select("id, created_at, message")
      .eq("alert_type", AI_CREDIT_ALERT_TYPE)
      .eq("is_resolved", false)
      .order("created_at", { ascending: false })
      .limit(20);
    setAlerts((data as Alert[]) || []);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (alerts.length === 0) return null;

  const resolve = async () => {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from("admin_alerts")
      .update({ is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: user?.id ?? null })
      .in("id", alerts.map((a) => a.id));
    setBusy(false);
    load();
  };

  const last = alerts[0]?.created_at ? new Date(alerts[0].created_at).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" }) : "";

  return (
    <div role="alert" className="rounded-lg border-2 border-destructive bg-destructive text-destructive-foreground p-4 flex items-start gap-3 flex-wrap">
      <AlertTriangle className="h-6 w-6 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-[200px]">
        <p className="font-bold text-lg">{AI_CREDIT_BANNER_TEXT}</p>
        {last && <p className="text-sm opacity-90">התראה אחרונה: {last}</p>}
      </div>
      <Button variant="secondary" size="sm" onClick={resolve} disabled={busy}>
        טופל, היתרה הוטענה
      </Button>
    </div>
  );
}
