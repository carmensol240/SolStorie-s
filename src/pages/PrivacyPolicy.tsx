import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";
import GlobalFooter from "@/components/shared/GlobalFooter";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-8 overflow-y-auto" dir="rtl" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="container max-w-4xl mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">מדיניות פרטיות</h1>
          <p className="text-muted-foreground">
            הגנה על פרטיותכם ופרטיות ילדיכם היא בראש סדר העדיפויות שלנו
          </p>
        </div>

        {/* Privacy Content */}
        <article className="bg-card rounded-2xl border shadow-sm p-6 mb-6">
          <div className="space-y-6 text-right leading-relaxed">
            <p className="text-muted-foreground leading-relaxed">
              ברוכים הבאים למדיניות הפרטיות של <span dir="ltr" className="inline-block">SolStorie's™</span>. אנו מחויבים להגנה על פרטיות המשתמשים שלנו, ובפרט על פרטיותם של קטינים המשתמשים בשירות.
            </p>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">איסוף מידע ושימוש בו</h2>
              <p className="text-muted-foreground leading-relaxed">
                לצורך אספקת השירות, אנו אוספים מידע מינימלי הכולל את שם הילד/ה, העדפת קבוצת גיל (0-2, 3-6, 7-8) ותיאורי דמויות. <strong>שם הילד/ה נאסף לצורך התאמה אישית של הסיפורים בלבד</strong> — הוא מוטמע בטקסט הסיפור כדי שהילד/ה יהיו הגיבור/ה של ההרפתקה, ואינו משמש לזיהוי, שיווק או כל מטרה אחרת. מידע זה משמש אך ורק את מנוע הבינה המלאכותית ליצירת סיפורים מותאמים אישית. איננו אוספים מידע אישי מזהה מעבר לנדרש לתפעול השירות.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">הגנה על מידע ילדים (גילאי 0-8)</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <span dir="ltr" className="inline-block">SolStorie's™</span> מיועדת ליצירת תוכן עבור ילדים בגילאי 0-8, ולכן אנו מקפידים על הגנה מיוחדת על המידע שלהם:
              </p>
              <ul className="list-disc list-inside text-muted-foreground leading-relaxed space-y-2 mr-2">
                <li><strong>מינימום מידע:</strong> אנו אוספים רק את שם הילד/ה, טווח הגיל ותיאור הדמות — המינימום הנדרש ליצירת סיפור מותאם.</li>
                <li><strong>ללא שיווק:</strong> מידע הילדים אינו משמש לפרסום, שיווק או יצירת פרופילים מסחריים בשום צורה.</li>
                <li><strong>ללא שיתוף:</strong> מידע הילדים אינו מועבר, נמכר או משותף עם צדדים שלישיים.</li>
                <li><strong>מחיקה:</strong> ניתן למחוק את כל מידע הילדים בכל עת דרך הגדרות החשבון.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">אבטחת מידע</h2>
              <p className="text-muted-foreground leading-relaxed">
                אנו נוקטים באמצעי אבטחה מתקדמים להגנה על המידע השמור במערכותינו. המידע אינו מועבר, נמכר או משותף עם צדדים שלישיים לצרכים מסחריים או שיווקיים.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">אחסון ועיבוד מידע</h2>
              <ul className="list-disc list-inside text-muted-foreground leading-relaxed space-y-2 mr-2">
                <li><strong>אחסון תמונות ואיורים:</strong> האפליקציה משתמשת בשירותי אחסון ענן מאובטחים לצורך שמירה והצגה של כריכות הסיפורים והאיורים המופקים. המשתמש מאשר כי תמונות אלו נשמרות בשרתי צד ג׳ לצורך תפעול שוטף של הספרייה האישית.</li>
                <li><strong>פרטיות ומידע רגיש:</strong> האפליקציה אינה אוספת מידע רגיש ללא צורך תפעולי מובהק. כל המידע המועלה לאפליקציה נשמר תחת סטנדרטים מקובלים של אבטחת מידע, תוך הקפדה על הפרטיות הנדרשת בתקנות הרלוונטיות לאפליקציות המיועדות לילדים.</li>
                <li><strong>הגבלת אחריות:</strong> האיורים נוצרים באמצעות טכנולוגיית בינה מלאכותית. האפליקציה דואגת כי התכנים יהיו מותאמי גיל, אך האחריות על השימוש בסיפורים ובאיורים היא על ההורה/המשתמש בלבד.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">עיבוד נתונים באמצעות AI</h2>
              <p className="text-muted-foreground leading-relaxed">
                המשתמש מאשר כי התוכן המוזן על ידו מעובד באמצעות טכנולוגיית צד שלישי (AI) לצורך הפקת הסיפור. אנו מוודאים כי ספקי הטכנולוגיה עומדים בתקני אבטחה מחמירים.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">תשלומים ופרטיות פיננסית</h2>
              <p className="text-muted-foreground leading-relaxed">
                תשלומי כרטיס אשראי מעובדים באופן מאובטח באמצעות שירות התשלומים של PayPal. ניתן לשלם בכרטיס אשראי גם ללא חשבון PayPal. פרטי כרטיס האשראי אינם נשמרים במערכות <span dir="ltr" className="inline-block">SolStorie's™</span> ומעובדים ישירות על ידי ספק התשלומים המאובטח.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">זכויות המשתמש</h2>
              <p className="text-muted-foreground leading-relaxed">
                למשתמש זכות מלאה לעיין במידע, לעדכנו או לבקש את מחיקתו לצמיתות בכל עת דרך הגדרות החשבון.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">שימוש על ידי אנשי חינוך וטיפול</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                אנו מכירים בכך שהשירות עשוי לשמש מחנכים, גננות, מטפלים, קלינאים ואנשי מקצוע טיפוליים. בהתאם, אנו מחויבים לעקרונות הבאים:
              </p>
              <ul className="list-disc list-inside text-muted-foreground leading-relaxed space-y-2 mr-2">
                <li><strong>הסכמת הורים:</strong> שימוש בשירות במסגרת חינוכית או טיפולית מחייב הסכמה מוקדמת של הורי הילדים. המוסד או המטפל אחראי לקבל הסכמה זו.</li>
                <li><strong>נתוני ילדים:</strong> שמות הילדים וגילאיהם הם המידע המינימלי הנדרש ליצירת סיפורים. אנו לא אוספים מזהים נוספים כגון מספרי תעודת זהות, כתובות או מידע רפואי.</li>
                <li><strong>שמירת מידע:</strong> נתוני הילדים נשמרים בהצפנה ואינם משותפים עם צדדים שלישיים. ניתן למחוק את כל הנתונים בכל עת.</li>
                <li><strong>עמידה בתקנות:</strong> השירות פועל בהתאם לעקרונות COPPA (Children's Online Privacy Protection Act) ו-GDPR לעניין נתוני קטינים, כולל הזכות למחיקה, הזכות לעיון והזכות להגבלת עיבוד.</li>
                <li><strong>אחריות המוסד או המטפל:</strong> המוסד החינוכי או איש המקצוע הטיפולי המשתמש בשירות אחראי לוודא שהשימוש עומד במדיניות הגנת הפרטיות שלו ובחוקים המקומיים.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">קניין רוחני</h2>
              <p className="text-muted-foreground leading-relaxed">
                כל התכנים, הדמויות (סול וחבריה), האיורים והטקסטים באפליקציה הם קניין רוחני מוגן ובלעדי של <span dir="ltr" className="inline-block">SolStorie's™</span>. אין לעשות שימוש מסחרי בנכסים ללא אישור בכתב.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">הגבלת אחריות מקצועית</h2>
              <p className="text-muted-foreground leading-relaxed">
                השימוש באפליקציה הינו כלי עזר טכנולוגי בלבד ואינו מהווה תחליף לייעוץ מקצועי, חינוכי או רפואי. התוכן שנוצר באמצעות המערכת אינו מהווה המלצה טיפולית או חינוכית.
              </p>
            </section>
          </div>
        </article>

        {/* Back Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/settings");
              }
            }}
            className="gap-2 min-h-[44px]"
            aria-label="חזרה לעמוד הקודם"
          >
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
            חזרה
          </Button>
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
};

export default PrivacyPolicy;
