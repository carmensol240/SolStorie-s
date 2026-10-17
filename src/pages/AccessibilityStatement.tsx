import { Accessibility, Mail } from "lucide-react";
import GlobalFooter from "@/components/shared/GlobalFooter";

// Accessibility statement (הצהרת נגישות) required for Israeli websites that
// serve the public. Keep the "last updated" date and the list of known
// limitations current whenever accessibility work is done.
const LAST_UPDATED = "17/10/2026";
const CONTACT_EMAIL = "solstories.nlp@gmail.com";

const AccessibilityStatement = () => {
  return (
    <div
      className="min-h-[100dvh] flex flex-col bg-background pb-8 overflow-y-auto"
      dir="rtl"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <main id="main-content" className="container max-w-4xl mx-auto px-4 py-8 flex-1">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Accessibility className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">הצהרת נגישות</h1>
          <p className="text-sm text-muted-foreground">עודכן לאחרונה: {LAST_UPDATED}</p>
        </div>

        <article className="bg-card rounded-2xl border shadow-sm p-6 mb-6 space-y-6 text-right leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">המחויבות שלנו</h2>
            <p className="text-muted-foreground">
              אנחנו ב-<span dir="ltr" className="inline-block">SolStorie's™</span> רוצים שכל הורה וכל ילד
              יוכלו ליהנות מהסיפורים, כולל אנשים עם מוגבלות. האתר נבנה ומתוחזק במטרה לעמוד
              בתקן הישראלי ת"י 5568, המבוסס על הנחיות הנגישות הבינלאומיות WCAG 2.0 ברמה AA.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">מה עשינו כדי להנגיש את האתר</h2>
            <ul className="list-disc pr-5 space-y-1 text-muted-foreground">
              <li>תפריט נגישות בכל עמוד: הגדלת טקסט, ניגודיות גבוהה, הדגשת קישורים, סמן מוגדל, הקראה קולית ועצירת אנימציות.</li>
              <li>האתר בנוי בעברית ובכיוון מימין לשמאל, ואפשר להגדיל את התצוגה בטלפון.</li>
              <li>אפשר לנווט באמצעות המקלדת, וכפתורים ושדות בטפסים מתויגים לקוראי מסך.</li>
              <li>הסיפורים כוללים אפשרות הקראה בקול ואפשרות לניקוד.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">חלקים שעדיין אינם נגישים במלואם</h2>
            <ul className="list-disc pr-5 space-y-1 text-muted-foreground">
              <li>האיורים בסיפורים נוצרים אוטומטית, וייתכן שחלקם חסרים תיאור טקסטואלי מלא.</li>
              <li>משחק הפאזל בזמן יצירת הסיפור מבוסס גרירה, ואינו נגיש במקלדת. הוא אינו חלק הכרחי מהשירות.</li>
              <li>הצביעה האונליין מבוססת ציור על המסך. דפי הצביעה זמינים גם להדפסה.</li>
              <li>דף התשלום מופעל על ידי חברת Grow, והנגישות שלו באחריותה.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              אנחנו ממשיכים לשפר את הנגישות. אם נתקלתם בבעיה, נשמח לשמוע ולתקן.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">פנייה בנושא נגישות</h2>
            <p className="text-muted-foreground">
              נתקלתם בקושי? כתבו לנו ונחזור אליכם בהקדם. כדאי לציין את העמוד שבו הייתה הבעיה ומה
              ניסיתם לעשות.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("פנייה בנושא נגישות")}`}
              className="inline-flex items-center gap-2 mt-3 font-semibold text-primary underline underline-offset-4"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              <span dir="ltr">{CONTACT_EMAIL}</span>
            </a>
          </section>
        </article>
      </main>
      <GlobalFooter />
    </div>
  );
};

export default AccessibilityStatement;
