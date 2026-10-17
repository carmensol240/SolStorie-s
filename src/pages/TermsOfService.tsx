import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import GlobalFooter from "@/components/shared/GlobalFooter";

// Terms of use. Privacy is covered separately in PrivacyPolicy.tsx.
const LAST_UPDATED = "17/10/2026";
const CONTACT_EMAIL = "solstories.nlp@gmail.com";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="text-lg font-bold text-foreground mb-2">{title}</h2>
    <div className="text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </section>
);

const TermsOfService = () => {
  return (
    <div
      className="min-h-[100dvh] flex flex-col bg-background pb-8 overflow-y-auto"
      dir="rtl"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <main id="main-content" className="container max-w-4xl mx-auto px-4 py-8 flex-1">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <FileText className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            תנאי שימוש — <span dir="ltr" className="inline-block">SolStorie's™</span>
          </h1>
          <p className="text-sm text-muted-foreground">עודכן לאחרונה: {LAST_UPDATED}</p>
        </div>

        <article className="bg-card rounded-2xl border shadow-sm p-6 mb-6 space-y-6 text-right">
          <Section title="1. כללי">
            <p>
              <span dir="ltr" className="inline-block">SolStorie's™</span> הוא שירות ליצירת סיפורים
              מאוירים אישיים לילדים. השימוש בשירות מהווה הסכמה לתנאים האלה. השירות מיועד להורים,
              לבני משפחה ולאנשי חינוך מעל גיל 18.
            </p>
          </Section>

          <Section title="2. פרטיות">
            <p>
              איך אנחנו אוספים ומשתמשים במידע, כולל תמונות ילדים, מוסבר ב
              <Link to="/privacy" className="text-primary underline underline-offset-4">מדיניות הפרטיות</Link>.
            </p>
          </Section>

          <Section title="3. התמונות והפרטים שאתם מעלים">
            <p>
              אתם מאשרים שאתם ההורים או האפוטרופוסים של הילד, או שקיבלתם את הסכמתם, לפני שאתם מעלים
              תמונה או פרטים שלו. אין להעלות תמונות של ילדים אחרים בלי הסכמת הוריהם.
            </p>
          </Section>

          <Section title="4. תוכן שנוצר בבינה מלאכותית">
            <p>
              הסיפורים והאיורים נוצרים באופן אוטומטי בבינה מלאכותית, ולכן ייתכנו טעויות לשון, אי-דיוקים
              או איורים שלא תואמים לגמרי. נתקלתם בבעיה? כתבו לנו ונטפל בה. התוכן אינו תחליף לייעוץ
              מקצועי, חינוכי או רפואי.
            </p>
          </Section>

          <Section title="5. שימוש בסיפורים">
            <p>
              הסיפורים שיצרתם מיועדים לשימוש אישי ומשפחתי: קריאה, הדפסה בבית ושיתוף עם המשפחה והחברים.
              הדמויות, העיצוב והתכנים של האתר עצמו (כולל סול וחבריה) שייכים ל-
              <span dir="ltr" className="inline-block">SolStorie's™</span>. אין למכור את הסיפורים או
              להשתמש בהם מסחרית בלי אישור בכתב.
            </p>
          </Section>

          <Section title="6. מחירים ותשלום">
            <p>
              כל רכישה היא חד-פעמית. אין מנוי ואין חיוב חוזר. המחיר הסופי מוצג לפני התשלום. התשלום
              מתבצע דרך חברת Grow.
            </p>
          </Section>

          <Section title="7. ביטולים והחזרים">
            <p>
              הסיפורים נוצרים במיוחד עבורכם. אפשר לבטל רכישה תוך 14 יום, כל עוד לא השתמשתם בה ליצירת
              סיפור או לפתיחת תוכן. אחרי שנוצר סיפור לא יינתן החזר, אלא אם הייתה תקלה שמנעה מכם לקבל
              את מה שרכשתם. לבקשת ביטול כתבו לנו במייל.
            </p>
          </Section>

          <Section title="8. זמינות השירות">
            <p>
              אנחנו עושים מאמץ שהשירות יהיה זמין ותקין, אבל ייתכנו תקלות והשבתות. השירות מתעדכן מעת
              לעת, וייתכנו שינויים בעיצוב ובתכונות.
            </p>
          </Section>

          <Section title="9. אחריות">
            <p>
              השירות ניתן כפי שהוא. אחריותנו מוגבלת לסכום ששילמתם עבור הרכישה הרלוונטית, ככל שהחוק
              מאפשר.
            </p>
          </Section>

          <Section title="10. דין וסמכות שיפוט">
            <p>על התנאים חל הדין הישראלי. סמכות השיפוט נתונה לבתי המשפט המוסמכים במחוז תל אביב.</p>
          </Section>

          <Section title="11. יצירת קשר">
            <p>
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

export default TermsOfService;
