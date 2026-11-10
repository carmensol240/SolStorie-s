// A new story whose text still fails the final check after the Hebrew editor's safety net:
// one admin_alerts row + one email per story. Never throws.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { AI_CREDIT_ALERT_EMAIL } from "./ai-credit-alert.ts";

export const STORY_TEXT_ALERT_TYPE = "story_text_issue";

const REASON_HE: Record<string, string> = {
  not_edited: "העורך לא תיקן את העמוד",
  english: "אותיות באנגלית",
  nikud: "חסר ניקוד",
};

/** "עמוד 3: אותיות באנגלית (Leo); עמוד 5: חסר ניקוד (...)" */
export function describeTextIssues(pages: Record<string, string[]>): string {
  return Object.entries(pages)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([n, codes]) => `עמוד ${n}: ${codes.map((c) => {
      const [kind, detail = ""] = c.split(/:(.*)/s);
      return `${REASON_HE[kind] || kind}${detail ? ` (${detail})` : ""}`;
    }).join(", ")}`)
    .join("; ");
}

export async function reportStoryTextIssue(storyId: string, childName: string, pages: Record<string, string[]>, userId?: string | null): Promise<void> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    const sb = createClient(url, key);
    let alertUser = userId || null;
    if (!alertUser) {
      const { data: admin } = await sb.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
      alertUser = (admin as any)?.user_id ?? null;
    }
    if (!alertUser) return;
    const marker = `[${storyId}]`;
    const { data: existing } = await sb.from("admin_alerts").select("id")
      .eq("alert_type", STORY_TEXT_ALERT_TYPE).like("message", `%${marker}%`).limit(1).maybeSingle();
    if (existing) return; // one alert per story
    const details = describeTextIssues(pages);
    const message = `טקסט לא תקין בסיפור של ${childName} ${marker}: ${details}`.slice(0, 900);
    const { error } = await sb.from("admin_alerts").insert({ user_id: alertUser, alert_type: STORY_TEXT_ALERT_TYPE, message });
    if (error) console.error("[story-text-alert] insert failed:", error.message);

    const resend = Deno.env.get("RESEND_API_KEY");
    if (!resend) { console.warn("[story-text-alert] RESEND_API_KEY missing — email skipped"); return; }
    const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "SolStorie's™ <noreply@soulstory.co.il>",
        to: [AI_CREDIT_ALERT_EMAIL],
        subject: `⚠️ סיפור עם טקסט לא תקין — ${childName}`,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif">
          <h2 style="color:#b45309">סיפור חדש נשמר עם טקסט שלא עבר את הבדיקה</h2>
          <p>הסיפור של ${esc(childName)} סומן "דורש טיפול" בלוח הבקרה.</p>
          <p>${esc(details)}</p>
          <p><a href="https://soulstory.co.il/story/${storyId}">פתיחת הסיפור</a> · <a href="https://soulstory.co.il/admin/dashboard">לוח הבקרה</a></p></div>`,
      }),
    });
    if (!res.ok) console.error("[story-text-alert] email failed", res.status, await res.text());
  } catch (e) {
    console.error("[story-text-alert] failed:", (e as Error)?.message);
  }
}
