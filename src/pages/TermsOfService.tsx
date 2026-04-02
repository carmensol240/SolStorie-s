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
                <span dir="ltr" className="inline-block">SolStorie's™</span> היא אפליקציית סיפורים אישית לילדים. השימוש באפליקציה מהווה הסכמה לתנאים המפורטים להלן.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">2. פרטיות והגנת מידע</h2>
              <p className="text-muted-foreground leading-relaxed">
                המידע האישי שלך נשמר בהצפנה ואינו משותף עם צדדים שלישיים. ניתן למחוק את כל הנתונים בכל עת על ידי פנייה אלינו. השירות פועל בהתאם לעקרונות COPPA ו-GDPR כולל הזכות למחיקה, לעיון ולהגבלת עיבוד. המוסד החינוכי או איש המקצוע הטיפולי המשתמש בשירות אחראי לוודא שהשימוש עומד במדיניות הגנת הפרטיות שלו ובחוקים המקומיים.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">3. קניין רוחני</h2>
              <p className="text-muted-foreground leading-relaxed">
                כל התכנים, הדמויות (סול וחבריה), האיורים והטקסטים באפליקציה הם קניין רוחני מוגן ובלעדי של <span dir="ltr" className="inline-block">SolStorie's™</span>. אין לעשות שימוש מסחרי בנכסים אלו ללא אישור בכתב מראש.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">4. הגבלת אחריות מקצועית</h2>
              <p className="text-muted-foreground leading-relaxed">
                השימוש באפליקציה הינו כלי עזר טכנולוגי בלבד ואינו מהווה תחליף לייעוץ מקצועי, חינוכי או רפואי. התוכן שנוצר אינו מהווה המלצה טיפולית או חינוכית.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">5. מדיניות ביטולים והחזרים</h2>
              <p className="text-muted-foreground leading-relaxed">
                רכישת חבילת סיפורים היא עסקה סופית. בהתאם לחוק הגנת הצרכן הישראלי, ניתן לבטל עסקה תוך 14 יום ממועד הרכישה בתנאי שלא נוצר סיפור כלשהו מהחבילה. לאחר יצירת סיפור אחד או יותר לא ניתן לבטל את העסקה או לקבל החזר כספי מאחר והתוכן הדיגיטלי כבר נוצל. החזר כספי יינתן אך ורק במקרה של תקלה טכנית מוכחת שמנעה שימוש בשירות לחלוטין, לאחר בדיקה מצדנו.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">6. עדכונים ושינויי עיצוב</h2>
              <p className="text-muted-foreground leading-relaxed">
                האפליקציה מתעדכנת באופן שוטף ומוסיפה תכנים ופיצ'רים חדשים. כתוצאה מכך, ייתכן שסגנון העיצוב, הממשק והתצוגה ישתנו מעת לעת ולא יהיו זהים למה שהוצג בפרסומים, צילומי מסך או חומרי שיווק. שינויים אלו נועדו לשפר את חוויית המשתמש ואינם מהווים עילה לתלונה או דרישה כלשהי.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">7. יצירת קשר</h2>
              <p className="text-muted-foreground leading-relaxed flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                לכל שאלה, פנייה או בקשת החזר:{" "}
                <a href="mailto:souldesign06@gmail.com" className="text-primary underline" dir="ltr">
                  souldesign06@gmail.com
                </a>
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
