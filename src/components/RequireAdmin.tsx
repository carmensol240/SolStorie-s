import { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface RequireAdminProps {
  children: ReactNode;
}

/**
 * Route guard that allows only authenticated users with the 'admin' role
 * (as defined in public.user_roles) to access the wrapped page.
 * Unauthenticated users are redirected to /auth; non-admin users are
 * redirected to the home page.
 */
const RequireAdmin = ({ children }: RequireAdminProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      if (authLoading) return;
      if (!user) {
        navigate("/auth", { replace: true });
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error || !data) {
        setIsAdmin(false);
        navigate("/", { replace: true });
        return;
      }
      setIsAdmin(true);
    };
    check();
  }, [user, authLoading, navigate]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-muted-foreground">בודק הרשאות...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;
  return <>{children}</>;
};

export default RequireAdmin;