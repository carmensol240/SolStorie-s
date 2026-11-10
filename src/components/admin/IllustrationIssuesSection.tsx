import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Admin-only list of story pages that need attention: missing pictures, pictures
// blocked by the main service, mismatched backup pictures, and old Flux backup pages.
const ISSUE_MODELS = ["none_failed", "held_refused", "held_mismatch", "fal_schnell_fallback", "backup_gpt_image"];

const LABELS: Record<string, string> = {
  none_failed: "חסרה תמונה (כשל)",
  held_refused: "נחסם ע״י שירות התמונות",
  held_mismatch: "גיבוי לא תאם — לא נשמר",
  fal_schnell_fallback: "נוצר בגיבוי ישן (סגנון שונה)",
  backup_gpt_image: "נוצר בגיבוי חדש",
};

// stories.text_issues = { pages: { "3": ["english:Leo", "nikud:..."] }, stage }
const TEXT_REASON: Record<string, string> = { not_edited: "העורך לא תיקן", english: "אנגלית", nikud: "חסר ניקוד" };
function issuePages(t: any): Record<string, string[]> {
  const pages = t?.pages ?? null;
  return pages && typeof pages === "object" ? pages : {};
}
function textIssuePages(t: any): string {
  return Object.keys(issuePages(t)).sort((a, b) => Number(a) - Number(b)).map((n) => `עמ׳ ${n}`).join(", ");
}
function textIssueSummary(t: any): string {
  return Object.entries(issuePages(t))
    .map(([n, codes]) => `עמוד ${n}: ${(codes || []).map((c) => {
      const i = c.indexOf(":");
      const kind = i < 0 ? c : c.slice(0, i);
      return `${TEXT_REASON[kind] || kind}${i < 0 ? "" : ` (${c.slice(i + 1)})`}`;
    }).join(", ")}`)
    .join(" · ");
}

type Row = {
  story_id: string;
  page_number: number;
  model_used: string;
  fallback_reason: string | null;
  created_at: string;
  slug?: string | null;
  email?: string | null;
  hasPicture?: boolean;
};

export default function IllustrationIssuesSection() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Stories finished with a page left without a picture (never marked ready).
  const [attention, setAttention] = useState<{ id: string; slug: string | null; child_name: string; created_at: string; text_issues: any }[]>([]);

  // Display only: stories the admin marked as handled are hidden from the list (status unchanged).
  const [handled, setHandled] = useState<Set<string>>(new Set());
  const [showHandled, setShowHandled] = useState(false);
  useEffect(() => {
    supabase.from("stories").select("id, slug, child_name, created_at, text_issues").eq("generation_status", "needs_attention")
      .order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setAttention((data as any) || []));
    supabase.from("admin_handled_items").select("item_id").eq("item_type", "story_attention")
      .then(({ data }) => setHandled(new Set((data || []).map((r: any) => r.item_id))));
  }, []);
  const toggleHandled = async (id: string) => {
    const isHandled = handled.has(id);
    const { data: { user } } = await supabase.auth.getUser();
    const { error: e } = isHandled
      ? await supabase.from("admin_handled_items").delete().eq("item_type", "story_attention").eq("item_id", id)
      : await supabase.from("admin_handled_items").insert({ item_type: "story_attention", item_id: id, handled_by: user?.id ?? null });
    if (e) { setError(e.message); return; }
    setHandled((prev) => { const n = new Set(prev); isHandled ? n.delete(id) : n.add(id); return n; });
  };
  const openAttention = attention.filter((s) => !handled.has(s.id));
  const shownAttention = showHandled ? attention : openAttention;

  useEffect(() => {
    (async () => {
      const { data: logs, error: e } = await supabase
        .from("illustration_logs")
        .select("story_id, page_number, model_used, fallback_reason, created_at")
        .in("model_used", ISSUE_MODELS)
        .order("created_at", { ascending: false })
        .limit(500);
      if (e) { setError(e.message); return; }
      // Keep only the latest log per page.
      const latest = new Map<string, Row>();
      for (const l of (logs || []) as Row[]) {
        const k = `${l.story_id}:${l.page_number}`;
        if (!latest.has(k)) latest.set(k, l);
      }
      const list = [...latest.values()];
      const storyIds = [...new Set(list.map((r) => r.story_id))];
      if (storyIds.length) {
        const [{ data: stories }, { data: pages }] = await Promise.all([
          supabase.from("stories").select("id, slug, user_id").in("id", storyIds),
          supabase.from("story_pages").select("story_id, page_number, illustration_url").in("story_id", storyIds),
        ]);
        const userIds = [...new Set((stories || []).map((s: any) => s.user_id).filter(Boolean))];
        const { data: profiles } = userIds.length
          ? await supabase.from("profiles").select("id, email").in("id", userIds)
          : { data: [] as any[] };
        const emailBy = new Map((profiles || []).map((p: any) => [p.id, p.email]));
        const storyBy = new Map((stories || []).map((s: any) => [s.id, s]));
        const pic = new Set((pages || []).filter((p: any) => p.illustration_url).map((p: any) => `${p.story_id}:${p.page_number}`));
        for (const r of list) {
          const s: any = storyBy.get(r.story_id);
          r.slug = s?.slug ?? null;
          r.email = s ? emailBy.get(s.user_id) ?? null : null;
          r.hasPicture = pic.has(`${r.story_id}:${r.page_number}`);
        }
      }
      setRows(list);
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>עמודים שדורשים תיקון איור</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="font-bold mb-2">דורש טיפול: סיפורים עם עמוד בלי איור או טקסט לא תקין ({openAttention.length})</h3>
          {attention.length > openAttention.length && (
            <button type="button" className="text-xs text-muted-foreground underline mb-2" onClick={() => setShowHandled((v) => !v)}>
              {showHandled ? "הסתר טופלו" : `הצג גם טופלו (${attention.length - openAttention.length})`}
            </button>
          )}
          {shownAttention.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין סיפורים שממתינים</p>
          ) : (
            <ul className="text-sm space-y-1">
              {shownAttention.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-2">
                  <a href={`/story/${s.id}`} target="_blank" rel="noreferrer" className="text-primary underline">
                    {s.child_name} · {s.slug || s.id.slice(0, 8)}
                  </a>
                  <span className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString("he-IL")}</span>
                  {textIssueSummary(s.text_issues) && (
                    <Badge variant="destructive" title={textIssueSummary(s.text_issues)}>טקסט לא תקין: {textIssuePages(s.text_issues)}</Badge>
                  )}
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => toggleHandled(s.id)}>
                    {handled.has(s.id) ? "בטל סימון" : "סמן כטופל"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        {!rows && !error && <Loader2 className="h-5 w-5 animate-spin" />}
        {rows && rows.length === 0 && <p className="text-sm text-muted-foreground">אין עמודים בעייתיים</p>}
        {rows && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-right">
                  <th className="p-2">תאריך</th>
                  <th className="p-2">משתמש/ת</th>
                  <th className="p-2">סיפור</th>
                  <th className="p-2">עמוד</th>
                  <th className="p-2">בעיה</th>
                  <th className="p-2">יש תמונה כרגע</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.story_id}:${r.page_number}`} className="border-t border-border">
                    <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString("he-IL")}</td>
                    <td className="p-2" dir="ltr">{r.email || "—"}</td>
                    <td className="p-2">
                      <a href={`/story/${r.story_id}`} target="_blank" rel="noreferrer" className="text-primary underline">
                        {r.slug || r.story_id.slice(0, 8)}
                      </a>
                    </td>
                    <td className="p-2">{r.page_number}</td>
                    <td className="p-2" title={r.fallback_reason || ""}>
                      <Badge variant="secondary">{LABELS[r.model_used] || r.model_used}</Badge>
                    </td>
                    <td className="p-2">{r.hasPicture ? "כן" : "לא"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
