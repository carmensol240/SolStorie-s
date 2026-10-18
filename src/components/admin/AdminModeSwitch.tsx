import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminMode } from "@/hooks/use-admin-mode";

/** Demo/admin switch — renders only for users with the admin role (server-checked). */
export function AdminModeSwitch() {
  const { isAdmin, mode, setMode } = useAdminMode();
  if (!isAdmin) return null;
  return (
    <div className="mt-2 bg-accent/40 border border-border rounded-lg p-3 space-y-2" dir="rtl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">מצב תצוגה למנהל</span>
        <Badge variant="secondary" className="text-xs">{mode === "demo" ? "דמו" : "אדמין"}</Badge>
      </div>
      <div className="flex gap-1.5">
        <Button size="sm" variant={mode === "demo" ? "default" : "outline"} className="flex-1 h-10" onClick={() => setMode("demo")}>מצב דמו</Button>
        <Button size="sm" variant={mode === "admin" ? "default" : "outline"} className="flex-1 h-10" onClick={() => setMode("admin")}>מצב אדמין</Button>
      </div>
      <p className="text-xs text-muted-foreground leading-tight">
        דמו: רואה את האתר כמו הורה רגיל (נעילות, מחירים, חיוב קרדיטים). אדמין: גישה מלאה.
      </p>
    </div>
  );
}

/** Fixed on-screen label while an admin is in demo mode. */
export function AdminDemoBadge() {
  const { isAdmin, mode, setMode } = useAdminMode();
  if (!isAdmin || mode !== "demo") return null;
  return (
    <div className="fixed top-2 left-2 z-[60] flex items-center gap-2 rounded-full bg-destructive text-destructive-foreground px-3 py-1.5 shadow-lg text-sm" dir="rtl" role="status">
      <span className="font-bold">מצב דמו (אדמין)</span>
      <button className="underline min-h-[32px]" onClick={() => setMode("admin")}>חזרה לאדמין</button>
    </div>
  );
}
