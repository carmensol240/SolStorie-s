import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type FunnelStep = { key: string; label: string };

const FUNNEL_STEPS: FunnelStep[] = [
  { key: "signup_completed", label: "נרשם/ה" },
  { key: "create_story_opened", label: "פתח/ה אשף יצירה" },
  { key: "child_info_completed", label: "מילא/ה פרטי ילד/ה" },
  { key: "photo_uploaded", label: "העלה/תה תמונה" },
  { key: "topic_selected", label: "בחר/ה נושא" },
  { key: "generation_started", label: "לחץ/ה צור סיפור" },
  { key: "story_created", label: "הסיפור נוצר" },
  { key: "paywall_view", label: "הגיע/ה למסך רכישה" },
  { key: "checkout_started", label: "נשלח/ה לסליקה" },
  { key: "purchase_completed", label: "השלים/ה רכישה" },
];

const STEP_LABELS: Record<string, string> = Object.fromEntries(
  FUNNEL_STEPS.map((s) => [s.key, s.label])
);
const FAILURE_LABELS: Record<string, string> = {
  generation_failed: "יצירת סיפור נכשלה",
  purchase_failed: "רכישה נכשלה",
};

interface EventRow {
  id: string;
  user_id: string | null;
  event_type: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

const RANGES = [
  { days: 7, label: "7 ימים" },
  { days: 30, label: "30 ימים" },
  { days: 90, label: "90 ימים" },
];

const FunnelSection = () => {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  // user lookup
  const [emailQuery, setEmailQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<
    { type: string; label: string; created_at: string; detail?: string; isError?: boolean }[] | null
  >(null);
  const [foundEmail, setFoundEmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("analytics_events")
      .select("id, user_id, event_type, created_at, metadata")
      .gte("created_at", since)
      .in("event_type", [...FUNNEL_STEPS.map((s) => s.key), "generation_failed", "purchase_failed"])
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) console.warn("[Funnel] load failed:", error.message);
    setRows((data as EventRow[]) || []);
    setLoading(false);
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const step of FUNNEL_STEPS) map[step.key] = new Set();
    for (const r of rows) {
      if (!map[r.event_type]) continue;
      map[r.event_type].add(r.user_id || `anon`);
    }
    return FUNNEL_STEPS.map((s) => ({ ...s, count: map[s.key].size }));
  }, [rows]);

  const maxCount = Math.max(1, ...counts.map((c) => c.count));

  const handleSearch = async () => {
    const email = emailQuery.trim().toLowerCase();
    if (!email) return;
    setSearching(true);
    setSearchError(null);
    setTimeline(null);
    setFoundEmail(null);
    try {
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("id, email, created_at")
        .ilike("email", email)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!profile) {
        setSearchError("לא נמצא משתמש עם האימייל הזה");
        return;
      }
      setFoundEmail(profile.email || email);

      const [{ data: evts }, { data: errs }] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("id, user_id, event_type, created_at, metadata")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: true })
          .limit(500),
        supabase
          .from("error_logs")
          .select("id, error_type, error_message, created_at")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: true })
          .limit(200),
      ]);

      const items = [
        {
          type: "account_created",
          label: "נוצר החשבון",
          created_at: profile.created_at as string,
        },
        ...((evts as EventRow[]) || []).map((e) => ({
          type: e.event_type,
          label: STEP_LABELS[e.event_type] || FAILURE_LABELS[e.event_type] || e.event_type,
          created_at: e.created_at,
          detail: e.metadata ? JSON.stringify(e.metadata) : undefined,
          isError: e.event_type in FAILURE_LABELS,
        })),
        ...((errs as { id: string; error_type: string; error_message: string; created_at: string }[]) || []).map((e) => ({
          type: e.error_type,
          label: `שגיאה: ${e.error_type}`,
          created_at: e.created_at,
          detail: e.error_message?.slice(0, 300),
          isError: true,
        })),
      ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      setTimeline(items);
    } catch (e) {
      console.warn("[Funnel] search failed:", e);
      setSearchError("החיפוש נכשל, נסי שוב");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Funnel overview */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">משפך שלבים</CardTitle>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <Button
                key={r.days}
                size="sm"
                variant={days === r.days ? "default" : "outline"}
                className="text-xs h-7"
                onClick={() => setDays(r.days)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            counts.map((c, i) => {
              const prev = i > 0 ? counts[i - 1].count : null;
              const drop = prev && prev > 0 ? Math.round(((prev - c.count) / prev) * 100) : null;
              return (
                <div key={c.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.label}</span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums font-bold">{c.count}</span>
                      {drop !== null && drop > 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          -{drop}%
                        </Badge>
                      )}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.round((c.count / maxCount) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
          <p className="text-xs text-muted-foreground pt-2">
            נספרים משתמשים ייחודיים. אירועים מלפני הטמעת המעקב אינם מופיעים.
          </p>
        </CardContent>
      </Card>

      {/* Single user timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">איפה משתמש/ת נעצר/ה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="אימייל של המשתמש/ת"
              className="text-right"
              dir="ltr"
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {searchError && <p className="text-sm text-destructive">{searchError}</p>}

          {timeline && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground" dir="ltr">
                {foundEmail}
              </p>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין אירועים מתועדים למשתמש/ת הזו.</p>
              ) : (
                <ol className="relative border-s-2 border-border ps-4 space-y-3">
                  {timeline.map((t, idx) => (
                    <li key={idx} className="relative">
                      <span
                        className={`absolute -start-[21px] top-1.5 w-2.5 h-2.5 rounded-full ${
                          t.isError ? "bg-destructive" : "bg-primary"
                        }`}
                      />
                      <div className="text-sm font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">
                        {new Date(t.created_at).toLocaleString("he-IL")}
                      </div>
                      {t.detail && (
                        <div className="text-xs text-muted-foreground break-all mt-0.5">{t.detail}</div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FunnelSection;