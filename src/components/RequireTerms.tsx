import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { isDevModeEnabled, MOCK_DEV_PROFILE } from "@/hooks/use-dev-mode";

interface RequireTermsProps {
  children: ReactNode;
}

const PROFILE_QUERY_TIMEOUT_MS = 8000;
const GATE_TIMEOUT_MS = 12000;

const withTimeout = <T,>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    Promise.resolve(promise).then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });

const RequireTerms = ({ children }: RequireTermsProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [termsChecked, setTermsChecked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [stuck, setStuck] = useState(false);

  // Global gate fallback: if we're still loading after GATE_TIMEOUT_MS,
  // stop showing an infinite spinner and offer recovery actions.
  useEffect(() => {
    if (!authLoading && !checking) return;
    const t = setTimeout(() => {
      console.warn('[RequireTerms] gate stuck loading > 12s — showing fallback UI');
      setStuck(true);
    }, GATE_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [authLoading, checking]);

  useEffect(() => {
    const checkTermsAccepted = async () => {
      // 🔧 DEV MODE: Skip all auth checks
      if (isDevModeEnabled()) {
        console.log('🔧 Dev mode: bypassing auth & terms check');
        setTermsChecked(true);
        setChecking(false);
        return;
      }

      if (authLoading) return;
      
      if (!user) {
        // Only store path if it's a relative path (prevent open redirect)
        const currentPath = window.location.pathname + window.location.search;
        if (currentPath.startsWith('/') && !currentPath.startsWith('//')) {
          localStorage.setItem('returnTo', currentPath);
          navigate(`/auth?returnTo=${encodeURIComponent(currentPath)}`);
        } else {
          navigate('/auth');
        }
        return;
      }

      try {
        const { data, error } = await withTimeout(
          supabase
            .from("profiles")
            .select("terms_accepted_at")
            .eq("id", user.id)
            .maybeSingle(),
          PROFILE_QUERY_TIMEOUT_MS,
          'profiles.terms_accepted_at query',
        );

        if (error) {
          console.warn("[RequireTerms] Error checking terms:", error);
          // If profile doesn't exist yet, redirect to auth with consent step
          navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }

        // Defensive: profile row is missing entirely (handle_new_user trigger
        // didn't fire, or account predates the trigger). Auto-create a minimal
        // profile so the user isn't stuck in a redirect loop, then send them
        // to onboarding to accept terms.
        if (!data) {
          console.warn("[RequireTerms] Profile row missing for user", user.id, "— creating minimal profile");
          try {
            await supabase.from("profiles").upsert(
              { id: user.id, email: user.email, story_credits: 1, coloring_credits: 0, user_role: 'parent' },
              { onConflict: "id" },
            );
          } catch (e) {
            console.warn("[RequireTerms] Auto-create profile failed:", e);
          }
          const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
          navigate(`/onboarding?returnTo=${returnTo}`, { replace: true });
          return;
        }

        if (!data?.terms_accepted_at) {
          const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
          navigate(`/onboarding?returnTo=${returnTo}`, { replace: true });
          return;
        }

        setTermsChecked(true);
      } catch (error) {
        console.warn("[RequireTerms] Terms check failed / timed out:", error);
        // Do NOT redirect on timeout — let the gate fallback UI show
        // so the user can retry without losing their route.
      } finally {
        setChecking(false);
      }
    };

    checkTermsAccepted();
  }, [user, authLoading, navigate]);

  if (stuck && (authLoading || checking)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <p className="text-lg font-semibold">הטעינה נתקעה</p>
          <p className="text-sm text-muted-foreground">
            נראה שהחיבור לשרת איטי או לא זמין. נסי שוב, או התנתקי והתחברי מחדש.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              נסי שוב
            </button>
            <button
              onClick={async () => {
                try { await supabase.auth.signOut(); } catch {}
                window.location.href = '/auth';
              }}
              className="px-4 py-2 rounded-md border text-sm font-medium"
            >
              התנתקי והתחברי שוב
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  if (!termsChecked) {
    // useEffect above already triggers the redirect; render nothing here
    // (calling navigate() during render is a React anti-pattern).
    return null;
  }

  return <>{children}</>;
};

export default RequireTerms;

// Export mock profile for use in components that need profile data
export { MOCK_DEV_PROFILE };
