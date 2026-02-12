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
              ברוכים הבאים למדיניות הפרטיות של <span dir="ltr" className="inline-block">SolStories</span>. אנו מחויבים להגנה על פרטיות המשתמשים שלנו, ובפרט על פרטיותם של קטינים המשתמשים בשירות.
            </p>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">איסוף מידע ושימוש בו</h2>
              <p className="text-muted-foreground leading-relaxed">
                לצורך אספקת השירות, אנו אוספים מידע מינימלי הכולל את שם הילד/ה וגילם. מידע זה משמש אך ורק את מנוע הבינה המלאכותית ליצירת תוכן מותאם גיל. איננו אוספים מידע אישי מזהה מעבר לנדרש לתפעול השירות.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">אבטחת מידע</h2>
              <p className="text-muted-foreground leading-relaxed">
                אנו נוקטים באמצעי אבטחה מתקדמים להגנה על המידע השמור במערכותינו. המידע אינו מועבר, נמכר או משותף עם צדדים שלישיים לצרכים מסחריים או שיווקיים.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">עיבוד נתונים באמצעות AI</h2>
              <p className="text-muted-foreground leading-relaxed">
                המשתמש מאשר כי התוכן המוזן על ידו מעובד באמצעות טכנולוגיית צד שלישי (AI) לצורך הפקת הסיפור. אנו מוודאים כי ספקי הטכנולוגיה עומדים בתקני אבטחה מחמירים.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">זכויות המשתמש</h2>
              <p className="text-muted-foreground leading-relaxed">
                למשתמש זכות מלאה לעיין במידע, לעדכנו או לבקש את מחיקתו לצמיתות בכל עת דרך הגדרות החשבון.
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
