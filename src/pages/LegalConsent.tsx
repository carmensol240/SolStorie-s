import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Shield, 
  CheckCircle2, 
  Sparkles,
  Heart,
  Lock,
  Users,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const TERMS_VERSION = "1.0";

const LegalConsent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [isParentConsent, setIsParentConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = hasReadTerms && isParentConsent;
  
  // Get return URL from params or localStorage
  const getReturnTo = () => {
    return searchParams.get('returnTo') || localStorage.getItem('returnTo') || '/library';
  };

  // Redirect if not logged in
  if (!loading && !user) {
    navigate("/auth");
    return null;
  }

  const handleAcceptTerms = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          terms_accepted_at: new Date().toISOString(),
          terms_version: TERMS_VERSION,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "ברוכים הבאים! 🎉",
        description: "תודה על אישור התנאים. אפשר להתחיל ליצור סיפורים!",
      });
      
      // Clear returnTo from localStorage and navigate to the saved destination
      const returnTo = getReturnTo();
      localStorage.removeItem('returnTo');
      navigate(returnTo);
    } catch (error) {
      console.error("Error accepting terms:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת שמירת ההסכמה. נסו שוב.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-primary/5 via-background to-background overflow-y-auto pb-24" dir="rtl">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/auth")}
          className="mb-4 flex items-center gap-1 min-h-[44px]"
          aria-label="חזרה להתחברות"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה
        </Button>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 animate-bounce-slow">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            לפני שמתחילים... 📋
          </h1>
          <p className="text-muted-foreground text-lg">
            אנא קראו ואשרו את התנאים שלנו כדי להתחיל ליצור סיפורים קסומים
          </p>
        </div>

        {/* Quick Summary */}
        <div className="bg-card rounded-2xl border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            בקצרה - מה חשוב לדעת:
          </h2>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">שימוש משפחתי</p>
                <p className="text-sm text-muted-foreground">הסיפורים מיועדים לשימוש אישי ומשפחתי בלבד</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">הגנה על פרטיות</p>
                <p className="text-sm text-muted-foreground">אנו לא מוכרים מידע לצדדים שלישיים - לעולם לא</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">בטיחות ילדים (COPPA)</p>
                <p className="text-sm text-muted-foreground">שומרים על פרטיות הילדים בהתאם לתקנות הבינלאומיות</p>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Privacy Tabs */}
        <div className="bg-card rounded-2xl border shadow-sm mb-6 overflow-hidden">
          <Tabs defaultValue="terms" className="w-full">
            <TabsList className="w-full grid grid-cols-2 rounded-none h-14 bg-muted/50">
              <TabsTrigger 
                value="terms" 
                className="gap-2 data-[state=active]:bg-background rounded-none h-full text-base"
              >
                <FileText className="w-4 h-4" />
                תנאי שימוש
              </TabsTrigger>
              <TabsTrigger 
                value="privacy" 
                className="gap-2 data-[state=active]:bg-background rounded-none h-full text-base"
              >
                <Shield className="w-4 h-4" />
                מדיניות פרטיות
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="terms" className="p-6 mt-0">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4 text-right leading-relaxed">
                  <section>
                    <h3 className="font-bold text-foreground mb-2">1. כללי</h3>
                    <p className="text-muted-foreground text-sm">
                      ברוכים הבאים לאפליקציית סיפורי ילדים. תנאי שימוש אלו מהווים הסכם משפטי מחייב בינך לבין החברה.
                    </p>
                  </section>
                  <section>
                    <h3 className="font-bold text-foreground mb-2">2. תנאי שימוש</h3>
                    <p className="text-muted-foreground text-sm">
                      האפליקציה מיועדת ליצירת סיפורים מותאמים אישית לילדים. השימוש מותר למטרות חוקיות בלבד.
                    </p>
                  </section>
                  <section>
                    <h3 className="font-bold text-foreground mb-2">3. הגנה על פרטיות ילדים</h3>
                    <p className="text-muted-foreground text-sm">
                      אנו מחויבים להגנה על פרטיותם של ילדים ופועלים בהתאם לחוק הגנת הפרטיות ולתקנות COPPA.
                    </p>
                  </section>
                  <section>
                    <h3 className="font-bold text-foreground mb-2">4. הסכמת הורים</h3>
                    <p className="text-muted-foreground text-sm">
                      השימוש באפליקציה על ידי ילדים מחייב הסכמה ופיקוח של הורה או אפוטרופוס חוקי.
                    </p>
                  </section>
                  <section>
                    <h3 className="font-bold text-foreground mb-2">5. תוכן שנוצר באפליקציה</h3>
                    <p className="text-muted-foreground text-sm">
                      הסיפורים נוצרים בעזרת בינה מלאכותית ומותרים לשימוש אישי ומשפחתי בלבד.
                    </p>
                  </section>
                  <section>
                    <h3 className="font-bold text-foreground mb-2">6. קניין רוחני</h3>
                    <p className="text-muted-foreground text-sm">
                      כל זכויות הקניין הרוחני באפליקציה שייכות לחברה.
                    </p>
                  </section>
                  <section>
                    <h3 className="font-bold text-foreground mb-2">7. הגבלת אחריות</h3>
                    <p className="text-muted-foreground text-sm">
                      האפליקציה מסופקת "כמות שהיא" (AS IS). אנו ממליצים על פיקוח הורים בעת השימוש.
                    </p>
                  </section>
                  <p className="text-xs text-muted-foreground pt-4 border-t">
                    גרסה {TERMS_VERSION} | עדכון אחרון: ינואר 2026
                  </p>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="privacy" className="p-6 mt-0">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4 text-right leading-relaxed">
                  <section>
                    <h3 className="font-bold text-foreground mb-2">1. מידע שאנו אוספים</h3>
                    <p className="text-muted-foreground text-sm">
                      אנו אוספים: כתובת אימייל להתחברות, שם וגיל הילד/ה להתאמת הסיפורים, ונתוני שימוש אנונימיים.
                    </p>
                  </section>
                  <section>
                    <h3 className="font-bold text-foreground mb-2">2. שימוש במידע</h3>
                    <p className="text-muted-foreground text-sm">
                      המידע משמש ליצירת סיפורים מותאמים, שיפור השירות ותמיכה טכנית. אנו לא משתמשים במידע לפרסום.
                    </p>
                  </section>
                  <section>
                    <h3 className="font-bold text-foreground mb-2">3. הגנה על פרטיות ילדים (COPPA)</h3>
                    <p className="text-muted-foreground text-sm">
                      אנו לא אוספים מידע אישי מזהה ישירות מילדים. כל איסוף נעשה באמצעות ההורה.
                    </p>
                  </section>
                  <section>
                    <h3 className="font-bold text-foreground mb-2">4. שיתוף מידע</h3>
                    <p className="text-muted-foreground text-sm">
                      אנו לא מוכרים מידע אישי לצדדים שלישיים ולעולם לא נעשה זאת.
                    </p>
                  </section>
                  <section>
                    <h3 className="font-bold text-foreground mb-2">5. אבטחת מידע</h3>
                    <p className="text-muted-foreground text-sm">
                      המידע מוגן בהצפנה ואמצעי אבטחה מתקדמים.
                    </p>
                  </section>
                  <section>
                    <h3 className="font-bold text-foreground mb-2">6. זכויותיכם</h3>
                    <p className="text-muted-foreground text-sm">
                      יש לכם זכות לעיין, לתקן ולמחוק את המידע שלכם בכל עת.
                    </p>
                  </section>
                  <p className="text-xs text-muted-foreground pt-4 border-t">
                    גרסה {TERMS_VERSION} | עדכון אחרון: ינואר 2026
                  </p>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Consent Checkboxes */}
        <div className="bg-card rounded-2xl border shadow-sm p-6 mb-6 space-y-4">
          <div className="flex items-start gap-4">
            <Checkbox
              id="read-terms"
              checked={hasReadTerms}
              onCheckedChange={(checked) => setHasReadTerms(checked === true)}
              className="mt-1 h-5 w-5"
              aria-describedby="read-terms-desc"
            />
            <Label 
              htmlFor="read-terms" 
              className="text-base leading-relaxed cursor-pointer"
            >
              קראתי והבנתי את תנאי השימוש ומדיניות הפרטיות
              <span id="read-terms-desc" className="sr-only">
                סמנו כדי לאשר שקראתם את התנאים
              </span>
            </Label>
          </div>

          <div className="flex items-start gap-4">
            <Checkbox
              id="parent-consent"
              checked={isParentConsent}
              onCheckedChange={(checked) => setIsParentConsent(checked === true)}
              className="mt-1 h-5 w-5"
              aria-describedby="parent-consent-desc"
            />
            <Label 
              htmlFor="parent-consent" 
              className="text-base leading-relaxed cursor-pointer"
            >
              אני הורה או אפוטרופוס חוקי ומסכים/ה לתנאים אלו בשם ילדי
              <span id="parent-consent-desc" className="sr-only">
                סמנו כדי לאשר שאתם הורה או אפוטרופוס
              </span>
            </Label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col items-center gap-4">
          <Button
            onClick={handleAcceptTerms}
            disabled={!canSubmit || isSubmitting}
            size="lg"
            className="gap-3 min-w-[280px] h-14 text-lg font-bold shadow-lg"
            aria-label={canSubmit ? "אישור התנאים והמשך לאפליקציה" : "יש לסמן את שני התנאים כדי להמשיך"}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                שומר...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                מאשר/ת ומתחיל/ה!
              </>
            )}
          </Button>
          
          {!canSubmit && (
            <p className="text-sm text-muted-foreground text-center">
              יש לסמן את שתי ההסכמות כדי להמשיך
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalConsent;
