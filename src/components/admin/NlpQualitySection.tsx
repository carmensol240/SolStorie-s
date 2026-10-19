import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Admin-only: NLP technique coverage per story, marked stories, and the quotes found per technique.
type Tech = { code: string; name: string; present: boolean; page: number | null; quote: string | null };
type Issue = { kind: string; page: number | null; quote: string; fixed: boolean };
type Report = { type: string; type_label: string; techniques: Tech[]; issues: Issue[]; fixed: boolean; fixed_pages: number[]; flagged: boolean; error?: string };
type Row = { id: string; slug: string | null; child_name: string; topic: string; created_at: string; nlp_report: Report };

export default function NlpQualitySection() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onlyFlagged, setOnlyFlagged] = useState(true);
  const [open, setOpen] = useState<Row | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error: e } = await supabase
        .from("stories")
        .select("id, slug, child_name, topic, created_at, nlp_report")
        .not("nlp_report", "is", null)
        .order("created_at", { ascending: false })
        .limit(300);
      if (e) setError(e.message);
      else setRows((data || []) as unknown as Row[]);
    })();
  }, []);

  const coverage = useMemo(() => {
    const m = new Map<string, { name: string; ok: number; total: number }>();
    for (const r of rows || []) for (const t of r.nlp_report.techniques || []) {
      const c = m.get(t.code) || { name: t.name, ok: 0, total: 0 };
      c.total++; if (t.present) c.ok++;
      m.set(t.code, c);
    }
    return [...m.values()];
  }, [rows]);

  const list = (rows || []).filter((r) => !onlyFlagged || r.nlp_report.flagged);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">כלי NLP בסיפורים</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-destructive text-sm">{error}</p>}
        {!rows && !error && <Loader2 className="h-5 w-5 animate-spin" aria-label="טוען" />}
        {rows && (
          <>
            <p className="text-sm text-muted-foreground">
              {rows.length} סיפורים נבדקו · {rows.filter((r) => r.nlp_report.fixed).length} תוקנו אוטומטית · {rows.filter((r) => r.nlp_report.flagged).length} מסומנים
            </p>
            <div className="flex flex-wrap gap-2">
              {coverage.map((c) => (
                <Badge key={c.name} variant="secondary">{c.name}: {Math.round((100 * c.ok) / c.total)}% ({c.ok}/{c.total})</Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={onlyFlagged ? "default" : "outline"} onClick={() => setOnlyFlagged(true)}>מסומנים בלבד</Button>
              <Button size="sm" variant={!onlyFlagged ? "default" : "outline"} onClick={() => setOnlyFlagged(false)}>כל הסיפורים</Button>
            </div>
            <ul className="divide-y divide-border">
              {list.map((r) => (
                <li key={r.id} className="py-2 flex items-center justify-between gap-2 text-sm">
                  <span>{r.child_name} · {r.topic} · <span className="text-muted-foreground">{r.nlp_report.type_label}</span>{" "}
                    {r.nlp_report.fixed && <Badge variant="outline">תוקן</Badge>} {r.nlp_report.flagged && <Badge variant="destructive">מסומן</Badge>}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => setOpen(r)}>משפטים</Button>
                </li>
              ))}
              {list.length === 0 && <li className="py-2 text-sm text-muted-foreground">אין סיפורים להצגה</li>}
            </ul>
          </>
        )}
      </CardContent>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{open?.child_name} · {open?.nlp_report.type_label}</DialogTitle></DialogHeader>
          {open?.nlp_report.error && <p className="text-destructive text-sm">הבדיקה לא הושלמה ({open.nlp_report.error})</p>}
          <ul className="space-y-3 text-sm">
            {open?.nlp_report.techniques.map((t) => (
              <li key={t.code}>
                <strong>{t.name}</strong>{" "}
                {t.present ? <span className="text-muted-foreground">(עמוד {t.page ?? "?"})</span> : <Badge variant="destructive">חסר</Badge>}
                {t.quote && <p className="mt-1">"{t.quote}"</p>}
              </li>
            ))}
            {open?.nlp_report.issues.map((i, k) => (
              <li key={k}>
                <strong>{i.kind === "outcome_promise" ? "הבטחת תוצאה" : "תוכן מפחיד/מאשים"}</strong> {i.fixed ? <Badge variant="outline">תוקן</Badge> : <Badge variant="destructive">לא תוקן</Badge>}
                <p className="mt-1">"{i.quote}"</p>
              </li>
            ))}
          </ul>
          {open?.nlp_report.fixed_pages?.length ? <p className="text-sm text-muted-foreground">עמודים שתוקנו: {open.nlp_report.fixed_pages.join(", ")}</p> : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
