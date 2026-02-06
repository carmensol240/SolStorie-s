import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Loader2, RefreshCw, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // If user is verified, redirect to consent/library (with open redirect protection)
  useEffect(() => {
    if (!loading && user?.email_confirmed_at) {
      const storedReturnTo = localStorage.getItem('returnTo') || '/consent';
      // Only allow relative paths starting with / but not // (protocol-relative)
      const returnTo = storedReturnTo.startsWith('/') && !storedReturnTo.startsWith('//') 
        ? storedReturnTo 
        : '/consent';
      navigate(returnTo, { replace: true });
    }
  }, [user, loading, navigate]);

  // If no user at all, redirect to auth
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (!user?.email || resendCooldown > 0) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/consent`,
        },
      });
      
      if (error) throw error;
      
      toast({
        title: "המייל נשלח! ✉️",
        description: "בדקו את תיבת הדואר שלכם (גם בתיקיית ספאם)",
      });
      setResendCooldown(60); // 60 second cooldown
    } catch (error) {
      console.error('Resend verification error:', error);
      toast({
        title: "שגיאה בשליחת המייל",
        description: "נסו שוב בעוד כמה דקות",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-background to-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-background to-background" dir="rtl">
      <div className="container max-w-lg mx-auto px-4 py-12">
        <div className="bg-card rounded-3xl p-8 shadow-lg border border-border text-center space-y-6">
          {/* Email Icon */}
          <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-12 h-12 text-primary" />
          </div>
          
          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground">
              ✉️ אמתו את כתובת האימייל
            </h1>
            <p className="text-muted-foreground text-lg">
              שלחנו קישור אימות לכתובת:
            </p>
            <p className="font-semibold text-primary text-lg bg-primary/5 py-2 px-4 rounded-xl inline-block">
              {user?.email}
            </p>
          </div>
          
          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-right space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-amber-800 text-sm">
                פתחו את תיבת הדואר שלכם ולחצו על הקישור לאימות
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-amber-800 text-sm">
                בדקו גם בתיקיית הספאם אם לא מצאתם את המייל
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-amber-800 text-sm">
                לאחר האימות תועברו אוטומטית לאפליקציה
              </p>
            </div>
          </div>
          
          {/* Resend Button */}
          <Button
            onClick={handleResendVerification}
            disabled={isResending || resendCooldown > 0}
            variant="outline"
            size="lg"
            className="w-full gap-2 min-h-[48px]"
          >
            {isResending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            {resendCooldown > 0 
              ? `שליחה מחדש בעוד ${resendCooldown} שניות`
              : "שלחו שוב את המייל"
            }
          </Button>
          
          {/* Back to Login */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה להתחברות
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
