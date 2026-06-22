import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight, Mail } from "lucide-react";
import GlobalFooter from "@/components/shared/GlobalFooter";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-8 overflow-y-auto" dir="rtl" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="container max-w-4xl mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            תנאי שימוש ומדיניות פרטיות — <span dir="ltr" className="inline-block">SolStorie's™</span>
          </h1>
        </div>

        {/* Content */}
        <article className="bg-card rounded-2xl border shadow-sm p-6 mb-6">
          <div className="space-y-6 text-right leading-relaxed">

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">1. כללי</h2>
              <p className="text-muted-foreground leading-relaxed">
                <span dir="ltr" className="inline-block">SolStorie's™</span> היא אפליקציית סיפורים אישית לילדים. השימוש באפליקציה מהווה הסכמה לתנאים המפורטים להלן. האפליקציה מיועדת לשימוש הורים ומטפלים — כל משתמש נושא באחריות לשימוש תקין בהתאם לתנאים אלו.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">2. פרטיות והגנת מידע</h2>
              <p className="text-muted-foreground leading-relaxed">
                המידע האישי שלך נשמר בהצפנה ואינו משותף עם צדדים שלישיים. ניתן למחוק את כל הנתונים בכל עת על ידי פנייה אלינו. השירות פועל בהתאם לרגולציות COPPA ו-GDPR. בנוגע לתמונות ילדים: נשמרת תמונה אחת בלבד לכל ילד בשרת מאובטח. התמונה מוצגת להורה בלבד. העלאת תמונה חדשה מוחקת אוטומטית את הקודמת. מחיקת פרופיל הילד מוחקת את התמונה לצמיתות.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">3. תוכן שנוצר באמצעות בינה מלאכותית (AI)</h2>
              <p className="text-muted-foreground leading-relaxed">
                הסיפורים, האיורים והטקסטים נוצרים באמצעות AI. ייתכנו שגיאות לשוניות או אי-דיוקים. נתקלת בשגיאה? פנה אלינו בכתובת <a href="mailto:solstories.nlp@gmail.com" className="text-primary underline" dir="ltr">solstories.nlp@gmail.com</a> ונטפל בהקדם. <span dir="ltr" className="inline-block">SolStorie's™</span> אינה אחראית לנזק שנגרם משימוש בתוכן ה-AI.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">4. קניין רוחני</h2>
              <p className="text-muted-foreground leading-relaxed">
                כל התכנים, הדמויות (סול וחבריה), האיורים והטקסטים הם קניין רוחני של <span dir="ltr" className="inline-block">SolStorie's™</span>. אין לעשות שימוש מסחרי ללא אישור בכתב.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">5. הגבלת אחריות מקצועית</h2>
              <p className="text-muted-foreground leading-relaxed">
                השימוש באפליקציה הינו כלי טכנולוגי בלבד ואינו מהווה תחליף לייעוץ מקצועי, חינוכי או רפואי.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">6. תשלומים ורכישות</h2>
              <p className="text-muted-foreground leading-relaxed">
                רכישה חד-פעמית בלבד. אין מנויים, אין חיוב אוטומטי, אין תשלום נסתר.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">7. מדיניות ביטולים והחזרים</h2>
              <p className="text-muted-foreground leading-relaxed">
                ניתן לבטל תוך 14 יום בתנאי שלא נוצר סיפור. לאחר יצירת סיפור — לא ניתן לקבל החזר. החזר יינתן רק במקרה של תקלה טכנית מוכחת.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">8. זמינות השירות</h2>
              <p className="text-muted-foreground leading-relaxed">
                אין התחייבות לזמינות 100%. במקרה של השבתה מעל 72 שעות ניתן לפנות לפיצוי.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">9. עדכונים ושינויי עיצוב</h2>
              <p className="text-muted-foreground leading-relaxed">
                האפליקציה מתעדכנת באופן שוטף. שינויי עיצוב אינם מהווים עילה לתלונה.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">10. שיפוט וסמכות</h2>
              <p className="text-muted-foreground leading-relaxed">
                החוק הישראלי חל. כל מחלוקת תידון בבתי המשפט במחוז תל אביב בלבד.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">11. יצירת קשר</h2>
              <p className="text-muted-foreground leading-relaxed flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                <a href="mailto:solstories.nlp@gmail.com" className="text-primary underline" dir="ltr">
                  solstories.nlp@gmail.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">12. הגנה על פרטיות ילדים</h2>
              <p className="text-muted-foreground leading-relaxed">
                האפליקציה מיועדת לשימוש הורים בלבד. לא אוספים מידע מילדים. הורה רשאי לפנות למחיקת כל המידע.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">13. תמונות ילדים ואווטאר אישי</h2>
              <p className="text-muted-foreground leading-relaxed">
                תמונה אחת בלבד לכל ילד. לא משמשת לאימון AI. לא נמכרת ולא משותפת. ההורה רשאי להחליף, למחוק, או לבקש מחיקה ידנית בכתובת <a href="mailto:solstories.nlp@gmail.com" className="text-primary underline" dir="ltr">solstories.nlp@gmail.com</a>.
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

export default TermsOfService;
