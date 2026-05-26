import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

const CAST_IMG =
  "https://qvdwmkxviaqcgmjotsxe.supabase.co/storage/v1/object/public/topic-images/cast-group-forest.png";

const MaintenanceBlock = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({
        title: "כתובת אימייל לא תקינה",
        description: "אנא הזינו כתובת אימייל תקינה",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("maintenance_signups")
      .insert({ email: trimmed });
    setLoading(false);
    if (error) {
      toast({
        title: "משהו השתבש",
        description: "לא הצלחנו לשמור את המייל. נסו שוב בעוד רגע 💜",
        variant: "destructive",
      });
      return;
    }
    setSubmitted(true);
    toast({
      title: "תודה! ✨",
      description: "נעדכן אתכם ברגע שנחזור",
    });
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] overflow-y-auto bg-gradient-to-b from-[#1a0533] via-[#2d1b69] to-[#3b1f7a] px-6 py-10"
    >
      {/* Floating sparkles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background:
                i % 3 === 0
                  ? "rgba(255,215,120,0.85)"
                  : i % 3 === 1
                  ? "rgba(255,255,255,0.75)"
                  : "rgba(255,180,220,0.8)",
              boxShadow: "0 0 10px rgba(255,215,120,0.6)",
              animationDuration: `${2 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-6 text-center">
        {/* Logo */}
        <h2 className="text-2xl font-black tracking-tight" dir="ltr">
          <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent drop-shadow">
            SolStorie's™
          </span>
        </h2>

        {/* Characters image */}
        <div className="relative w-full max-w-sm">
          <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-amber-400/30 via-pink-400/20 to-violet-400/30 blur-3xl" />
          <img
            src={CAST_IMG}
            alt="הדמויות של SolStories"
            className="w-full rounded-3xl border-2 border-white/15 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6)]"
            loading="eager"
          />
        </div>

        {/* Title */}
        <h1 className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-black leading-relaxed text-white drop-shadow">
          SolStories חוזרת בקרוב עם קסם חדש!
          <Sparkles className="h-6 w-6 text-amber-300" />
        </h1>

        {/* Subtitle */}
        <p className="max-w-md text-base sm:text-lg text-white/85 leading-relaxed">
          אנחנו משפרים את החוויה שלכם. השאירו מייל ותהיו הראשונים לדעת!
        </p>

        {/* Form */}
        {submitted ? (
          <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-5 backdrop-blur-md">
            <p className="text-white font-bold text-lg">
              תודה! נהיה בקשר ברגע שנחזור 💜
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md shadow-xl"
          >
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="האימייל שלכם"
              dir="ltr"
              className="h-12 rounded-xl border-white/30 bg-white/95 text-right text-base text-[#2d1b69] placeholder:text-[#2d1b69]/50 focus-visible:ring-amber-300"
            />
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-12 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 text-white font-black text-base shadow-[0_0_24px_rgba(251,191,36,0.45)] hover:shadow-[0_0_32px_rgba(251,191,36,0.65)] hover:scale-[1.02] active:scale-95 transition-all"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>עדכנו אותי 💜</>
              )}
            </Button>
          </form>
        )}

        <p className="text-white/50 text-xs mt-2">
          אנחנו לא נשלח ספאם. רק בשורה אחת — שחזרנו ✨
        </p>
      </div>

      {/* Hidden admin access */}
      <Link
        to="/auth"
        aria-label="admin"
        className="fixed bottom-2 left-2 z-[10000] h-8 w-8 rounded-full opacity-0 hover:opacity-20 active:opacity-30 bg-white"
      />
    </div>
  );
};

export default MaintenanceBlock;