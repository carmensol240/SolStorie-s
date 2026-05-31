import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { isDevModeEnabled, MOCK_DEV_PROFILE } from "@/hooks/use-dev-mode";

interface RequireTermsProps {
  children: ReactNode;
}

const RequireTerms = ({ children }: RequireTermsProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [termsChecked, setTermsChecked] = useState(false);
  const [checking, setChecking] = useState(true);

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
        const { data, error } = await supabase
          .from("profiles")
          .select("terms_accepted_at")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking terms:", error);
          // If profile doesn't exist yet, redirect to auth with consent step
          navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }

        if (!data?.terms_accepted_at) {
          const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
          navigate(`/onboarding?returnTo=${returnTo}`, { replace: true });
          return;
        }

        setTermsChecked(true);
      } catch (error) {
        console.error("Error checking terms:", error);
        navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      } finally {
        setChecking(false);
      }
    };

    checkTermsAccepted();
  }, [user, authLoading, navigate]);

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
