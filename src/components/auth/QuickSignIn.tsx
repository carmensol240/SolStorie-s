import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";

interface QuickSignInProps {
  returnTo: string;
  onPasswordLogin: () => void;
}

const markPending = (returnTo: string) => {
  // Terms are accepted by signing up here; persisted to the profile once a session exists.
  localStorage.setItem("pending_wizard_terms_accept", "1");
  localStorage.setItem("returnTo", returnTo);
};

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.3-4.7 3.3-7.8z" />
    <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8z" />
    <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
  </svg>
);

const QuickSignIn = ({ returnTo, onPasswordLogin }: QuickSignInProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState<null | "google" | "send" | "verify">(null);

  const finishLogin = async (payload: Record<string, string>) => {
    setBusy("verify");
    const { data, error } = await supabase.functions.invoke("verify-login-code", { body: payload });
    if (error || !data?.token_hash) {
      let reason = "";
      try { reason = (await (error as any)?.context?.json())?.error ?? ""; } catch {}
      setBusy(null);
      const msg =
        reason === "too_many" ? "יותר מדי ניסיונות. בקשו קוד חדש." :
        reason === "expired" ? "הקוד או הקישור פגו תוקף. בקשו קוד חדש." :
        "הקוד שגוי. נסו שוב.";
      toast({ title: msg, variant: "destructive" });
      return false;
    }
    if (data.returnTo) localStorage.setItem("returnTo", data.returnTo);
    localStorage.setItem("pending_wizard_terms_accept", "1");
    const { error: otpErr } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: "magiclink" });
    setBusy(null);
    if (otpErr) {
      toast({ title: "הכניסה נכשלה", description: "בקשו קוד חדש ונסו שוב.", variant: "destructive" });
      return false;
    }
    return true;
    // Success: Auth page sees the session and navigates to returnTo.
  };

  // Sign-in link from the email: /auth?login_token=...
  const linkHandled = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkToken = params.get("login_token");
    if (!linkToken || linkHandled.current) return;
    linkHandled.current = true;
    params.delete("login_token");
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    void finishLogin({ linkToken });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogle = async () => {
    setBusy("google");
    markPending(returnTo);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth?returnTo=${encodeURIComponent(returnTo)}`,
    });
    if (result.error) {
      toast({ title: "ההתחברות עם Google נכשלה", description: "נסו שוב או הירשמו עם קוד במייל.", variant: "destructive" });
      setBusy(null);
    }
    // On success the Auth page picks up the session and navigates.
  };

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      toast({ title: "כתובת מייל לא תקינה", variant: "destructive" });
      return;
    }
    setBusy("send");
    markPending(returnTo);
    const { error } = await supabase.functions.invoke("send-login-code", { body: { email: clean, returnTo } });
    setBusy(null);
    if (error) {
      let busySite = false;
      try { busySite = (await (error as any).context?.json())?.error === "busy"; } catch {}
      toast({
        title: busySite ? "יש עומס כרגע" : "לא הצלחנו לשלוח קוד",
        description: busySite ? "נסו שוב מאוחר יותר, או המשיכו עם Google." : "בדקו את כתובת המייל ונסו שוב.",
        variant: "destructive",
      });
      return;
    }
    setEmail(clean);
    setStage("code");
    toast({ title: `שלחנו קוד ל-${clean}`, description: "בדקו גם בתיקיית הספאם." });
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length < 6) {
      toast({ title: "הקלידו את הקוד מהמייל", variant: "destructive" });
      return;
    }
    await finishLogin({ email, code: token });
    // Success: onAuthStateChange → Auth page navigates to returnTo.
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-adventure-sky px-5 py-10" dir="rtl">
      <div className="w-full max-w-sm bg-card/95 backdrop-blur rounded-3xl shadow-xl p-6 space-y-5">
        <div className="text-center space-y-2">
          <span className="text-2xl font-black logo-3d-bubble" dir="ltr"><span className="logo-rainbow">SolStorie's™</span></span>
          <h1 className="text-xl font-black text-foreground leading-snug">
            נרשמים בקליק, והסיפורים שלכם נשמרים בספרייה
          </h1>
        </div>

        {stage === "email" ? (
          <>
            <Button
              type="button"
              onClick={handleGoogle}
              disabled={busy !== null}
              variant="outline"
              className="w-full min-h-[52px] text-base font-bold gap-3 rounded-full border-2 bg-background"
            >
              {busy === "google" ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
              המשך עם Google
            </Button>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> או במייל <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={sendCode} className="space-y-3">
              <label htmlFor="otp-email" className="sr-only">כתובת מייל</label>
              <Input
                id="otp-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                dir="ltr"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-[48px] text-base text-left"
              />
              <Button type="submit" disabled={busy !== null} className="w-full min-h-[48px] text-base font-bold rounded-full">
                {busy === "send" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                שלחו לי קוד
              </Button>
            </form>
          </>
        ) : (
          <form onSubmit={verifyCode} className="space-y-3">
            <p className="text-base text-foreground text-center">
              שלחנו קוד אל <span dir="ltr" className="font-bold">{email}</span>
            </p>
            <label htmlFor="otp-code" className="sr-only">קוד מהמייל</label>
            <Input
              id="otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              maxLength={10}
              placeholder="הקוד מהמייל"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="min-h-[52px] text-2xl tracking-[0.4em] placeholder:tracking-normal placeholder:text-base text-center font-bold"
              autoFocus
            />
            <Button type="submit" disabled={busy !== null} className="w-full min-h-[48px] text-base font-bold rounded-full">
              {busy === "verify" ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              כניסה
            </Button>
            <p className="text-sm text-muted-foreground text-center">אפשר גם ללחוץ על הקישור שבמייל.</p>
            <div className="flex justify-between text-sm">
              <button type="button" onClick={() => { setStage("email"); setCode(""); }} className="min-h-[48px] text-primary font-semibold flex items-center gap-1">
                <ArrowRight className="w-4 h-4" /> שינוי מייל
              </button>
              <button type="button" onClick={() => sendCode()} disabled={busy !== null} className="min-h-[48px] text-primary font-semibold">
                שלחו שוב
              </button>
            </div>
          </form>
        )}

        <button type="button" onClick={onPasswordLogin} className="w-full min-h-[48px] text-sm text-muted-foreground underline">
          התחברות עם סיסמה
        </button>

        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          בהרשמה אתם מאשרים את{" "}
          <Link to="/terms" className="text-primary font-semibold underline">תנאי השימוש</Link>
          {" "}ו
          <Link to="/privacy" className="text-primary font-semibold underline">מדיניות הפרטיות</Link>
        </p>
      </div>
    </div>
  );
};

export default QuickSignIn;
