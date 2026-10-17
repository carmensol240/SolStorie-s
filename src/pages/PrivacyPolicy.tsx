import { Shield } from "lucide-react";
import GlobalFooter from "@/components/shared/GlobalFooter";

// Privacy policy. Must stay accurate: every service provider that receives
// personal data is listed in PROVIDERS. Update it (and LAST_UPDATED) whenever
// a provider is added or removed.
const LAST_UPDATED = "17/10/2026";
const CONTACT_EMAIL = "solstories.nlp@gmail.com";

const PROVIDERS: { name: string; purpose: string }[] = [
  { name: "Supabase", purpose: "אחסון החשבון, פרטי הילדים, התמונות והסיפורים" },
  { name: "Lovable AI", purpose: "כתיבת הסיפורים ויצירת האיורים, באמצעות מודלים של ספקי בינה מלאכותית" },
  { name: "fal.ai", purpose: "גיבוי ליצירת איורים" },
  { name: "ElevenLabs ו-Microsoft Azure", purpose: "הקראת הסיפור בקול" },
  { name: "Grow", purpose: "סליקת התשלום. פרטי כרטיס האשראי נמסרים ישירות ל-Grow ואינם נשמרים אצלנו" },
  { name: "Resend", purpose: "שליחת מיילים (אישורי רכישה, איפוס סיסמה)" },
  { name: "Netlify", purpose: "אחסון האתר" },
  { name: "Meta (Facebook)", purpose: "מדידת פרסום ושיווק באמצעות Meta Pixel" },
];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="text-lg font-bold text-foreground mb-2">{title}</h2>
    <div className="text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </section>
);

const PrivacyPolicy = () => {
  return (
    <div
      className="min-h-[100dvh] flex flex-col bg-background pb-8 overflow-y-auto"
      dir="rtl"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <main id="main-content" className="container max-w-4xl mx-auto px-4 py-8 flex-1">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            מדיניות פרטיות — <span dir="ltr" className="inline-block">SolStorie's™</span>
          </h1>
          <p className="text-sm text-muted-foreground">עודכן לאחרונה: {LAST_UPDATED}</p>
        </div>

        <article className="bg-card rounded-2xl border shadow-sm p-6 mb-6 space-y-6 text-right">
          <Section title="1. על מה המדיניות הזו">
            <p>
              המדיניות מסבירה איזה מידע אנחנו אוספים כשאתם משתמשים ב-
              <span dir="ltr" className="inline-block">SolStorie's™</span>, למה, עם מי הוא משותף, ומה
              הזכויות שלכם. השירות מיועד להורים ולאנשי חינוך. ילדים אינם נרשמים לשירות בעצמם.
            </p>
          </Section>

          <Section title="2. איזה מידע אנחנו אוספים">
            <ul className="list-disc pr-5 space-y-1">
              <li><strong>פרטי החשבון:</strong> כתובת אימייל, סיסמה (נשמרת מוצפנת), שם תצוגה, והאם אתם הורה או איש/ת חינוך.</li>
              <li><strong>פרטי הילד שאתם מזינים:</strong> שם, גיל, מגדר, בחירות מראה (שיער, לבוש), שם הגן או הכיתה, ופרטים נוספים שבחרתם לכתוב.</li>
              <li><strong>תמונת הילד:</strong> כדי שהדמות בסיפור תהיה דומה לו.</li>
              <li><strong>הסיפורים והאיורים</strong> שנוצרו עבורכם.</li>
              <li><strong>רכישות:</strong> איזו חבילה נקנתה, הסכום והתאריך. את פרטי כרטיס האשראי אנחנו לא רואים ולא שומרים.</li>
              <li><strong>נתוני שימוש:</strong> פעולות באתר (למשל התחלת יצירת סיפור), כדי לשפר את השירות, ונתוני מדידה של Meta Pixel.</li>
            </ul>
            <p>
              הקלטות הקול שלכם (הקראת הסיפור בקולכם) נשמרות רק בדפדפן במכשיר שלכם, ואינן נשלחות אלינו.
            </p>
          </Section>

          <Section title="3. למה אנחנו משתמשים במידע">
            <ul className="list-disc pr-5 space-y-1">
              <li>כדי לכתוב את הסיפור ולאייר אותו עם הילד כגיבור.</li>
              <li>כדי לנהל את החשבון, הרכישות והגישה לסיפורים.</li>
              <li>כדי לענות לפניות ולטפל בתקלות.</li>
              <li>כדי לשפר את השירות ולמדוד את הפרסום שלנו.</li>
              <li>כדי לשלוח עדכונים ומבצעים, רק אם הסכמתם לכך בהרשמה. אפשר להסיר את ההסכמה בכל עת.</li>
            </ul>
          </Section>

          <Section title="4. עם מי המידע משותף">
            <p>
              אנחנו לא מוכרים מידע. כדי להפעיל את השירות, המידע מועבר לספקי השירות הבאים, רק במידה
              הנדרשת לתפקידם. חלקם מעבדים ושומרים מידע מחוץ לישראל.
            </p>
            <ul className="list-disc pr-5 space-y-1">
              {PROVIDERS.map((p) => (
                <li key={p.name}>
                  <strong dir="ltr" className="inline-block">{p.name}</strong>: {p.purpose}
                </li>
              ))}
            </ul>
            <p>נמסור מידע לרשויות רק אם נחויב לכך על פי דין.</p>
          </Section>

          <Section title="5. תמונות ילדים">
            <ul className="list-disc pr-5 space-y-1">
              <li>התמונות נשמרות בשרת מאובטח ומוצגות רק לכם.</li>
              <li>התמונה נשלחת לשירות יצירת האיורים רק כדי ליצור את הדמות בסיפורים שלכם.</li>
              <li>אנחנו לא משתמשים בתמונות לאימון בינה מלאכותית, לא מוכרים אותן ולא מפרסמים אותן.</li>
              <li>מחיקת פרופיל הילד מוחקת גם את התמונות שלו.</li>
            </ul>
          </Section>

          <Section title="6. כמה זמן המידע נשמר ואיך מוחקים">
            <p>
              המידע נשמר כל עוד החשבון פעיל. אפשר לבקש מחיקה של החשבון וכל המידע (כולל תמונות וסיפורים)
              דרך ההגדרות באתר, או במייל. נמחק את המידע תוך 14 יום ונשלח אישור. מידע על רכישות עשוי
              להישמר זמן נוסף, ככל שהחוק מחייב לשמור רשומות חשבונאיות.
            </p>
          </Section>

          <Section title="7. הזכויות שלכם">
            <p>
              לפי חוק הגנת הפרטיות, אתם רשאים לעיין במידע שנשמר עליכם, לבקש לתקן אותו או למחוק אותו.
              כתבו לנו ונטפל בבקשה.
            </p>
          </Section>

          <Section title="8. אבטחת מידע">
            <p>
              המידע נשמר אצל ספקי ענן מאובטחים, הגישה אליו מוגבלת, והתמונות נגישות רק דרך קישורים
              זמניים. אין אבטחה מושלמת, ואם יתגלה אירוע אבטחה נפעל כפי שהחוק מחייב.
            </p>
          </Section>

          <Section title="9. שינויים במדיניות">
            <p>אם נשנה את המדיניות, נעדכן את התאריך בראש העמוד. בשינוי מהותי נודיע במייל.</p>
          </Section>

          <Section title="10. יצירת קשר">
            <p>
              שאלות או בקשות בנושא פרטיות:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-4" dir="ltr">
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>
        </article>
      </main>
      <GlobalFooter />
    </div>
  );
};

export default PrivacyPolicy;
