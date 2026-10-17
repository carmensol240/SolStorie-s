import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
