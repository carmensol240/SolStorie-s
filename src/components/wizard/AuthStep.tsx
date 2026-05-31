import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
const GOOGLE_SIGNIN_ENABLED = false;

interface AuthStepProps {
  formData: StoryFormData;
  onAuthenticated: () => void;
}

const AuthStep = ({ formData, onAuthenticated }: AuthStepProps) => {
  const { toast } = useToast();
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<"parent" | "educator">("parent");

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
      toast({
        title: "שגיאה בשמירת פרטי הילד",
        description: "ההרשמה הצליחה, אך לא הצלחנו לשמור את פרטי הילד. תוכלו להוסיף אותם מאוחר יותר.",
        variant: "destructive",
      });
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
          user_role: userRole,
        });
        if (error) {
          toast({ title: "שגיאה בהרשמה", description: error.message, variant: "destructive" });
          return;
        }
      }
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        await saveChildToSupabase(newUser.id);
        const termsPayload = {
          terms_accepted_at: new Date().toISOString(),
          terms_version: "1.0",
          marketing_consent: marketingConsent,
        };
        const { data: updated, error: updateErr } = await supabase
          .from("profiles")
          .update(termsPayload)
          .eq("id", newUser.id)
          .select("id");
        if (updateErr || !updated || updated.length === 0) {
          // Profile row not yet created by the handle_new_user trigger —
          // upsert as a fallback so terms acceptance is never lost.
          const { error: upsertErr } = await supabase
            .from("profiles")
            .upsert({ id: newUser.id, ...termsPayload }, { onConflict: "id" });
          if (upsertErr) {
            console.error("Failed to persist terms acceptance:", updateErr || upsertErr);
            toast({
              title: "שגיאה בשמירת אישור התנאים",
              description: "נסו שוב או רעננו את הדף",
              variant: "destructive",
            });
            return;
          }
        }
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
    if (!termsAccepted) {
      toast({ title: "שגיאה", description: "יש לאשר את תנאי השימוש", variant: "destructive" });
      return;
    }
    localStorage.setItem('pending_story_formData', JSON.stringify(formData));
    localStorage.setItem('returnTo', '/create?resume=true');
    localStorage.setItem('pending_wizard_terms_accept', '1');
    localStorage.setItem('pending_wizard_marketing_consent', marketingConsent ? '1' : '0');
    document.cookie =
      'ss_return_to=' + encodeURIComponent('/create?resume=true') +
      '; Max-Age=600; Path=/; SameSite=Lax; Secure';
    // Iframe-escape: in the Lovable preview the app runs inside an iframe,
    // and Google's OAuth consent screen refuses to render in a third-party
    // iframe (X-Frame-Options / frame-ancestors), surfacing as a 403.
    // Open the live /auth flow in a new top-level tab in that case.
    if (typeof window !== 'undefined' && window.self !== window.top) {
      const returnTo = encodeURIComponent('/create?resume=true');
      window.open(
        `https://soulstory.co.il/auth?returnTo=${returnTo}`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `https://soulstory.co.il/auth?returnTo=${encodeURIComponent('/create?resume=true')}`
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
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-3 py-8 overflow-y-auto z-[110]"
      style={{
        background: '#0d0a1f',
        backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 0.5px, transparent 1.2px),
                          radial-gradient(circle at 70% 60%, rgba(255,255,255,0.45) 0.5px, transparent 1.2px),
                          radial-gradient(circle at 40% 80%, rgba(255,255,255,0.5) 0.5px, transparent 1.2px),
                          radial-gradient(circle at 85% 20%, rgba(255,255,255,0.5) 0.5px, transparent 1.2px)`,
        backgroundSize: '120px 120px, 200px 200px, 160px 160px, 240px 240px',
      }}
      dir="rtl"
    >
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <p className="text-lg font-black text-white drop-shadow">
            הצטרפו לעולם הסיפורים ✨
          </p>
          <p className="text-sm text-purple-200/80">
            עוד שלב קטן ואתם ממשיכים לבחירת הנושא
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 flex items-center justify-center text-center py-2.5 rounded-full text-sm font-bold transition-all ${
                mode === "signup"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow"
                  : "bg-white/10 text-white/70"
              }`}
            >
              הרשמה
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 flex items-center justify-center text-center py-2.5 rounded-full text-sm font-bold transition-all ${
                mode === "login"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow"
                  : "bg-white/10 text-white/70"
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
              className="text-right pr-9 text-sm h-11 rounded-xl"
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
              className="text-right pr-9 pl-9 text-sm h-11 rounded-xl"
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
              <div className="space-y-1.5">
                <p className="text-xs text-white/80 font-bold">אני...</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUserRole("parent")}
                    className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border-2 transition-all ${
                      userRole === "parent"
                        ? "border-purple-300 bg-white/15"
                        : "border-white/15 bg-white/5"
                    }`}
                  >
                    <span className="text-xl">👨‍👩‍👧</span>
                    <span className="text-[11px] font-bold text-white">הורה</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRole("educator")}
                    className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border-2 transition-all ${
                      userRole === "educator"
                        ? "border-purple-300 bg-white/15"
                        : "border-white/15 bg-white/5"
                    }`}
                  >
                    <span className="text-xl">📚</span>
                    <span className="text-[11px] font-bold text-white">איש/ת חינוך</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="auth-step-terms"
                  checked={termsAccepted}
                  onCheckedChange={(c) => setTermsAccepted(c === true)}
                  className="border-purple-300 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 h-4 w-4"
                />
                <label htmlFor="auth-step-terms" className="text-xs text-white/70 cursor-pointer leading-tight">
                  קראתי ואני מסכימ/ה ל
                  <a href="/terms" target="_blank" className="text-purple-300 underline underline-offset-2 mx-0.5">
                    תנאי השימוש
                  </a>
                </label>
              </div>

              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="auth-step-marketing"
                  checked={marketingConsent}
                  onCheckedChange={(c) => setMarketingConsent(c === true)}
                  className="border-purple-300 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 h-4 w-4"
                />
                <label htmlFor="auth-step-marketing" className="text-xs text-white/70 cursor-pointer leading-tight">
                  אני רוצה לקבל קופונים ומבצעים במייל (אופציונלי)
                </label>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={submitting || (mode === "signup" && !termsAccepted)}
            className="w-full flex items-center justify-center text-center bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-black text-base rounded-full py-3.5 h-auto disabled:opacity-40"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "signup" ? (
              "הירשמו והמשיכו ✨"
            ) : (
              "התחברו והמשיכו ✨"
            )}
          </Button>

          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.setItem("create_wizard_draft", JSON.stringify({
                  childName: formData.childName,
                  childGender: formData.childGender,
                  ageRange: formData.ageRange,
                  storyLength: formData.storyLength,
                  language: formData.language,
                }));
              } catch (e) {
                console.warn("[AuthStep] Failed to save wizard draft:", e);
              }
              navigate("/demo-story");
            }}
            className="w-full flex items-center justify-center text-center bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-black text-sm rounded-full py-2.5 h-auto transition-all"
          >
            לצפייה בסיפור לדוגמה 📖
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthStep;
