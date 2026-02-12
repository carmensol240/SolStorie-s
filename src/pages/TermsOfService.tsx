import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight } from "lucide-react";
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
          <h1 className="text-3xl font-bold text-foreground mb-2">תנאי שימוש</h1>
          <p className="text-muted-foreground">
            אנא קראו בעיון את תנאי השימוש לפני השימוש באפליקציה
          </p>
        </div>

        {/* Terms Content */}
        <article className="bg-card rounded-2xl border shadow-sm p-6 mb-6">
          <div className="space-y-6 text-right leading-relaxed">
            <p className="text-muted-foreground leading-relaxed">
              תקנון שימוש זה מהווה הסכם משפטי מחייב בין המשתמש לבין הנהלת האפליקציה.
            </p>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">מהות השירות</h2>
              <p className="text-muted-foreground leading-relaxed">
                <span dir="ltr" className="inline-block">SolStorie's</span> מספקת פלטפורמה ליצירת תוכן ספרותי מותאם אישית לילדים בגילאי 0-8.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">אחריות המשתמש והורה</h2>
              <p className="text-muted-foreground leading-relaxed">
                השימוש באפליקציה מיועד להורים או לאפוטרופוסים חוקיים. באחריות המבוגר האחראי לבחון את התוכן שנוצר על ידי הבינה המלאכותית ולוודא את התאמתו לילד בטרם הקראתו. הנהלת האפליקציה אינה נושאת באחריות לתוכן אוטונומי שנוצר על ידי המערכת.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">מערכת קרדיטים ורכישות</h2>
              <p className="text-muted-foreground leading-relaxed">
                השימוש בשירות מותנה ביתרת קרדיטים. ניתן לבצע רכישות באמצעות כרטיס אשראי (גם ללא חשבון פייפאל). קרדיטים שנוצלו אינם ניתנים להחזר.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">קניין רוחני</h2>
              <p className="text-muted-foreground leading-relaxed">
                העיצוב, הקוד, הדמויות (סול וחבריה), האיורים והטכנולוגיה הם קניינה הבלעדי של <span dir="ltr" className="inline-block">SolStorie's</span>. כל הסיפורים, עיצובי הדמויות והנכסים הויזואליים מוגנים בזכויות יוצרים ואין לעשות בהם שימוש מסחרי ללא אישור בכתב. הסיפורים הנוצרים מיועדים לשימוש אישי ופרטי בלבד.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">סיום התקשרות</h2>
              <p className="text-muted-foreground leading-relaxed">
                הנהלת האפליקציה שומרת לעצמה את הזכות להפסיק שירות למשתמש שיעשה שימוש לרעה במערכת או יזין תכנים פוגעניים.
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
