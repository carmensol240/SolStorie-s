// "Let's talk about the story" — 3-4 short parent-to-child questions saved on stories.talk_questions.
// Written in the same call as the Hebrew language editor; English stories and old stories
// use generateTalkQuestions (one small call) once, then the saved array is reused forever.
import { stripNikud, textHasNikud, type EditorCall } from "./hebrew-editor.ts";

export const TALK_MIN = 3;
export const TALK_MAX = 4;
export const TALK_MAX_CHARS = 110;

export function talkQuestionsInstruction(lang: "he" | "en", nikud: boolean) {
  if (lang === "en") {
    return `Also write "talk_questions": ${TALK_MIN}-${TALK_MAX} short questions a parent asks the child after reading, about THIS story's topic and plot.
- Simple everyday parent-to-child language, no therapy words, each under ${TALK_MAX_CHARS} characters, ending with "?".
- Mix: what the hero felt / did in the story (use the hero's name and correct pronouns), and one or two about the child's own life ("What helps you when you miss someone?").
- English only.`;
  }
  return `בנוסף, כתוב "talk_questions": ${TALK_MIN}–${TALK_MAX} שאלות קצרות שההורה שואל את הילד אחרי הקריאה, לפי הנושא והעלילה של הסיפור הזה בדיוק.
- שפה פשוטה של הורה לילד, בלי מונחים טיפוליים, כל שאלה עד ${TALK_MAX_CHARS} תווים ומסתיימת ב-"?".
- שילוב: מה הגיבור/ה הרגיש/ה או עשה/תה בסיפור (בשם הגיבור/ה ובמגדר הנכון), ושאלה או שתיים על החיים של הילד עצמו (פנייה לילד במגדר של הגיבור/ה, למשל "מה עוזר לך כשאתה מתגעגע?" לבן, "כשאת מתגעגעת" לבת).
- ${nikud ? "ניקוד מלא ונכון לכל מילה, כמו בסיפור." : "בלי ניקוד בכלל."}
- עברית בלבד.`;
}

/** Keeps 3-4 clean questions; anything else → [] so the caller can try again later. */
export function sanitizeTalkQuestions(list: unknown, nikud: boolean): string[] {
  if (!Array.isArray(list)) return [];
  const out = list
    .filter((q): q is string => typeof q === "string")
    .map((q) => (nikud ? q : stripNikud(q)).replace(/\s+/g, " ").trim())
    .filter((q) => q.length >= 6 && stripNikud(q).length <= TALK_MAX_CHARS + 20)
    .map((q) => (/[?？]$/.test(q) ? q : `${q.replace(/[.!]+$/, "")}?`))
    .slice(0, TALK_MAX);
  return out.length >= TALK_MIN ? out : [];
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["talk_questions"],
  properties: { talk_questions: { type: "array", items: { type: "string" } } },
};

export async function generateTalkQuestions(input: {
  call: EditorCall;
  language: string;
  heroName: string;
  gender: string;
  topic: string;
  pages: string[];
  nikud?: boolean;
}): Promise<string[]> {
  const lang = input.language === "en" ? "en" : "he";
  const nikud = lang === "he" && (input.nikud ?? textHasNikud(input.pages));
  const male = ["male", "boy", "זכר"].includes(input.gender);
  const system = lang === "en"
    ? `You write the "Let's talk about the story" page of a personalized children's book.\n${talkQuestionsInstruction("en", false)}\nReturn JSON only: {"talk_questions":["..."]}`
    : `אתה כותב את דף "בואו נדבר על הסיפור" בספר ילדים אישי.\n${talkQuestionsInstruction("he", nikud)}\nהחזר JSON בלבד: {"talk_questions":["..."]}`;
  const user = lang === "en"
    ? `Hero: ${input.heroName} (${male ? "boy" : "girl"})\nTopic: ${input.topic}\nStory:\n${input.pages.join("\n")}`
    : `הגיבור/ה: ${input.heroName} (${male ? "בן" : "בת"})\nנושא: ${input.topic}\nהסיפור:\n${input.pages.join("\n")}`;
  const raw = await input.call({ systemPrompt: system, userPrompt: user, label: "talk-questions", schema: SCHEMA });
  try {
    const c = (raw || "").trim();
    return sanitizeTalkQuestions(JSON.parse(c.slice(c.indexOf("{"), c.lastIndexOf("}") + 1)).talk_questions, nikud);
  } catch {
    return [];
  }
}
