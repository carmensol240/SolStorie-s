import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Database, Mail, Sparkles, Image as ImageIcon, Globe } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface ErrorLogRow {
  id: string;
  error_type: string;
  error_message: string;
  created_at: string;
}
interface IllustrationLogRow {
  model_used: string;
  created_at: string;
}

interface Props {
  errorLogs: ErrorLogRow[];
  illustrationLogs: IllustrationLogRow[];
}

interface ServiceHealthResp {
  db: { size_bytes: number | null; size_pretty: string; limit_bytes: number; error?: string };
  resend: { sent_this_month: number; ok: boolean; error: string | null };
}

interface SiteStatusResp {
  ok: boolean; status: number | null; response_ms: number; checked_at: string;
  build_time?: string | null; build_tag?: string | null; error?: string;
}

const ServiceHealthSection = ({ errorLogs, illustrationLogs }: Props) => {
  const [health, setHealth] = useState<ServiceHealthResp | null>(null);
  const [site, setSite] = useState<SiteStatusResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [health, site] = await Promise.all([
          supabase.functions.invoke("admin-service-health"),
          supabase.functions.invoke("admin-site-status"),
        ]);
        if (!cancelled) {
          if (!health.error) setHealth(health.data as ServiceHealthResp);
          if (!site.error) setSite(site.data as SiteStatusResp);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  // AI Gateway 402-style errors
  const aiErrors = errorLogs.filter(e => {
    const m = (e.error_message || "").toLowerCase();
    return m.includes("402") || m.includes("credits") || m.includes("quota") || m.includes("payment_required");
  });
  const aiLast = aiErrors[0]; // already sorted desc
  const ai24h = aiErrors.filter(e => new Date(e.created_at).getTime() >= dayAgo).length;
  const ai7d = aiErrors.filter(e => new Date(e.created_at).getTime() >= weekAgo).length;

  // Fal.ai
  const falUsage = illustrationLogs.filter(l => (l.model_used || "").toLowerCase().includes("fal"));
  const falLast = falUsage[0];
  const falErrors = errorLogs.filter(e => e.error_type === "illustration_fal_error");
  const fal24h = falErrors.filter(e => new Date(e.created_at).getTime() >= dayAgo).length;
  const fal7d = falErrors.filter(e => new Date(e.created_at).getTime() >= weekAgo).length;

  // DB
  const dbPct = health?.db.size_bytes && health.db.limit_bytes
    ? Math.min(100, (health.db.size_bytes / health.db.limit_bytes) * 100)
    : null;
  const dbWarn = dbPct !== null && dbPct > 90;

  // Resend
  const resendWarn = !!health && !health.resend.ok;

  const siteWarn = !!site && !site.ok;

  const StatusBadge = ({ warn, label }: { warn: boolean; label?: string }) => (
    warn ? (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="w-3 h-3" /> {label || "Errors in last 24h"}
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
        <CheckCircle2 className="w-3 h-3" /> Healthy
      </Badge>
    )
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
      {/* Lovable AI Gateway */}
      <Card className={ai24h > 0 ? "border-destructive" : ""}>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Lovable AI Gateway
          </CardTitle>
          <StatusBadge warn={ai24h > 0} />
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="text-xs text-muted-foreground">Last 402 / credits error:</div>
          <div className="font-medium">
            {aiLast ? `${formatDistanceToNow(new Date(aiLast.created_at))} ago` : "None"}
          </div>
          {aiLast && (
            <div className="text-xs text-muted-foreground">{format(new Date(aiLast.created_at), "yyyy-MM-dd HH:mm")}</div>
          )}
          <div className="text-xs pt-1">24h: <span className="font-semibold">{ai24h}</span> · 7d: <span className="font-semibold">{ai7d}</span></div>
          {ai24h > 0 && (
            <div className="mt-2 text-xs font-semibold text-destructive flex items-start gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              נגמרו קרדיטים — יש לטעון ב-Lovable Settings → Cloud & AI balance
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fal.ai */}
      <Card className={fal24h > 0 ? "border-destructive" : ""}>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Fal.ai
          </CardTitle>
          <StatusBadge warn={fal24h > 0} />
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="text-xs text-muted-foreground">Last usage:</div>
          <div className="font-medium">
            {falLast ? `${formatDistanceToNow(new Date(falLast.created_at))} ago` : "Never"}
          </div>
          {falLast && (
            <div className="text-xs text-muted-foreground">{format(new Date(falLast.created_at), "yyyy-MM-dd HH:mm")}</div>
          )}
          <div className="text-xs pt-1">Errors 24h: <span className="font-semibold">{fal24h}</span> · 7d: <span className="font-semibold">{fal7d}</span></div>
        </CardContent>
      </Card>

      {/* Supabase DB */}
      <Card className={dbWarn ? "border-destructive" : ""}>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="w-4 h-4" /> Supabase DB
          </CardTitle>
          <StatusBadge warn={dbWarn} label="Storage > 90%" />
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {loading && !health ? (
            <div className="text-xs text-muted-foreground">Loading…</div>
          ) : health?.db.error ? (
            <div className="text-xs text-destructive">Error: {health.db.error}</div>
          ) : (
            <>
              <div className="font-medium">
                {health?.db.size_pretty} / {prettyBytes(health?.db.limit_bytes || 0)}
              </div>
              {dbPct !== null && (
                <>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${dbWarn ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${dbPct}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">{dbPct.toFixed(1)}% used</div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Resend */}
      <Card className={resendWarn ? "border-destructive" : ""}>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4" /> Resend
          </CardTitle>
          <StatusBadge warn={resendWarn} label="API error" />
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {loading && !health ? (
            <div className="text-xs text-muted-foreground">Loading…</div>
          ) : health?.resend.ok ? (
            <>
              <div className="text-xs text-muted-foreground">Sends this month:</div>
              <div className="text-2xl font-bold">{health.resend.sent_this_month.toLocaleString()}</div>
            </>
          ) : (
            <>
              <div className="text-xs text-muted-foreground">Stats unavailable</div>
              {health?.resend.error && (
                <div className="text-xs text-destructive truncate" title={health.resend.error}>
                  {health.resend.error}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Live site */}
      <Card className={siteWarn ? "border-destructive" : ""}>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="w-4 h-4" /> האתר החי
          </CardTitle>
          <StatusBadge warn={siteWarn} label="לא עונה" />
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {loading && !site ? (
            <div className="text-xs text-muted-foreground">Loading…</div>
          ) : !site ? (
            <div className="text-xs text-muted-foreground">לא הצלחנו לבדוק</div>
          ) : (
            <>
              <div>
                <div className="text-xs text-muted-foreground">soulstory.co.il:</div>
                <div className="font-medium">
                  {site.ok ? `עונה (${site.status})` : `לא עונה${site.status ? ` (${site.status})` : ""}`} · {site.response_ms}ms
                </div>
                {site.error && <div className="text-xs text-destructive truncate" title={site.error}>{site.error}</div>}
                <div className="text-xs text-muted-foreground">נבדק {format(new Date(site.checked_at), "HH:mm:ss")}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">פרסום אחרון ב-Lovable:</div>
                {site.build_time ? (
                  <div className="font-medium text-xs">
                    {format(new Date(site.build_time), "yyyy-MM-dd HH:mm")} ({formatDistanceToNow(new Date(site.build_time))} ago)
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">יופיע אחרי הפרסום הבא</div>
                )}
                {site.build_tag && <div className="text-xs text-muted-foreground">גרסה: {site.build_tag}</div>}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function prettyBytes(bytes: number): string {
  if (!bytes) return "?";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes; let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export default ServiceHealthSection;