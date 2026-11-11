// Admin alert + email for a page that still fails the look check after all redraws.
// Never throws: a failed alert must not stop the drawing.
export async function notifyIllustrationIssue(supabase: any, storyId: string, pageNumber: number, message: string, held: boolean) {
  try {
    const { data: story } = await supabase.from("stories").select("user_id, child_name").eq("id", storyId).maybeSingle();
    if (story?.user_id) {
      await supabase.from("admin_alerts").insert({
        user_id: story.user_id,
        alert_type: held ? "illustration_held" : "illustration_hero_hidden",
        message: `סיפור ${storyId} עמוד ${pageNumber}: ${message}`.slice(0, 1000),
      });
    }
    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) { console.warn("[ILLUSTRATION-ALERT] RESEND_API_KEY missing — email skipped"); return; }
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
    const link = `https://soulstory.co.il/story/${storyId}`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "SolStorie's™ <noreply@soulstory.co.il>",
        to: ["solstories.nlp@gmail.com"],
        subject: `${held ? "⚠️ עמוד ממתין לטיפול" : "ℹ️ עמוד נשמר, הגיבור לא נראה מלפנים"} – ${story?.child_name || ""} עמוד ${pageNumber}`,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif">
          <p>${esc(message)}</p>
          <p>סיפור: ${esc(story?.child_name || "")} (${storyId})<br/>עמוד: ${pageNumber}</p>
          <p><a href="${link}">פתיחת הסיפור</a> · <a href="https://soulstory.co.il/admin/dashboard">ניהול</a></p></div>`,
      }),
    });
    if (!res.ok) console.warn("[ILLUSTRATION-ALERT] email failed", res.status, await res.text());
  } catch (e) {
    console.warn("[ILLUSTRATION-ALERT] failed:", (e as Error)?.message);
  }
}
