import solAdventure from "@/assets/cast-sol-adventure.jpg";
import miaNature from "@/assets/cast-mia-nature.jpg";
import leoScience from "@/assets/cast-leo-science.jpg";
import zoeSports from "@/assets/cast-zoe-sports.jpg";
import groupForest from "@/assets/cast-group-forest.png";
import farewell from "@/assets/cast-waving-farewell.png";

export interface DemoPage {
  pageNumber: number;
  text: string;
  illustrationUrl: string;
}

export const DEMO_STORY = {
  title: "סול והרפתקת היער הקסום",
  pages: [
    {
      pageNumber: 1,
      text: "סול יוצאת להרפתקה חדשה. השמש זורחת מעל היער, והעלים לוחשים בלחישה עדינה. סול מחייכת ומרגישה שמשהו קסום עומד לקרות.",
      illustrationUrl: solAdventure,
    },
    {
      pageNumber: 2,
      text: "בקצה השביל פוגשת סול את מיה, שיושבת בין הפרחים עם פרפרים סביבה. מיה מצביעה על שביל סודי שמוביל אל לב היער.",
      illustrationUrl: miaNature,
    },
    {
      pageNumber: 3,
      text: "ליאו מגיע עם מכחול וצבעים, ומצייר על סלע גדול מפה צבעונית של היער. המפה מראה לחברים בדיוק לאן ללכת.",
      illustrationUrl: leoScience,
    },
    {
      pageNumber: 4,
      text: "זואי מגיעה בריצה עם כדור הרגל שלה. היא קופצת מעל גזעים ומובילה את החברים בשמחה אל הקליארה הסודית.",
      illustrationUrl: zoeSports,
    },
    {
      pageNumber: 5,
      text: "בלב היער מגלים החברים אורות זוהרים ופרחים מנגנים. הם מבינים שהקסם האמיתי נמצא בחברות שביניהם.",
      illustrationUrl: groupForest,
    },
    {
      pageNumber: 6,
      text: "השמש שוקעת והחברים מנופפים לשלום ליער. סול יודעת שמחר תחכה הרפתקה חדשה, ותמיד יהיה עם מי לחלוק אותה.",
      illustrationUrl: farewell,
    },
  ] as DemoPage[],
};
