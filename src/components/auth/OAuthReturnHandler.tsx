import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Global handler that consumes a `returnTo` value (set before an OAuth redirect)
 * once the user is signed in via Supabase. Reads from cookie `ss_return_to`
 * first (mobile-safe), then localStorage. Always clears both after consuming.
 */
const OAuthReturnHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle SIGNED_IN (in-app sign-in) and INITIAL_SESSION when a session is
      // restored on a fresh page load (e.g. after Supabase redirects back from
      // Google OAuth to the site root).
      if (event !== "SIGNED_IN" && !(event === "INITIAL_SESSION" && session)) {
        return;
      }

      // 1. URL query param (most reliable — survives the OAuth round-trip
      //    because Supabase redirects back to the exact `redirectTo` URL,
      //    including its query string).
      const urlReturnTo = new URLSearchParams(window.location.search).get("returnTo");

      // 2. Cookie (mobile-safer than localStorage across OAuth context switches)
      const cookieMatch = document.cookie.match(/(?:^|;\s*)ss_return_to=([^;]+)/);
      const cookieReturnTo = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;

      // 3. localStorage fallback
      let lsReturnTo: string | null = null;
      try { lsReturnTo = localStorage.getItem("returnTo"); } catch {}

      const raw = urlReturnTo || cookieReturnTo || lsReturnTo;

      // Always clear, regardless of whether we navigate
      try { localStorage.removeItem("returnTo"); } catch {}
      document.cookie = "ss_return_to=; Max-Age=0; Path=/; SameSite=Lax; Secure";

      if (!raw) return;

      // Open-redirect protection: only relative paths
      if (!raw.startsWith("/") || raw.startsWith("//")) return;

      const currentPath = location.pathname + location.search;
      if (raw === currentPath) return;

      navigate(raw, { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname, location.search]);

  return null;
};

export default OAuthReturnHandler;
