import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/use-analytics";

type ExitReason = 
  | "not_using"
  | "too_expensive"
  | "looking_for_something_else"
  | "technical_issues"
  | "content_mismatch"
  | "other";

const REASONS: { value: ExitReason; label: string }[] = [
  { value: "not_using", label: "לא משתמש/ת מספיק" },
  { value: "too_expensive", label: "יקר לי" },
  { value: "looking_for_something_else", label: "חיפשתי משהו אחר" },
  { value: "technical_issues", label: "היו לי בעיות טכניות" },
  { value: "content_mismatch", label: "לא התחברתי לתוכן" },
  { value: "other", label: "סיבה אחרת" },
];

const RESPONSES: Record<ExitReason, string> = {
  not_using: "אפשר פשוט לקחת הפסקה. החשבון והסיפורים יישארו כאן כשתרצי לחזור.",
  too_expensive: "אפשר להישאר בלי תשלום ולחזור כשתרגישי נכון.",
  technical_issues: "רוצה שננסה לעזור? לפעמים זה פתרון קטן.",
  content_mismatch: "אנחנו כל הזמן משתפרים. אולי שווה לחזור בעתיד.",
  looking_for_something_else: "תודה שניסית! אנחנו תמיד כאן אם תרצי לחזור.",
  other: "תודה שחלקת איתנו. מקווים לראות אותך שוב.",
};

const AccountExit = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  
  const [selectedReason, setSelectedReason] = useState<ExitReason | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Track screen view on mount
  useEffect(() => {
    trackEvent({ eventType: "deletion_screen_view" });
  }, [trackEvent]);

  const handleReasonChange = (value: string) => {
    const reason = value as ExitReason;
    setSelectedReason(reason);
    trackEvent({ 
      eventType: "deletion_reason_selected", 
      metadata: { reason } 
    });
  };

  const handleSoftExit = () => {
    trackEvent({ 
      eventType: "soft_exit_chosen", 
      metadata: selectedReason ? { reason: selectedReason } : undefined 
    });
    toast({
      title: "החשבון נשאר פעיל",
      description: "הכל יישמר. נשמח לראות אותך בכל עת.",
    });
    navigate("/settings");
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      trackEvent({ 
        eventType: "account_deleted", 
        metadata: selectedReason ? { reason: selectedReason } : undefined 
      });
      
      // Note: Account deletion should be handled by a backend function
      // This is a placeholder for the UI
      await signOut();
      
      toast({
        title: "החשבון נמחק",
        description: "תודה שהיית איתנו. להתראות!",
      });
      navigate("/");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "שגיאה",
        description: "משהו השתבש, נסו שוב",
        variant: "destructive",
      });
    } finally {
      setDeletingAccount(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-background overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b-2 border-foreground/10 p-3 flex-shrink-0">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/settings")} 
            aria-label="חזרה להגדרות"
          >
            <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
            חזרה
          </Button>
          <div className="w-16" aria-hidden="true" />
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 py-4 space-y-4 flex-1 overflow-y-auto">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-foreground">כבר נפרדים?</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            לפני שמוחקים את החשבון – נשמח לדעת מה הסיבה, כדי להשתפר.
          </p>
          <p className="text-xs text-muted-foreground/70">(אופציונלי בלבד)</p>
        </div>

        {/* Reason Selection */}
        <RadioGroup
          value={selectedReason || ""}
          onValueChange={handleReasonChange}
          className="space-y-2"
        >
          {REASONS.map((reason) => (
            <div
              key={reason.value}
              className={`
                relative flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer
                transition-all duration-200
                ${selectedReason === reason.value 
                  ? "border-primary bg-primary/5" 
                  : "border-foreground/10 bg-card hover:border-foreground/20"
                }
              `}
              onClick={() => handleReasonChange(reason.value)}
            >
              <RadioGroupItem
                value={reason.value}
                id={reason.value}
                className="shrink-0"
              />
              <Label
                htmlFor={reason.value}
                className="flex-1 cursor-pointer text-foreground font-medium text-sm"
              >
                {reason.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {/* Conditional Response */}
        {selectedReason && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-foreground/80 leading-relaxed text-sm">
              {RESPONSES[selectedReason]}
            </p>
          </div>
        )}

        {/* Soft Exit CTA */}
        <div className="space-y-1 pt-2">
          <Button
            onClick={handleSoftExit}
            className="w-full h-11 text-base font-medium"
            size="lg"
          >
            השארת חשבון ללא פעילות
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            הכל יישמר. אין הודעות. אין התחייבות.
          </p>
        </div>

        {/* Delete Link - Subtle at the bottom */}
        <div className="text-center pt-2 border-t border-border">
          <button
            onClick={() => setShowConfirmDialog(true)}
            className="text-xs text-muted-foreground/60 hover:text-destructive transition-colors underline-offset-4 hover:underline"
          >
            מחיקת חשבון לצמיתות
          </button>
        </div>
      </div>

      {/* Final Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              אישור מחיקה
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              פעולה זו תמחק את כל הנתונים שלך לצמיתות.
              <br />
              <strong className="text-destructive">לא ניתן לשחזר.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-transparent text-destructive hover:bg-destructive/10 border border-destructive/30"
              disabled={deletingAccount}
            >
              {deletingAccount ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "מחק לצמיתות"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AccountExit;
