const BUCKET_BASE =
  "https://qvdwmkxviaqcgmjotsxe.supabase.co/storage/v1/object/public/topic-images";
const SOL_IMG = `${BUCKET_BASE}/sol-superhero-book-og.png`;
const GROUP_IMG = `${BUCKET_BASE}/cast-group-forest.png`;

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
