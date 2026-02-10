import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";

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
          <div className="space-y-5 text-right leading-relaxed">
            <p className="text-muted-foreground leading-relaxed">
              הגנה על פרטיותכם ופרטיות ילדיכם היא בראש סדר העדיפויות שלנו.
            </p>

            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">המידע שאנו אוספים:</strong>{" "}
              אנו שומרים רק את שם הילד/ה וגילם לצורך התאמת הסיפור, ואת כתובת האימייל שלכם להתחברות.
            </p>

            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">אבטחה:</strong>{" "}
              המידע מאובטח בשרתים מוגנים ואינו מועבר לצד שלישי.
            </p>

            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">בינה מלאכותית:</strong>{" "}
              המידע מעובד רק לצורך יצירת הסיפור האישי שלכם.
            </p>

            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">זכות המחיקה:</strong>{" "}
              ניתן למחוק את החשבון והמידע בכל עת דרך מסך ההגדרות.
            </p>
          </div>
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
