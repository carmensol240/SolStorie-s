// NLP techniques: fixed list, topic types, per-type requirements, writing
// instructions and the post-generation check/fix step.

export const NLP_CHECK_VERSION = 1;

export type TechniqueCode =
  | "growth" | "emotion_naming" | "body_anchor" | "normalization" | "positive_phrasing"
  | "success_presupposition" | "reframing" | "concrete_metaphor" | "coping_strategy"
  | "positive_reinforcement" | "predictability" | "secure_ending" | "gang_modeling";

export interface Technique { code: TechniqueCode; num: number; he: string; example: string }

export const TECHNIQUES: Technique[] = [
  { code: "growth", num: 1, he: "שפת צמיחה", example: "נועה עוד לא יודעת לקשור שרוכים, אבל בכל ניסיון האצבעות שלה לומדות עוד קצת." },
  { code: "emotion_naming", num: 2, he: "שיום רגש", example: "דני מרגיש פחד. הלב שלו דופק מהר, כי הוא לא מכיר את המקום." },
  { code: "body_anchor", num: 3, he: "עוגן גופני", example: "מאיה שמה יד על הבטן ונושמת לאט. הבטן עולה ויורדת, והגוף נרגע." },
  { code: "normalization", num: 4, he: "נרמול", example: "גם ילדים גדולים מתגעגעים לפעמים. זה בסדר להרגיש ככה." },
  { code: "positive_phrasing", num: 5, he: "ניסוח חיובי", example: "יואב הולך לאט במסדרון. (במקום: לא רץ)" },
  { code: "success_presupposition", num: 6, he: "הנחת הצלחה", example: "כשתמר תגיע לגן מחר, היא כבר תדע איפה תולים את התיק." },
  { code: "reframing", num: 7, he: "מסגור מחדש", example: "הכוס נשפכה. עכשיו אורי יודע להחזיק אותה בשתי ידיים." },
  { code: "concrete_metaphor", num: 8, he: "מטאפורה מוחשית", example: "הכעס של עידו גדול כמו בלון. הוא נושף לאט, והבלון קטן." },
  { code: "coping_strategy", num: 9, he: "אסטרטגיית התמודדות", example: "ליה סופרת עד חמש ומחבקת את הדובי שלה." },
  { code: "positive_reinforcement", num: 10, he: "חיזוק חיובי", example: "אמא מחייכת: 'ראיתי כמה התאמצת לסדר את הצעצועים.'" },
  { code: "predictability", num: 11, he: "צפיות (מה יקרה, צעד אחר צעד)", example: "קודם נגיע לגן, אחר כך נתלה את התיק, ואז אבא ייתן נשיקה וילך." },
  { code: "secure_ending", num: 12, he: "סיום בטוח", example: "בלילה רון שוכב במיטה החמה, רגוע ושמח." },
  { code: "gang_modeling", num: 13, he: "מודלינג דרך החבורה", example: "זואי נושמת עמוק ואומרת: 'גם אני פחדתי בפעם הראשונה.' דני מסתכל עליה ונושם כמוה." },
];

export const techniqueByCode = (c: string) => TECHNIQUES.find((t) => t.code === c);

export type TopicType = "fears" | "transitions" | "habits" | "social" | "safety" | "growth" | "general";

export const TOPIC_TYPE_LABEL: Record<TopicType, string> = {
  fears: "פחדים ורגשות קשים", transitions: "מעברים", habits: "הרגלים", social: "חברות וחברתי",
  safety: "בטיחות והגנה", growth: "ביטחון וצמיחה", general: "כללי",
};

const TYPE_TOPICS: Record<Exclude<TopicType, "general">, string[]> = {
  fears: ["fear-of-dark", "mom-dont-go", "pocket-kiss", "dentist-visit", "barber-visit", "blood-test", "body-hero-nails", "lost-tooth", "safe-room-sirens", "dad-in-reserves", "sick-grandparent", "anger-cloud", "crying-is-ok", "emotion-regulation-edu"],
  transitions: ["first-day-kindergarten", "first-day-school", "new-house", "new-sibling", "divorce", "flying-vacation", "grandparents-night"],
  habits: ["body-hero-teeth", "body-hero-bath", "body-hero-hands", "potty-training", "pacifier-fairy", "brave-taster", "clean-room", "bedtime-story", "screen-time", "helping-home", "eating-with-cutlery-edu", "rainbow-power-edu", "waiting-in-line-edu", "patience-edu", "politeness-edu"],
  social: ["friendship-courage", "sharing", "apologize", "find-a-friend", "playing-together", "true-friendship", "accepting-differences", "we-are-special", "helping-others", "sibling-love", "play-rules-edu", "honesty-edu", "cooperation-edu", "respecting-elders-edu"],
  safety: ["body-safety", "stranger-danger", "road-safety", "seatbelt-safety"],
  growth: ["making-mistakes", "trying-again", "self-confidence-edu", "just-be-me", "superheroes", "my-special-family", "independence"],
};

export const SENSITIVE_TOPICS = ["sick-grandparent", "dad-in-reserves", "safe-room-sirens", "divorce"];
const BIBLE_TOPICS = ["moses-basket", "exodus", "noah-ark", "joseph-brothers", "david-goliath", "abraham-sarah", "jonah-fish", "samson-hero", "esther-queen", "hanukkah-miracle"];

export function getTopicType(topicId?: string | null): TopicType {
  if (!topicId) return "general";
  for (const [type, ids] of Object.entries(TYPE_TOPICS)) if (ids.includes(topicId)) return type as TopicType;
  return "general";
}
export const isSensitiveTopic = (id?: string | null) => !!id && SENSITIVE_TOPICS.includes(id);
export const isLearningTopic = (id?: string | null) => !!id && /^(letter|number|color|shape)-/.test(id);
export const isBibleTopic = (id?: string | null) => !!id && BIBLE_TOPICS.includes(id);

const REQUIRED: Record<TopicType, TechniqueCode[]> = {
  fears: ["emotion_naming", "normalization", "body_anchor", "coping_strategy", "secure_ending", "gang_modeling"],
  transitions: ["predictability", "normalization", "success_presupposition", "coping_strategy"],
  habits: ["growth", "positive_reinforcement", "positive_phrasing", "predictability", "gang_modeling"],
  social: ["emotion_naming", "reframing", "coping_strategy", "positive_reinforcement", "gang_modeling"],
  safety: ["positive_phrasing", "predictability", "coping_strategy", "normalization", "secure_ending"],
  growth: ["growth", "reframing", "positive_reinforcement", "success_presupposition", "gang_modeling"],
  general: ["growth", "success_presupposition", "secure_ending"],
};

export function requiredTechniques(type: TopicType, opts: { gangPresent: boolean; learning?: boolean }): TechniqueCode[] {
  if (type === "general" && opts.learning) return ["growth", "secure_ending"];
  return REQUIRED[type].filter((c) => c !== "gang_modeling" || opts.gangPresent);
}

const TYPE_NOTES: Partial<Record<TopicType, string>> = {
  transitions: "אסטרטגיית התמודדות כאן = חפץ עוגן (דובי, תמונה, נשיקה בכף היד).",
  habits: "צפיות כאן = צעדים קטנים וברורים, אחד אחרי השני.",
  social: "שיום רגש כאן = לזהות גם את הרגש של הילד/ה השני/ה. אסטרטגיה כאן = אסטרטגיה חברתית (לבקש, להציע תור, לומר סליחה).",
  safety: "צפיות = כללים ברורים. אסטרטגיה = \"להגיד לא, ולספר למבוגר שאוהב אותי\". נרמול = \"זה בסדר להגיד לא\". כלל חובה: בלי תיאורים מפחידים, בלי דמויות רעות מפורטות, ובלי להאשים את הילד/ה.",
};

const SENSITIVE_RULE_HE = "נושא רגיש: הנחת הצלחה רק על מה שהילד/ה עושה ומרגיש/ה (\"כשתתגעגע, תוכל לחבק את הדובי\"). אסור בהחלט להבטיח תוצאה במציאות (\"סבתא תבריא\", \"אבא יחזור בשלום\", \"לא יהיו יותר אזעקות\").";

const GANG_HE = ["סול", "זואי", "מיה", "ליאו", "בן"];
const GANG_EN = ["sol", "zoe", "mia", "leo", "ben"];

export function gangPresent(texts: string[], childName?: string): boolean {
  const child = (childName || "").replace(/[\u0591-\u05C7]/g, "").trim().toLowerCase();
  const joined = texts.join(" ").replace(/[\u0591-\u05C7]/g, "");
  const tokens = joined.split(/[^\p{L}]+/u).map((t) => t.toLowerCase()).filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i];
    if (t.length > 2 && /^[ולבכמשה]/.test(t) && GANG_HE.includes(t.slice(1)) && t.slice(1) !== "בן") t = t.slice(1);
    if (t === child) continue;
    if (t === "בן") {
      // "בן" is also "son"/"aged" — count it only when the next word isn't a number/age/family word
      const next = tokens[i + 1] || "";
      if (/^(שנה|שנים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|דוד|זוג|משפחה|אדם)/.test(next) || /\d/.test(next)) continue;
      return true;
    }
    if (GANG_HE.includes(t) || GANG_EN.includes(t)) return true;
  }
  return false;
}

export function buildNlpInstruction(topicId: string | null | undefined, language: string): string {
  const type = getTopicType(topicId);
  const learning = isLearningTopic(topicId);
  const req = requiredTechniques(type, { gangPresent: true, learning });
  const list = TECHNIQUES.map((t) => `${t.num}. ${t.he} — לדוגמה: "${t.example}"`).join("\n");
  const reqNames = req.map((c) => { const t = techniqueByCode(c)!; return t.code === "gang_modeling" ? `${t.he} (רק אם דמות מהחבורה — סול, זואי, מיה, ליאו או בן — מופיעה בסיפור: היא מדגימה ראשונה את ההתמודדות, והגיבור/ה לומד/ת ממנה)` : t.he; }).join("; ");
  const note = TYPE_NOTES[type] ? `\n${TYPE_NOTES[type]}` : "";
  const sens = isSensitiveTopic(topicId) ? `\n${SENSITIVE_RULE_HE}` : "";
  const bible = isBibleTopic(topicId) ? "\nבסיפורי תנ\"ך — הכללים המיוחדים לסיפור תנ\"כי גוברים." : "";
  const langNote = language === "en" ? "\n(Write the story itself in English only; the Hebrew here is guidance.)" : "";
  return `\n\n## 🧠 כלים מעולם ה-NLP — רשימה מוגדרת (חובה)\n${list}\n\n**סוג הנושא: ${TOPIC_TYPE_LABEL[type]}.** טכניקות חובה בסיפור הזה: ${reqNames}.${note}${sens}${bible}\nשלב/י את הטכניקות באופן טבעי בעלילה, בלי לקרוא להן בשם.${langNote}\n`;
}

// ---------- check / fix ----------

export type AiCall = (args: { systemPrompt: string; userPrompt: string; label: string; timeoutMs: number }) => Promise<string | null>;

export interface NlpTechniqueResult { code: TechniqueCode; name: string; present: boolean; page: number | null; quote: string | null }
export interface NlpIssue { kind: "outcome_promise" | "safety_violation"; page: number | null; quote: string; fixed: boolean }
export interface NlpReport {
  version: number; type: TopicType; type_label: string; sensitive: boolean; gang_present: boolean;
  techniques: NlpTechniqueResult[]; issues: NlpIssue[]; fixed: boolean; fixed_pages: number[];
  flagged: boolean; error?: string; checked_at: string;
}

interface Page { page_number: number; text: string }

function parseJson(text: string | null): any {
  if (!text) return null;
  const s = text.replace(/```json|```/g, "").trim();
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b < 0) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
}

export function parseCheck(raw: string | null, required: TechniqueCode[]): { techniques: NlpTechniqueResult[]; issues: NlpIssue[]; type?: TopicType } | null {
  const j = parseJson(raw);
  if (!j || !Array.isArray(j.techniques)) return null;
  const techniques = required.map((code) => {
    const r = j.techniques.find((x: any) => x?.code === code) || {};
    const quote = typeof r.quote === "string" && r.quote.trim() ? r.quote.trim().slice(0, 300) : null;
    return { code, name: techniqueByCode(code)!.he, present: !!r.present && !!quote, page: Number.isFinite(r.page) ? r.page : null, quote };
  });
  const issues: NlpIssue[] = (Array.isArray(j.issues) ? j.issues : [])
    .filter((x: any) => (x?.kind === "outcome_promise" || x?.kind === "safety_violation") && typeof x.quote === "string")
    .map((x: any) => ({ kind: x.kind, page: Number.isFinite(x.page) ? x.page : null, quote: x.quote.slice(0, 300), fixed: false }));
  const types = Object.keys(TOPIC_TYPE_LABEL);
  return { techniques, issues, type: types.includes(j.type) ? j.type : undefined };
}

const wc = (s: string) => s.split(/\s+/).filter(Boolean).length;

function checkPrompt(pages: Page[], required: TechniqueCode[], type: TopicType, sensitive: boolean, classify: boolean) {
  const reqList = required.map((c) => { const t = techniqueByCode(c)!; return `- ${c}: ${t.he} (דוגמה: "${t.example}")`; }).join("\n");
  const extra = [
    sensitive ? '- issue kind "outcome_promise": any sentence promising a real-life outcome (e.g. "סבתא תבריא", "אבא יחזור בשלום", "לא יהיו יותר אזעקות"). Promises about what the child can do or feel are fine.' : "",
    type === "safety" ? '- issue kind "safety_violation": frightening descriptions, a detailed bad character, or blaming the child.' : "",
  ].filter(Boolean).join("\n");
  const story = pages.map((p) => `[עמוד ${p.page_number}]\n${p.text}`).join("\n\n");
  return {
    systemPrompt: "You audit children's stories for specific NLP techniques. Be strict: a technique counts only if a concrete sentence clearly performs it. Quote the sentence exactly as written. Reply with JSON only.",
    userPrompt: `Required techniques:\n${reqList}\n${extra ? `\nAlso report problems:\n${extra}\n` : ""}${classify ? `\nAlso classify the story into one type: ${Object.keys(TOPIC_TYPE_LABEL).join(", ")}.\n` : ""}\nReturn JSON: {${classify ? '"type":"...",' : ""}"techniques":[{"code":"...","present":true,"page":1,"quote":"exact sentence"}],"issues":[{"kind":"...","page":1,"quote":"exact sentence"}]}\n\nStory:\n${story}`,
  };
}

function fixPrompt(pages: Page[], missing: TechniqueCode[], issues: NlpIssue[], language: string) {
  const story = pages.map((p) => `[עמוד ${p.page_number}] (${wc(p.text)} words)\n${p.text}`).join("\n\n");
  const miss = missing.map((c) => { const t = techniqueByCode(c)!; return `- ${t.he}: "${t.example}"${c === "gang_modeling" ? " (use a gang character already in the story)" : ""}`; }).join("\n");
  const iss = issues.map((i) => `- page ${i.page ?? "?"}: "${i.quote}" → ${i.kind === "outcome_promise" ? "rewrite so it promises only what the child does/feels, never a real-life outcome" : "remove the frightening/villain/blaming content gently"}`).join("\n");
  return {
    systemPrompt: `You minimally edit a children's story. Keep the plot, names, tense, gender and tone. Keep each changed page within ±10% of its word count. ${language === "en" ? "English only." : "Hebrew only, no nikud."} Change as few pages as possible. Reply with JSON only.`,
    userPrompt: `${miss ? `Add these missing techniques naturally:\n${miss}\n` : ""}${iss ? `Fix these sentences:\n${iss}\n` : ""}\nReturn JSON: {"pages":[{"page_number":N,"text":"full new page text"}]} with ONLY the changed pages.\n\nStory:\n${story}`,
  };
}

export async function runNlpCheck(opts: {
  pages: Page[]; topicId?: string | null; isCustom?: boolean; language: string; childName?: string; call: AiCall;
}): Promise<{ pages: Page[]; report: NlpReport }> {
  const { topicId, language, call } = opts;
  let pages = opts.pages.map((p) => ({ ...p }));
  let type = getTopicType(topicId);
  const sensitive = isSensitiveTopic(topicId);
  const gang = gangPresent(pages.map((p) => p.text), opts.childName);
  const base = { version: NLP_CHECK_VERSION, sensitive, gang_present: gang, checked_at: new Date().toISOString() };
  const fail = (error: string): { pages: Page[]; report: NlpReport } => ({
    pages: opts.pages,
    report: { ...base, type, type_label: TOPIC_TYPE_LABEL[type], techniques: [], issues: [], fixed: false, fixed_pages: [], flagged: true, error },
  });
  try {
    const classify = !!opts.isCustom || !topicId;
    let required = requiredTechniques(type, { gangPresent: gang, learning: isLearningTopic(topicId) });
    const p1 = checkPrompt(pages, classify ? Array.from(new Set([...required, ...TECHNIQUES.map((t) => t.code)])) : required, type, sensitive, classify);
    let check = parseCheck(await call({ ...p1, label: "nlp-check", timeoutMs: 15_000 }), classify ? TECHNIQUES.map((t) => t.code) : required);
    if (!check) return fail("check_failed");
    if (classify && check.type) {
      type = check.type;
      required = requiredTechniques(type, { gangPresent: gang });
      check = { ...check, techniques: check.techniques.filter((t) => required.includes(t.code)) };
    }
    const missing = check.techniques.filter((t) => !t.present).map((t) => t.code);
    let issues = check.issues;
    const fixedPages: number[] = [];
    if (missing.length || issues.length) {
      const fp = fixPrompt(pages, missing, issues, language);
      const fj = parseJson(await call({ ...fp, label: "nlp-fix", timeoutMs: 20_000 }));
      for (const np of (Array.isArray(fj?.pages) ? fj.pages : [])) {
        const target = pages.find((p) => p.page_number === np?.page_number);
        if (!target || typeof np.text !== "string" || !np.text.trim()) continue;
        const clean = np.text.replace(/[\u0591-\u05C7]/g, "").trim();
        const before = wc(target.text), after = wc(clean);
        if (before > 0 && Math.abs(after - before) / before > 0.25) continue;
        target.text = clean;
        fixedPages.push(target.page_number);
      }
      if (fixedPages.length) {
        const p2 = checkPrompt(pages, required, type, sensitive, false);
        const re = parseCheck(await call({ ...p2, label: "nlp-recheck", timeoutMs: 12_000 }), required);
        if (re) {
          const stillIssues = new Set(re.issues.map((i) => i.quote));
          issues = [...issues.map((i) => ({ ...i, fixed: !stillIssues.has(i.quote) })), ...re.issues.filter((i) => !issues.some((o) => o.quote === i.quote))];
          check = { ...re, issues };
        }
      }
    }
    const flagged = check.techniques.some((t) => !t.present) || issues.some((i) => !i.fixed);
    return {
      pages,
      report: { ...base, type, type_label: TOPIC_TYPE_LABEL[type], techniques: check.techniques, issues, fixed: fixedPages.length > 0, fixed_pages: fixedPages, flagged },
    };
  } catch (e) {
    return fail(`exception: ${String((e as Error)?.message || e).slice(0, 120)}`);
  }
}
