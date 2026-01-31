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
        const currentPath = window.location.pathname + window.location.search;
        localStorage.setItem('returnTo', currentPath);
        navigate(`/auth?returnTo=${encodeURIComponent(currentPath)}`);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("terms_accepted_at")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error checking terms:", error);
          // If profile doesn't exist yet, redirect to auth with consent step
          navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }

        if (!data?.terms_accepted_at) {
          navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
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
    return null;
  }

  return <>{children}</>;
};

export default RequireTerms;

// Export mock profile for use in components that need profile data
export { MOCK_DEV_PROFILE };
