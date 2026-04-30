import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
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
const GOOGLE_SIGNIN_ENABLED = true;

interface AuthStepProps {
  formData: StoryFormData;
  onAuthenticated: () => void;
}

const AuthStep = ({ formData, onAuthenticated }: AuthStepProps) => {
  const { toast } = useToast();
  const { signInWithEmail, signUpWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [submitting, setSubmitting] = useState(false);

  const saveChildToSupabase = async (userId: string) => {
    try {
      const ageMap: Record<string, number> = { "0-2": 1, "2-4": 3, "5-7": 6, "8-10": 9 };
      const guestAvatar = localStorage.getItem('guest_avatar_url');
      const avatarUrl = guestAvatar || formData.childAvatarUrl || null;
      await supabase.from("children").insert({
        user_id: userId,
        name: formData.childName,
        age: ageMap[formData.ageRange] || 5,
        gender: formData.childGender === "female" ? "girl" : "boy",
        personality_traits: formData.personalityTraits || null,
        fixed_details: formData.fixedDetails || null,
        photo_url: formData.childPhoto || null,
        avatar_url: avatarUrl,
        photo_consent: formData.photoConsent || false,
      });
      if (guestAvatar) {
        localStorage.removeItem('guest_avatar_url');
      }
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

    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          toast({ title: "שגיאה בהתחברות", description: error.message, variant: "destructive" });
          return;
        }
      } else {
        const { error } = await signUpWithEmail(email, password, {
          display_name: email.split("@")[0],
        });
        if (error) {
          toast({ title: "שגיאה בהרשמה", description: error.message, variant: "destructive" });
          return;
        }
      }
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        await saveChildToSupabase(newUser.id);
        await supabase.from("profiles").update({
          terms_accepted_at: new Date().toISOString(),
          terms_version: "1.0",
          marketing_consent: marketingConsent,
        }).eq("id", newUser.id);
      }
      toast({ title: "ברוכים הבאים! 🎉", description: "בואו נמשיך ליצור את הסיפור..." });
      onAuthenticated();
    } catch (err) {
      console.error("Auth error:", err);
      toast({ title: "שגיאה", description: "אירעה שגיאה, נסו שוב", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!GOOGLE_SIGNIN_ENABLED) return;
    localStorage.setItem('pending_story_formData', JSON.stringify(formData));
    localStorage.setItem('returnTo', '/create?resume=true');
    document.cookie =
      'ss_return_to=' + encodeURIComponent('/create?resume=true') +
      '; Max-Age=600; Path=/; SameSite=Lax; Secure';
    try {
      if (typeof window !== 'undefined' && window.self !== window.top) {
        window.open('https://soulstory.co.il/auth', '_blank', 'noopener');
        return;
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback'
        }
      });
      if (error) {
        toast({ title: "שגיאה", description: "ההתחברות עם Google נכשלה", variant: "destructive" });
      }
    } catch {
      toast({ title: "שגיאה", description: "אירעה שגיאה, נסו שוב", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col items-center px-2 py-3" dir="rtl">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-purple-100/50 space-y-3">
        <div className="text-center space-y-1">
          <p className="text-base font-black text-purple-700">
            🌟 הירשמו לשמור את הסיפור!
          </p>
          <p className="text-xs text-purple-600/80">
            עוד שלב קטן ואתם ממשיכים לבחירת הנושא
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={!GOOGLE_SIGNIN_ENABLED}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 transition-all text-sm font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale disabled:hover:bg-white"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z" fill="#EA4335"/>
          </svg>
          המשיכו עם Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-xs text-gray-400 font-medium">או</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                mode === "signup"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow"
                  : "bg-purple-50 text-purple-400"
              }`}
            >
              הרשמה
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                mode === "login"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow"
                  : "bg-purple-50 text-purple-400"
              }`}
            >
              כבר יש לי חשבון
            </button>
          </div>

          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-right pr-9 text-sm h-9 rounded-xl"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="סיסמה (6+ תווים)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-right pr-9 pl-9 text-sm h-9 rounded-xl"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          </div>

          {mode === "signup" && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="auth-step-terms"
                  checked={termsAccepted}
                  onCheckedChange={(c) => setTermsAccepted(c === true)}
                  className="border-purple-300 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 h-4 w-4"
                />
                <label htmlFor="auth-step-terms" className="text-[11px] text-muted-foreground cursor-pointer leading-tight">
                  קראתי ואני מסכימ/ה ל
                  <a href="/terms" target="_blank" className="text-purple-500 underline underline-offset-2 mx-0.5">
                    תנאי השימוש
                  </a>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="auth-step-marketing"
                  checked={marketingConsent}
                  onCheckedChange={(c) => setMarketingConsent(c === true)}
                  className="border-purple-300 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 h-4 w-4"
                />
                <label htmlFor="auth-step-marketing" className="text-[11px] text-muted-foreground cursor-pointer leading-tight">
                  אני רוצה לקבל קופונים ומבצעים במייל (אופציונלי)
                </label>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={submitting || (mode === "signup" && !termsAccepted)}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-black text-sm rounded-full py-2.5 h-auto disabled:opacity-40"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "signup" ? (
              "הירשמו והמשיכו ✨"
            ) : (
              "התחברו והמשיכו ✨"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AuthStep;
