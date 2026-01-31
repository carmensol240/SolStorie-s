import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Loader2, Eye, EyeOff, KeyRound, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const passwordSchema = z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים");

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updatePassword, session, loading } = useAuth();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect if no session (user didn't come from email link)
  useEffect(() => {
    if (!loading && !session) {
      toast({
        title: "שגיאה",
        description: "קישור לא תקין. נסו לבקש קישור חדש לאיפוס סיסמה.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [session, loading, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast({
        title: "שגיאה",
        description: passwordResult.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "שגיאה",
        description: "הסיסמאות אינן תואמות",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await updatePassword(password);
    
    if (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לעדכן את הסיסמה. נסו שוב.",
        variant: "destructive",
      });
    } else {
      setIsSuccess(true);
      toast({
        title: "הצלחה!",
        description: "הסיסמה עודכנה בהצלחה",
      });
      setTimeout(() => {
        navigate("/library");
      }, 2000);
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="h-screen h-[100dvh] bg-background flex items-center justify-center overflow-hidden">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="h-screen h-[100dvh] bg-background bg-halftone flex items-center justify-center overflow-hidden">
        <div className="text-center space-y-3">
          <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
          <h1 className="text-xl font-bold text-foreground">הסיסמה עודכנה בהצלחה!</h1>
          <p className="text-muted-foreground text-sm">מעבירים אתכם לספרייה...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] bg-background bg-halftone flex flex-col overflow-hidden">
      <div className="container max-w-md mx-auto px-4 py-4 flex-1 flex flex-col">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/auth")}
          className="mb-3 flex items-center gap-1 self-start"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה להתחברות
        </Button>

        {/* Header */}
        <div className="text-center mb-4">
          <KeyRound className="w-10 h-10 mx-auto text-primary mb-2" />
          <h1 className="text-2xl font-bold text-foreground mb-1">
            סיסמה חדשה 🔐
          </h1>
          <p className="text-muted-foreground text-sm">
            הזינו את הסיסמה החדשה שלכם
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה חדשה</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="לפחות 6 תווים"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 pl-10 text-left"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">אימות סיסמה</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="הזינו שוב את הסיסמה"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10 pl-10 text-left"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 rounded-2xl comic-shadow"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "עדכנו סיסמה"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
