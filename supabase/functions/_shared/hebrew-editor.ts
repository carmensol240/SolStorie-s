// Hebrew language editor for children's book pages.
// Runs after page text is written (story creation, gender swap, AI text enhance) and before
// it is saved. Fixes gender agreement, broken sentences and nikud; never changes plot,
// names or page length. Any technical failure keeps the original text.

export const EDITOR_MAX_PAGE_CHARS = 300;
export const HEBREW_EDITOR_MODEL = "openai/gpt-6-astra";

export interface EditorPage { page_number: number; text: string }
export type EditorCall = (args: { systemPrompt: string; userPrompt: string; label: string }) => Promise<string | null>;

export interface EditorReport {
  edited: number[];
  rejected: number[];
  nikud_retry: number[];
  still_missing_nikud: number[];
  error?: string;
}

const NIKUD_RE = /[\u0591-\u05C7]/g;
const NIKUD_MARK_RE = /[\u05B0-\u05BC\u05C1\u05C2\u05C7]/;

export function stripNikud(text: string) {
  return text.replace(NIKUD_RE, "");
}

/** Hebrew words of 3+ letters that carry no vowel mark at all. */
export function wordsMissingNikud(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/[\s\u05BE\-–—]+/)) {
    const word = raw.replace(/[^\u05D0-\u05EA\u0591-\u05C7]/g, "");
    const letters = word.replace(NIKUD_RE, "");
    if (letters.length >= 3 && !NIKUD_MARK_RE.test(word)) out.push(letters);
  }
  return out;
}

/** True when the text is written with nikud (most Hebrew words carry marks). */
export function textHasNikud(texts: string[]): boolean {
  let words = 0, marked = 0;
  for (const t of texts) {
    for (const raw of t.split(/\s+/)) {
      const word = raw.replace(/[^\u05D0-\u05EA\u0591-\u05C7]/g, "");
      if (word.replace(NIKUD_RE, "").length < 2) continue;
      words++;
      if (NIKUD_MARK_RE.test(word)) marked++;
    }
  }
  return words > 0 && marked / words >= 0.3;
}

export function buildEditorSystemPrompt(nikud: boolean) {
  return `אתה עורך לשון עברית מקצועי לספרי ילדים. אתה מקבל את כל עמודי הסיפור יחד ומחזיר אותם מתוקנים באותו מבנה בדיוק.

מה לתקן:
1. התאמת מגדר נכונה בכל מקום לפי מגדר הגיבור/ה ולפי כל דמות: פעלים, תארים, כינויי גוף ומילות יחס עם כינוי ("לידו"/"לידה", "אותו"/"אותה", "שלו"/"שלה", "הוא מרגיש"/"היא מרגישה").
2. משפטים שלמים ותקינים: בלי חצאי משפטים, בלי משפט שחסר בו מושא ("אבא מחבק" → "אבא מחבק אותה"), בלי ביטויים לא טבעיים או לא דקדוקיים.
3. ${nikud
    ? "ניקוד מלא ונכון לכל מילה ומילה, כולל שמות פרטיים ומילים קצרות. אין להשאיר אף מילה בלי ניקוד. הניקוד חייב להתאים למשמעות בהקשר (למשל: אַבָּא, לְיָדָהּ, הַשָּׁנָה/הַשֵּׁנָה)."
    : "בלי ניקוד בכלל: אף סימן ניקוד או טעם."}

מה אסור:
- לא לשנות את התוכן, את העלילה, את סדר האירועים או את שמות הדמויות.
- לא להוסיף מילים מעבר למה שנדרש לתיקון, ולא למחוק תוכן.
- לא להאריך עמוד: כל עמוד עד ${EDITOR_MAX_PAGE_CHARS} תווים (בלי ניקוד), ובאורך דומה למקור.
- לא לאחד או לפצל עמודים. אותם מספרי עמודים בדיוק.
- לא להוסיף כותרות, הסברים או סימוני עמוד בתוך הטקסט.

החזר JSON בלבד: {"pages":[{"page_number":1,"text":"..."}]}`;
}

function parsePages(raw: string | null): EditorPage[] | null {
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (!Array.isArray(parsed?.pages)) return null;
    return parsed.pages
      .filter((p: any) => Number.isFinite(Number(p?.page_number)) && typeof p?.text === "string")
      .map((p: any) => ({ page_number: Number(p.page_number), text: String(p.text).trim() }));
  } catch {
    return null;
  }
}

/** Safety checks so an edit can never change the story beyond a language fix. */
export function acceptEdit(original: string, edited: string, opts: { nikud: boolean; names: string[]; maxChars?: number }): boolean {
  const max = opts.maxChars ?? EDITOR_MAX_PAGE_CHARS;
  const a = stripNikud(original).trim();
  const b = stripNikud(edited).trim();
  if (!b) return false;
  if (b.length > Math.max(max, Math.ceil(a.length * 1.1))) return false;
  if (b.length < a.length * 0.7 || b.length > a.length * 1.35 + 12) return false;
  if (/\[\s*(?:עמוד|page)\s*\d+\s*\]/i.test(b)) return false;
  for (const name of opts.names) {
    const n = stripNikud(name).trim();
    if (n && a.includes(n) && !b.includes(n)) return false;
  }
  return true;
}

export async function editHebrewPages(input: {
  pages: EditorPage[];
  gender: "male" | "female" | string;
  heroName: string;
  otherNames?: string[];
  nikud: boolean;
  call: EditorCall;
  maxChars?: number;
}): Promise<{ pages: EditorPage[]; report: EditorReport }> {
  const { pages, nikud, call } = input;
  const report: EditorReport = { edited: [], rejected: [], nikud_retry: [], still_missing_nikud: [] };
  const result = pages.map((p) => ({ ...p }));
  const names = [input.heroName, ...(input.otherNames || [])].filter(Boolean);
  const genderHe = input.gender === "female" ? "נקבה (גיבורה)" : "זכר (גיבור)";
  const system = buildEditorSystemPrompt(nikud);
  const finish = (t: string) => (nikud ? t : stripNikud(t));

  const runOnce = async (subset: EditorPage[], label: string, extra = "") => {
    const userPrompt = `מגדר הדמות הראשית: ${genderHe}
שם הדמות הראשית: ${input.heroName}
${input.otherNames?.length ? `דמויות נוספות: ${input.otherNames.join(", ")}\n` : ""}ניקוד: ${nikud ? "כן — ניקוד מלא לכל מילה" : "לא — בלי ניקוד בכלל"}
${extra}
העמודים:
${JSON.stringify({ pages: subset.map((p) => ({ page_number: p.page_number, text: p.text })) })}`;
    return parsePages(await call({ systemPrompt: system, userPrompt, label }));
  };

  try {
    const edited = await runOnce(result, "hebrew-editor");
    if (!edited) {
      report.error = "editor returned no usable pages";
      return { pages: result, report };
    }
    for (const page of result) {
      const e = edited.find((x) => x.page_number === page.page_number);
      if (!e) continue;
      const text = finish(e.text);
      if (acceptEdit(page.text, text, { nikud, names, maxChars: input.maxChars })) {
        if (text !== page.text) report.edited.push(page.page_number);
        page.text = text;
      } else {
        report.rejected.push(page.page_number);
      }
    }

    if (nikud) {
      const missing = result.filter((p) => wordsMissingNikud(p.text).length > 0);
      if (missing.length) {
        report.nikud_retry = missing.map((p) => p.page_number);
        const words = [...new Set(missing.flatMap((p) => wordsMissingNikud(p.text)))].slice(0, 60);
        const retry = await runOnce(missing, "hebrew-editor-nikud",
          `תיקון חוזר: המילים הבאות נשארו בלי ניקוד וחייבות לקבל ניקוד מלא ונכון: ${words.join(", ")}. אל תשנה שום דבר אחר.`);
        for (const page of missing) {
          const e = retry?.find((x) => x.page_number === page.page_number);
          if (e && acceptEdit(page.text, e.text, { nikud, names, maxChars: input.maxChars })) page.text = e.text;
        }
        report.still_missing_nikud = result.filter((p) => wordsMissingNikud(p.text).length > 0).map((p) => p.page_number);
      }
    }
  } catch (err) {
    report.error = String(err).slice(0, 200);
  }
  return { pages: result, report };
}

const PAGES_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["pages"],
  properties: {
    pages: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["page_number", "text"],
        properties: { page_number: { type: "integer" }, text: { type: "string" } },
      },
    },
  },
};

/** One streamed Lovable AI call (Responses API, strict JSON). Returns null on any failure. */
export function gatewayEditorCall(apiKey: string, timeoutMs = 120_000): EditorCall {
  return async ({ systemPrompt, userPrompt, label }) => {
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Lovable-API-Key": apiKey,
          "X-Lovable-AIG-SDK": "fetch",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: HEBREW_EDITOR_MODEL,
          input: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: true,
          store: false,
          reasoning: { effort: "low" },
          text: { format: { type: "json_schema", name: "edited_pages", strict: true, schema: PAGES_SCHEMA } },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok || !res.body) {
        console.warn(`[${label}] editor call failed`, res.status, (await res.text()).slice(0, 200));
        return null;
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "", text = "", usage = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const ev = JSON.parse(payload);
            if (ev.type === "response.output_text.delta" && typeof ev.delta === "string") text += ev.delta;
            if (ev.type === "response.completed" && ev.response?.usage) usage = JSON.stringify(ev.response.usage);
            if (ev.type === "response.failed" || ev.type === "error") console.warn(`[${label}] editor stream error`, payload.slice(0, 200));
          } catch { /* partial line */ }
        }
      }
      console.log(`[${label}] editor usage ${usage}`);
      return text || null;
    } catch (err) {
      console.warn(`[${label}] editor call error`, err);
      return null;
    }
  };
}
