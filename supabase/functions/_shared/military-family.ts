// Family member in the reserves / army (e.g. "dad-in-reserves"): fixed IDF uniform lock.
// Warm children's book: never weapons, helmets or combat gear.

export const IDF_UNIFORM =
  "wearing Israel Defense Forces olive-green uniform (olive drab shirt and trousers, brown military boots), green army duffel bag";

const plain = (t: string) => String(t || "").replace(/[\u0591-\u05C7]/g, "");

export type MilitaryRole = "father" | "mother" | "brother" | "sister" | "grandfather" | "uncle" | "aunt";

const TOPIC_ROLE: Record<string, MilitaryRole> = { "dad-in-reserves": "father" };
const ARMY_RE = /מילואים|במילואים|בצבא|צה"ל|צה״ל|חייל|חיילת|reserves|reservist|IDF|soldier|army/i;

const ROLE_PATTERNS: Array<[MilitaryRole, RegExp]> = [
  ["mother", /אמא|אימא|mother|mom\b|mommy/i],
  ["father", /אבא|father|dad\b|daddy/i],
  ["brother", /אח\s|אחי|אחיו|אחיה|brother/i],
  ["sister", /אחות|sister/i],
  ["grandfather", /סבא|grandpa|grandfather/i],
  ["uncle", /דוד\s|דוד$|uncle/i],
  ["aunt", /דודה|aunt/i],
];

const ROLE_EN: Record<MilitaryRole, string> = {
  father: "FATHER", mother: "MOTHER", brother: "OLDER BROTHER", sister: "OLDER SISTER",
  grandfather: "GRANDFATHER", uncle: "UNCLE", aunt: "AUNT",
};

/** Who is in the reserves/army for this story, or null. topic may be the id or the Hebrew title. */
export function militaryRoleForStory(topic: string | null | undefined, storyText = ""): MilitaryRole | null {
  const t = String(topic || "");
  if (TOPIC_ROLE[t]) return TOPIC_ROLE[t];
  if (/אבא במילואים/.test(t)) return "father";
  if (/אמא במילואים/.test(t)) return "mother";
  const source = plain(`${t}\n${storyText}`);
  if (!ARMY_RE.test(source)) return null;
  // The role named closest to an army word ("אבא במילואים", "אחי החייל").
  for (const [role, re] of ROLE_PATTERNS) {
    const near = new RegExp(`(${re.source})[^.\\n]{0,25}(${ARMY_RE.source})|(${ARMY_RE.source})[^.\\n]{0,25}(${re.source})`, "i");
    if (near.test(source)) return role;
  }
  return null;
}

// Leaving, coming back (door, first hug) or talking from far away → always in uniform.
const UNIFORM_SCENE_RE = /נפרד|נפרדת|פרידה|יוצא|יוצאת|נוסע|נוסעת|תיק|חוזר|חוזרת|חזר|חזרה|הדלת|בדלת|דלת|נכנס|מחבק|חיבוק|מתקשר|מתקשרת|שיחה|שיחת וידאו|וידאו|טלפון|מסך|goodbye|leav|depart|return|comes? home|door|hug|video call|phone|screen|calls?\b/i;
// Ordinary home life after the return (meal, play) → regular clothes allowed.
const HOME_SCENE_RE = /ארוחה|ארוחת|שולחן|אוכלים|מבשל|משחקים בבית|בסלון|פיג'מה|פיג׳מה|לילה טוב|meal|dinner|breakfast|lunch|table|living room|pajamas/i;

export function pageMentionsRole(role: MilitaryRole, text: string) {
  const re = ROLE_PATTERNS.find(([r]) => r === role)?.[1];
  return !!re && re.test(plain(text));
}

export function uniformRequiredForPage(text: string): boolean {
  const p = plain(text);
  if (UNIFORM_SCENE_RE.test(p)) return true;
  return !HOME_SCENE_RE.test(p);
}

/** Character lock block for the family member in the reserves, or "" when not on this page. */
export function buildMilitaryLock(role: MilitaryRole, pageText: string, prompt = ""): string {
  const both = `${pageText}\n${prompt}`;
  if (!pageMentionsRole(role, both)) return "";
  const who = ROLE_EN[role];
  const noGear = "ABSOLUTELY NO weapons, NO rifle or gun, NO helmet, NO vest, NO combat or tactical gear, NO beret. Not US or American military. Warm, calm, reassuring children's book scene.";
  if (uniformRequiredForPage(both)) {
    return `CHARACTER LOCK — ${who} (in the IDF reserves): the same face, hair and body on every page, ${IDF_UNIFORM}. This exact uniform on this page (departure, return at the door / first hug, or a call from far away). ${noGear}`;
  }
  return `CHARACTER LOCK — ${who} (in the IDF reserves): the same face, hair and body on every page. This is a home scene after the return, so regular home clothes are allowed; if the uniform is shown it is exactly: ${IDF_UNIFORM}. ${noGear}`;
}
