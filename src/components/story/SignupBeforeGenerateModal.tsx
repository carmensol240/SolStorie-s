import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import type { StoryFormData } from "@/pages/CreateStory";

const emailSchema = z.string().email("כתובת אימייל לא תקינה");
const passwordSchema = z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים");

interface SignupBeforeGenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: StoryFormData;
  onSignupComplete: () => void;
}

const SignupBeforeGenerateModal = ({
  open,
  onOpenChange,
  formData,
  onSignupComplete,
}: SignupBeforeGenerateModalProps) => {
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const saveChildToSupabase = async (userId: string) => {
    try {
      const ageMap: Record<string, number> = {
        "0-2": 1, "2-4": 3, "5-7": 6, "8-10": 9,
      };
      await supabase.from("children").insert({
        user_id: userId,
        name: formData.childName,
        age: ageMap[formData.ageRange] || 5,
        gender: formData.childGender === "female" ? "girl" : "boy",
        personality_traits: formData.personalityTraits || null,
        fixed_details: formData.fixedDetails || null,
        clothing_type: formData.clothingType || null,
        clothing_color: formData.clothingColor || null,
        photo_url: formData.childPhoto || null,
        avatar_url: formData.childAvatarUrl || null,
      });
    } catch (e) {
      console.warn("Failed to save child profile:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast({ title: "שגיאה", description: emailResult.error.errors[0].message, variant: "destructive" });
      return;
    }
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast({ title: "שגיאה", description: passwordResult.error.errors[0].message, variant: "destructive" });
      return;
    }

    if (mode === "signup" && !termsAccepted) {
      toast({ title: "שגיאה", description: "יש לאשר את תנאי השימוש", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          toast({ title: "שגיאה בהתחברות", description: error.message, variant: "destructive" });
          return;
        }
        // Save child profile for logged-in user too
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await saveChildToSupabase(user.id);
          // Accept terms if not already
          await supabase.from("profiles").update({
            terms_accepted_at: new Date().toISOString(),
            terms_version: "1.0",
          }).eq("id", user.id);
        }
      } else {
        const { data, error } = await signUpWithEmail(email, password, {
          display_name: displayName || email.split("@")[0],
        });
        if (error) {
          toast({ title: "שגיאה בהרשמה", description: error.message, variant: "destructive" });
          return;
        }
        // After auto-login, save child + accept terms
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await saveChildToSupabase(user.id);
          await supabase.from("profiles").update({
            terms_accepted_at: new Date().toISOString(),
            terms_version: "1.0",
          }).eq("id", user.id);
        }
      }

      onOpenChange(false);
      onSignupComplete();
    } catch (err) {
      console.error("Auth error:", err);
      toast({ title: "שגיאה", description: "אירעה שגיאה, נסו שוב", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm mx-auto rounded-2xl border-0 p-0 overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-6 pt-6 pb-4 text-center">
          <Sparkles className="w-8 h-8 text-white/90 mx-auto mb-2" />
          <h2 className="text-xl font-black text-white drop-shadow-md">
            🌟 עוד רגע והסיפור שלכם מוכן!
          </h2>
          <p className="text-sm text-white/80 mt-1">
            הירשמו כדי לשמור את הסיפור ולהתחיל את ההרפתקה
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3">
          {/* Mode toggle */}
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-1.5 rounded-full text-sm font-bold transition-all ${
                mode === "signup"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              הרשמה
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-1.5 rounded-full text-sm font-bold transition-all ${
                mode === "login"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              כבר יש לי חשבון
            </button>
          </div>

          {mode === "signup" && (
            <div className="relative">
              <Input
                placeholder="שם (אופציונלי)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-right text-sm h-10"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-right pr-10 text-sm h-10"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="סיסמה (6+ תווים)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-right pr-10 pl-10 text-sm h-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>

          {mode === "signup" && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="modal-terms"
                checked={termsAccepted}
                onCheckedChange={(c) => setTermsAccepted(c === true)}
                className="border-purple-300 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
              />
              <label htmlFor="modal-terms" className="text-xs text-muted-foreground cursor-pointer">
                קראתי ואני מסכימ/ה ל
                <a href="/terms" target="_blank" className="text-purple-500 underline underline-offset-2 mx-0.5">
                  תנאי השימוש
                </a>
              </label>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || (mode === "signup" && !termsAccepted)}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-black rounded-full py-3 disabled:opacity-40"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "signup" ? (
              "הירשמו וצרו את הסיפור ✨"
            ) : (
              "התחברו וצרו את הסיפור ✨"
            )}
          </Button>

          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              navigate("/");
            }}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            אולי אחר כך
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SignupBeforeGenerateModal;
