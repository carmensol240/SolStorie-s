import { useNavigate, Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight } from "lucide-react";

const TERMS_VERSION = "1.0";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-background pb-8 overflow-y-auto" dir="rtl" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">תנאי שימוש</h1>
          <p className="text-muted-foreground">
            אנא קראו בעיון את תנאי השימוש לפני השימוש באפליקציה
          </p>
        </div>

        {/* Terms Content */}
        <article className="bg-card rounded-2xl border shadow-sm p-6 mb-6">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6 text-right leading-relaxed">
              {/* Section 1 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">1. כללי</h2>
                <p className="text-muted-foreground leading-relaxed">
                  ברוכים הבאים לאפליקציית סיפורי ילדים ("האפליקציה"). האפליקציה מופעלת ומנוהלת על ידי החברה ("אנחנו", "שלנו"). 
                  תנאי שימוש אלו ("התנאים") מהווים הסכם משפטי מחייב בינך לבין החברה בנוגע לשימושך באפליקציה.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  השימוש באפליקציה מותנה בהסכמתך לתנאים אלו. אם אינך מסכים/ה לתנאים, אנא הימנע/י משימוש באפליקציה.
                </p>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">2. הגדרות</h2>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li><strong>"משתמש"</strong> - כל אדם המשתמש באפליקציה, לרבות הורה, אפוטרופוס או ילד.</li>
                  <li><strong>"ילד"</strong> - כל אדם מתחת לגיל 18.</li>
                  <li><strong>"הורה"</strong> - הורה או אפוטרופוס חוקי של ילד.</li>
                  <li><strong>"תוכן"</strong> - סיפורים, איורים, טקסטים וכל חומר אחר המוצג או נוצר באפליקציה.</li>
                  <li><strong>"שירותים"</strong> - כל השירותים המוצעים באמצעות האפליקציה.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">3. תנאי שימוש באפליקציה</h2>
                <p className="text-muted-foreground leading-relaxed">
                  האפליקציה מיועדת ליצירת סיפורים מותאמים אישית לילדים. השימוש באפליקציה מותר אך ורק למטרות חוקיות 
                  ובהתאם לתנאים אלו.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  אתה מתחייב/ת:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-1 list-disc list-inside mt-2">
                  <li>לספק מידע מדויק ונכון בעת ההרשמה.</li>
                  <li>לשמור על סודיות פרטי הכניסה שלך.</li>
                  <li>לא להשתמש באפליקציה בצורה שעלולה לפגוע באחרים.</li>
                  <li>לפקח על השימוש של ילדיך באפליקציה.</li>
                </ul>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">4. הגנה על פרטיות ילדים</h2>
                <p className="text-muted-foreground leading-relaxed">
                  אנו מחויבים להגנה על פרטיותם של ילדים ופועלים בהתאם לחוק הגנת הפרטיות ולתקנות הגנה על פרטיות ילדים 
                  באינטרנט (COPPA ותקנות דומות).
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  אנו לא אוספים ביודעין מידע אישי מילדים מתחת לגיל 13 ללא הסכמת הורה. אם נודע לנו שאספנו מידע 
                  כזה ללא הסכמה, נמחק אותו לאלתר. לפרטים נוספים, עיינו ב
                  <Link to="/privacy" className="text-primary hover:underline mx-1">
                    מדיניות הפרטיות
                  </Link>
                  שלנו.
                </p>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">5. הסכמת הורים</h2>
                <p className="text-muted-foreground leading-relaxed">
                  השימוש באפליקציה על ידי ילדים מחייב הסכמה ופיקוח של הורה או אפוטרופוס חוקי. 
                  בעצם השימוש באפליקציה, אתה מאשר/ת כי:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-1 list-disc list-inside mt-2">
                  <li>אתה הורה או אפוטרופוס חוקי של הילד/ה המשתמש/ת בשירות.</li>
                  <li>אתה מסכים/ה לשימוש הילד/ה באפליקציה.</li>
                  <li>אתה מסכים/ה לאיסוף ועיבוד מידע בהתאם למדיניות הפרטיות.</li>
                  <li>אתה אחראי/ת לפיקוח על השימוש של הילד/ה באפליקציה.</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">6. תוכן שנוצר באפליקציה</h2>
                <p className="text-muted-foreground leading-relaxed">
                  הסיפורים והאיורים הנוצרים באמצעות האפליקציה נוצרים בעזרת טכנולוגיית בינה מלאכותית. 
                  אתה מבין/ה ומסכים/ה כי:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-1 list-disc list-inside mt-2">
                  <li>התוכן נוצר אוטומטית ועשוי להשתנות בין שימושים שונים.</li>
                  <li>אנו שומרים את הזכות להשתמש בתוכן לשיפור השירות.</li>
                  <li>הסיפורים שנוצרו מותרים לשימוש אישי ומשפחתי בלבד.</li>
                  <li>אין להפיץ או למכור את התוכן ללא אישור מפורש בכתב.</li>
                </ul>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">7. קניין רוחני</h2>
                <p className="text-muted-foreground leading-relaxed">
                  כל זכויות הקניין הרוחני באפליקציה, לרבות עיצוב, קוד, לוגו וסימנים מסחריים, שייכות לחברה. 
                  אין להעתיק, לשנות או להפיץ כל חלק מהאפליקציה ללא אישור מפורש בכתב.
                </p>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">8. הגבלת אחריות</h2>
                <p className="text-muted-foreground leading-relaxed">
                  האפליקציה מסופקת "כמות שהיא" (AS IS) ללא כל אחריות מכל סוג. אנו לא נישא באחריות לכל נזק 
                  ישיר, עקיף, מקרי או תוצאתי הנובע משימוש או חוסר יכולת שימוש באפליקציה.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  אנו לא אחראים לתוכן שנוצר על ידי הבינה המלאכותית וממליצים על פיקוח הורים בעת השימוש.
                </p>
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-foreground font-medium text-sm leading-relaxed">
                    ⚠️ האפליקציה עושה שימוש בבינה מלאכותית. ייתכנו טעויות בשפה או בתוכן. 
                    האחריות על בדיקת התוכן והתאמתו לילד חלה על ההורה בלבד. ט.ל.ח.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">9. שינויים בתנאים</h2>
                <p className="text-muted-foreground leading-relaxed">
                  אנו שומרים את הזכות לעדכן תנאים אלו בכל עת. שינויים מהותיים יפורסמו באפליקציה ו/או יישלחו 
                  בהודעה למשתמשים הרשומים. המשך השימוש באפליקציה לאחר עדכון התנאים מהווה הסכמה לתנאים המעודכנים.
                </p>
              </section>

              {/* Section 10 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">10. מדיניות קרדיטים ועריכה</h2>
                <p className="text-muted-foreground leading-relaxed">
                  מפעילת האתר מודעת לכך שתוצרי בינה מלאכותית עלולים לכלול אי-דיוקים. 
                  על כן, המערכת מאפשרת סבב עריכה אחד ללא עלות לכל סיפור חדש שנוצר. 
                  כל סבב עריכה נוסף לאותו סיפור יחויב בקרדיט אחד מיתרת המשתמש.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  קרדיטים שנרכשו אינם ניתנים להחזר או להמרה לכסף.
                </p>
              </section>

              {/* Section 11 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">11. מדיניות החזרים</h2>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>לא יינתנו החזרים כספיים</strong> על רכישת חבילות סיפורים. 
                  מרגע ביצוע הרכישה, הקרדיטים מועברים לחשבונך באופן מיידי ואינם ניתנים להחזר או לביטול.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  אנו ממליצים לנסות את הסיפור החינמי הראשון לפני ביצוע רכישה כדי לוודא שהשירות מתאים לצרכיכם.
                </p>
              </section>

              {/* Section 12 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">12. סיום שימוש</h2>
                <p className="text-muted-foreground leading-relaxed">
                  אנו רשאים להפסיק או להשעות את גישתך לאפליקציה בכל עת, ללא הודעה מוקדמת, במקרה של הפרת תנאים אלו 
                  או מכל סיבה אחרת לפי שיקול דעתנו הבלעדי.
                </p>
              </section>

              {/* Section 13 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">13. דין חל וסמכות שיפוט</h2>
                <p className="text-muted-foreground leading-relaxed">
                  תנאים אלו כפופים לדיני מדינת ישראל. כל סכסוך הנובע מתנאים אלו או מהשימוש באפליקציה יידון 
                  בבתי המשפט המוסמכים בישראל.
                </p>
              </section>

              {/* Section 14 */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">14. יצירת קשר</h2>
                <p className="text-muted-foreground leading-relaxed">
                  לכל שאלה או בירור בנוגע לתנאי שימוש אלו, ניתן לפנות אלינו באמצעות עמוד יצירת הקשר באפליקציה 
                  או בדוא&quot;ל.
                </p>
              </section>

              {/* Last Updated */}
              <section className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>גרסה:</strong> {TERMS_VERSION}
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
            onClick={() => {
              // If there's history, go back; otherwise go to settings or home
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
    </div>
  );
};

export default TermsOfService;
