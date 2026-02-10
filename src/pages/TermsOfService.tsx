import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight } from "lucide-react";

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
          <div className="space-y-5 text-right leading-relaxed">
            <p className="text-muted-foreground leading-relaxed">
              השימוש ב-StoryTime מהווה הסכמה לתנאים הבאים:
            </p>

            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">אחריות:</strong>{" "}
              התוכן נוצר על ידי AI. באחריות ההורה לוודא את התאמתו לילד לפני ההקראה.
            </p>

            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">קרדיטים:</strong>{" "}
              יצירת סיפור מנכה קרדיט. קרדיטים אינם ניתנים להחזרה.
            </p>

            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">תשלום:</strong>{" "}
              ניתן לשלם בכרטיס אשראי גם ללא חשבון פייפאל.
            </p>

            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">שימוש הוגן:</strong>{" "}
              אין להפיק תוכן פוגעני או לא ראוי.
            </p>
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
    </div>
  );
};

export default TermsOfService;
