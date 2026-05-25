const BUCKET_BASE =
  "https://qvdwmkxviaqcgmjotsxe.supabase.co/storage/v1/object/public/topic-images";
const SOL_IMG = `${BUCKET_BASE}/sol-superhero-book-og.png`;
const GROUP_IMG = `${BUCKET_BASE}/cast-group-forest.png`;
const ILL_BASE =
  "https://qvdwmkxviaqcgmjotsxe.supabase.co/storage/v1/object/public/story-illustrations";
const ZOO_STORY_ID = "cc3a2452-25e1-4b2d-aa90-db6b9d7ebf11";

export interface DemoPage {
  pageNumber: number;
  text: string;
  illustrationUrl: string;
}

export const DEMO_STORY = {
  title: "מיה והרפתקת היער הקסום",
  pages: [
    {
      pageNumber: 1,
      text: "מיה יוצאת להרפתקה חדשה. השמש זורחת מעל היער, והעלים לוחשים בלחישה עדינה. מיה מחייכת ומרגישה שמשהו קסום עומד לקרות.",
      illustrationUrl: SOL_IMG,
    },
    {
      pageNumber: 2,
      text: "בקצה השביל פוגשת מיה את זואי, שיושבת בין הפרחים עם פרפרים סביבה. זואי מצביעה על שביל סודי שמוביל אל לב היער.",
      illustrationUrl: GROUP_IMG,
    },
    {
      pageNumber: 3,
      text: "ליאו מגיע עם מכחול וצבעים, ומצייר על סלע גדול מפה צבעונית של היער. המפה מראה לחברים בדיוק לאן ללכת.",
      illustrationUrl: SOL_IMG,
    },
    {
      pageNumber: 4,
      text: "זואי מגיעה בריצה עם כדור הרגל שלה. היא קופצת מעל גזעים ומובילה את החברים בשמחה אל הקליארה הסודית.",
      illustrationUrl: GROUP_IMG,
    },
    {
      pageNumber: 5,
      text: "בלב היער מגלים החברים אורות זוהרים ופרחים מנגנים. הם מבינים שהקסם האמיתי נמצא בחברות שביניהם.",
      illustrationUrl: GROUP_IMG,
    },
    {
      pageNumber: 6,
      text: "השמש שוקעת והחברים מנופפים לשלום ליער. מיה יודעת שמחר תחכה הרפתקה חדשה, ותמיד יהיה עם מי לחלוק אותה.",
      illustrationUrl: SOL_IMG,
    },
  ] as DemoPage[],
};

export const ZOO_DEMO_STORY = {
  title: "טיול בגן החיות - פוגשים חיות מדהימות",
  pages: [
    {
      pageNumber: 1,
      text: "זו סול. היא ילדה שאוהבת דברים חדשים. היא תמיד שמחה. היום היא הולכת לגן חיות. היא ממש מתרגשת.",
      illustrationUrl: `${ILL_BASE}/${ZOO_STORY_ID}/page-1.png`,
    },
    {
      pageNumber: 3,
      text: "פתאום היא רואה אריות. הם גדולים וחזקים. הם יושבים בשקט. יש להם שיער כמו שמש. סול מסתכלת עליהם בהתפעלות. היא יודעת שאריה הוא מלך.",
      illustrationUrl: `${ILL_BASE}/${ZOO_STORY_ID}/page-3.png`,
    },
    {
      pageNumber: 5,
      text: "לידן היא רואה קופים. הם קטנים ומצחיקים. הם מתנדנדים על חבלים. הם קופצים בין ענפים. סול מחייכת ונושמת את אוויר השמחה.",
      illustrationUrl: `${ILL_BASE}/${ZOO_STORY_ID}/page-5.png`,
    },
    {
      pageNumber: 7,
      text: "השמש יורדת לאט. השמיים בצבעים יפים. סול מבטיחה לחיות לחזור. היא נרדמת בחיבוק חם וחולמת על חיות.",
      illustrationUrl: `${ILL_BASE}/${ZOO_STORY_ID}/page-7.png`,
    },
  ] as DemoPage[],
};
