import { Accessibility, Mail, Phone } from "lucide-react";
import GlobalFooter from "@/components/shared/GlobalFooter";

// Accessibility statement (הצהרת נגישות) required for Israeli websites that
// serve the public. Keep the "last updated" date and the list of known
// limitations current whenever accessibility work is done.
const LAST_UPDATED = "22/10/2026";
const CONTACT_NAME = "כהן כרמית";
const CONTACT_PHONE = "050-2480020";
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
              <li>אפשר לנווט באמצעות המקלדת, עם מסגרת פוקוס ברורה סביב כל כפתור, קישור ושדה. לכל כפתור אייקון יש תיאור לקורא מסך.</li>
              <li>קישור להצהרת הנגישות מופיע בתחתית כל העמודים, כולל דף הבית, הספרייה ומסך הסיפור.</li>
              <li>לסרטון בדף הבית אין קול, יש לו כפתור עצירה, והוא נעצר אוטומטית כשמופעלת הגדרת "הפחתת תנועה".</li>
              <li>בטופס יצירת הסיפור לכל שדה ולכל קבוצת כפתורי בחירה יש תווית מקושרת, והודעת שגיאה על שדה חובה מקושרת לשדה ומוקראת.</li>
              <li>במסך הסיפור כל איור מתואר לפי טקסט העמוד, ותמונת הכריכה מתוארת לפי שם הסיפור.</li>
              <li>טקסטים קטנים שמצאנו במסכים הציבוריים הוגדלו ל-14 פיקסלים לפחות.</li>
              <li>האנימציות נעצרות כשמופעלת "הפחתת תנועה", בהגדרת המכשיר או בתפריט הנגישות. לסרטון בדף הסיפור לדוגמה יש כפתור עצירה והפעלה, והוא אינו מתנגן אוטומטית.</li>
              <li>טקסט לבן על גבי תמונות בדף הבית מוצג עם צל או רקע כהה לשיפור הניגודיות.</li>
              <li>הסיפורים כוללים אפשרות הקראה בקול ואפשרות לניקוד.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">חלקים שעדיין אינם נגישים במלואם</h2>
            <p className="text-muted-foreground mb-2">
              אנחנו נמצאים בתהליך תיקון נגישות מסודר. נכון להיום, אלה החלקים שעדיין אינם נגישים במלואם:
            </p>
            <ul className="list-disc pr-5 space-y-1 text-muted-foreground">
              <li>האיורים בסיפורים נוצרים אוטומטית בבינה מלאכותית, ולכן התיאור שלהם מבוסס על טקסט העמוד ולא על תיאור מדויק של התמונה.</li>
              <li>משחק הפאזל בזמן יצירת הסיפור מבוסס גרירה, ואינו נגיש במקלדת. הוא אינו חלק הכרחי מהשירות.</li>
              <li>הצביעה האונליין מבוססת ציור על המסך. דפי הצביעה זמינים גם להדפסה.</li>
              <li>קובץ הספר להדפסה (PDF) ודפי הצביעה הם תמונות, ואינם נגישים לקורא מסך.</li>
              <li>דפי צביעה של החבורה ודף הדיוקן של הילד הם תמונות להדפסה ולצביעה, ואינם נגישים לקורא מסך.</li>
              <li>ניגודיות של טקסט לבן על גבי תמונות נבדקה בדף הבית; במסכים אחרים עדיין בבדיקה.</li>
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
            <p className="text-foreground mt-3 font-semibold">רכזת הנגישות: {CONTACT_NAME}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("פנייה בנושא נגישות")}`}
              className="inline-flex items-center gap-2 mt-3 font-semibold text-primary underline underline-offset-4"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              <span dir="ltr">{CONTACT_EMAIL}</span>
            </a>
            <br />
            <a
              href={`tel:${CONTACT_PHONE.replace(/-/g, "")}`}
              className="inline-flex items-center gap-2 mt-2 font-semibold text-primary underline underline-offset-4"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              <span dir="ltr">{CONTACT_PHONE}</span>
            </a>
          </section>
        </article>
      </main>
      <GlobalFooter />
    </div>
  );
};

export default AccessibilityStatement;
