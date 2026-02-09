import { useNavigate, Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";

const POLICY_VERSION = "1.0";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-background pb-8 overflow-y-auto" dir="rtl" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="container max-w-4xl mx-auto px-4 py-8">
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
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6 text-right leading-relaxed">
              {/* Section 1 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">1. כללי</h2>
                <p className="text-muted-foreground leading-relaxed">
                  מדיניות פרטיות זו מתארת כיצד אנו אוספים, משתמשים, מאחסנים ומגנים על המידע שלכם בעת השימוש 
                  באפליקציית סיפורי ילדים ("האפליקציה"). אנו מחויבים להגנה על פרטיותכם ופרטיות ילדיכם, 
                  ופועלים בהתאם לחוקי הגנת הפרטיות הרלוונטיים.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  השימוש באפליקציה מהווה הסכמה למדיניות פרטיות זו. אם אינכם מסכימים למדיניות, אנא הימנעו משימוש באפליקציה.
                </p>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">2. מידע שאנו אוספים</h2>
                
                <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">2.1 מידע שנמסר ישירות</h3>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li><strong>פרטי הורה:</strong> כתובת אימייל לצורך הרשמה והתחברות.</li>
                  <li><strong>שם הילד/ה:</strong> לצורך התאמה אישית של הסיפורים (הילד/ה מופיע/ה כגיבור/ה).</li>
                  <li><strong>גיל הילד/ה:</strong> לצורך התאמת רמת השפה והתוכן לגיל.</li>
                  <li><strong>מין הילד/ה (אופציונלי):</strong> להתאמת הדמות בסיפור.</li>
                  <li><strong>נושאים ותחומי עניין:</strong> לבחירת נושא הסיפור.</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">2.2 מידע שנאסף אוטומטית</h3>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li><strong>מזהה מכשיר אנונימי (Device ID):</strong> מזהה טכני שאינו מכיל מידע אישי מזהה.</li>
                  <li><strong>נתוני שימוש:</strong> זמן צפייה בעמודים, סיפורים שנקראו, והעדפות שימוש.</li>
                  <li><strong>נתונים טכניים:</strong> סוג דפדפן, מערכת הפעלה (ללא מידע מזהה אישי).</li>
                </ul>

                <div className="bg-primary/5 rounded-lg p-4 mt-4">
                  <p className="text-foreground font-medium">
                    🔒 חשוב: אנו <strong>לא</strong> אוספים מידע אישי מזהה (PII) מילדים. כל איסוף המידע נעשה באמצעות הורים.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">3. כיצד אנו משתמשים במידע</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  המידע שנאסף משמש אותנו למטרות הבאות:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li><strong>יצירת סיפורים מותאמים:</strong> התאמת הסיפורים לשם, גיל ותחומי העניין של הילד/ה.</li>
                  <li><strong>שיפור השירות:</strong> ניתוח סטטיסטי אנונימי לשיפור חוויית המשתמש.</li>
                  <li><strong>תמיכה טכנית:</strong> פתרון בעיות ומתן מענה לפניות.</li>
                  <li><strong>אבטחת מידע:</strong> הגנה על החשבון והמידע שלכם.</li>
                  <li><strong>עמידה בדרישות חוקיות:</strong> ציות לחובות חוקיות ורגולטוריות.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  אנו <strong>לא</strong> משתמשים במידע למטרות פרסום או שיווק לצדדים שלישיים.
                </p>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">4. שמירת מידע ואבטחה</h2>
                
                <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">4.1 משך שמירת המידע</h3>
                <p className="text-muted-foreground leading-relaxed">
                  המידע נשמר כל עוד החשבון פעיל. במידה ותבקשו למחוק את החשבון, כל המידע הקשור אליו יימחק 
                  תוך 30 יום, למעט מידע שאנו נדרשים לשמור על פי חוק.
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">4.2 אמצעי אבטחה</h3>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li>הצפנת נתונים בהעברה ובאחסון (SSL/TLS).</li>
                  <li>אימות דו-שלבי זמין למשתמשים.</li>
                  <li>גישה מוגבלת למידע (עיקרון הצורך לדעת).</li>
                  <li>ניטור ובקרת גישה שוטפים.</li>
                  <li>גיבויים מאובטחים ותוכניות התאוששות.</li>
                </ul>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">5. שיתוף מידע עם צדדים שלישיים</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  אנו עשויים לשתף מידע עם צדדים שלישיים במקרים הבאים בלבד:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li><strong>ספקי שירותי ענן:</strong> לאחסון ועיבוד נתונים מאובטח.</li>
                  <li><strong>ספקי בינה מלאכותית:</strong> ליצירת תוכן הסיפורים (ללא העברת מידע מזהה אישי).</li>
                  <li><strong>דרישות חוקיות:</strong> בכפוף לצו בית משפט או דרישה חוקית תקפה.</li>
                </ul>

                <div className="bg-destructive/5 rounded-lg p-4 mt-4">
                  <p className="text-foreground font-medium">
                    ⚠️ אנו <strong>לא מוכרים</strong> מידע אישי לצדדים שלישיים ולעולם לא נעשה זאת.
                  </p>
                </div>
              </section>

              {/* Section 6 - COPPA */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">6. הגנה על פרטיות ילדים (COPPA)</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  אנו מחויבים לעמידה בתקנות להגנה על פרטיות ילדים באינטרנט (COPPA) ותקנות דומות. כחלק מהתחייבות זו:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li>אנו <strong>לא אוספים מידע אישי מזהה ישירות מילדים</strong> מתחת לגיל 13.</li>
                  <li>כל איסוף מידע על ילדים נעשה <strong>באמצעות ההורה</strong> ובהסכמתו.</li>
                  <li>להורים יש <strong>זכות מלאה לעיין, לתקן ולמחוק</strong> מידע על ילדיהם.</li>
                  <li>האפליקציה <strong>אינה מכילה פרסומות</strong> או קישורים חיצוניים באזורי הילדים.</li>
                  <li>אנו <strong>לא משתפים מידע על ילדים</strong> עם צדדים שלישיים למטרות שיווקיות.</li>
                </ul>

                <div className="bg-primary/5 rounded-lg p-4 mt-4">
                  <p className="text-foreground font-medium">
                    👨‍👩‍👧 הורים יכולים בכל עת לבקש צפייה, עדכון או מחיקה של כל המידע הנוגע לילדיהם על ידי פנייה אלינו.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">7. זכויותיכם בנוגע למידע</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  בהתאם לחוקי הגנת הפרטיות, עומדות לכם הזכויות הבאות:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li><strong>זכות לעיון:</strong> לקבל עותק של המידע שאנו מחזיקים עליכם.</li>
                  <li><strong>זכות לתיקון:</strong> לבקש תיקון של מידע שגוי או לא מדויק.</li>
                  <li><strong>זכות למחיקה:</strong> לבקש מחיקת המידע שלכם (בכפוף לחובות חוקיות).</li>
                  <li><strong>זכות להתנגד:</strong> להתנגד לעיבוד מסוים של המידע.</li>
                  <li><strong>זכות להגבלה:</strong> לבקש הגבלת עיבוד המידע.</li>
                  <li><strong>זכות לניידות:</strong> לקבל את המידע בפורמט נפוץ להעברה לשירות אחר.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  לממש זכויות אלו, פנו אלינו בפרטים המופיעים בסוף מסמך זה.
                </p>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">8. קבצי Cookies וטכנולוגיות מעקב</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  האפליקציה משתמשת בקבצי Cookies טכניים הכרחיים בלבד:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li><strong>קוקיז הכרחיים:</strong> לניהול התחברות ושמירת הגדרות.</li>
                  <li><strong>קוקיז פונקציונליים:</strong> לשמירת העדפות שימוש.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  אנו <strong>לא משתמשים</strong> בקוקיז פרסומיים או קוקיז מעקב של צדדים שלישיים. 
                  אין באפליקציה שום מעקב פרסומי או איסוף נתונים לצורכי פרסום ממוקד.
                </p>
              </section>

              {/* Section 9 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">9. שינויים במדיניות הפרטיות</h2>
                <p className="text-muted-foreground leading-relaxed">
                  אנו עשויים לעדכן מדיניות פרטיות זו מעת לעת. במקרה של שינויים מהותיים, נודיע לכם באמצעות 
                  הודעה באפליקציה או בדוא"ל. המשך השימוש באפליקציה לאחר עדכון המדיניות מהווה הסכמה למדיניות המעודכנת.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  אנו ממליצים לעיין במדיניות זו באופן תקופתי.
                </p>
              </section>

              {/* Section 10 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">10. יצירת קשר</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  לכל שאלה, בקשה או פנייה בנוגע לשירות או למדיניות הפרטיות, ניתן ליצור עמנו קשר באחד מהערוצים הבאים:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2">
                  <li>📧 <strong>דואר אלקטרוני:</strong> souldesign06@gmail.com</li>
                  <li>
                    🌐 <strong>פנייה דרך האתר:</strong>{" "}
                    <Link to="/contact" className="text-primary hover:underline">
                      טופס צור קשר
                    </Link>
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  <strong>זמני מענה:</strong> אנו מתחייבים להשיב לפניות בתוך 30 יום, אך משתדלים לענות בהקדם האפשרי לכל פנייה.
                </p>
              </section>

              {/* Link to Terms */}
              <section className="pt-4 border-t">
                <p className="text-muted-foreground leading-relaxed">
                  מדיניות פרטיות זו משלימה את{" "}
                  <Link to="/terms" className="text-primary hover:underline font-medium">
                    תנאי השימוש
                  </Link>{" "}
                  של האפליקציה. אנא קראו גם אותם להבנה מלאה של ההסכם ביננו.
                </p>
              </section>

              {/* AI Disclaimer */}
              <section>
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                  <p className="text-foreground font-medium text-sm leading-relaxed">
                    ⚠️ האפליקציה עושה שימוש בבינה מלאכותית. ייתכנו טעויות בשפה או בתוכן. 
                    האחריות על בדיקת התוכן והתאמתו לילד חלה על ההורה בלבד. ט.ל.ח.
                  </p>
                </div>
              </section>

              {/* Last Updated */}
              <section className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>גרסה:</strong> {POLICY_VERSION}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>עדכון אחרון:</strong> ינואר 2026
                </p>
              </section>
            </div>
          </ScrollArea>
        </article>

        {/* Back Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2 min-h-[44px]"
            aria-label="חזרה לעמוד הקודם"
          >
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
            חזרה
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
