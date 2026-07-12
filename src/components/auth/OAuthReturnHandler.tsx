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
    let consumed = false;

    const consumeReturnTo = () => {
      if (consumed) return;

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

      const currentPath = window.location.pathname + window.location.search;
      if (raw === currentPath) return;

      consumed = true;
      navigate(raw, { replace: true });
    };

    // Immediate session check — handles the case where Supabase has already
    // restored the session by the time this listener mounts (e.g. after the
    // OAuth redirect lands on /auth and the page reloads).
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session) consumeReturnTo();
      })
      .catch((err) => {
        console.warn('[OAuthReturnHandler] getSession() rejected:', err);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle SIGNED_IN (in-app sign-in), TOKEN_REFRESHED, and INITIAL_SESSION
      // when a session is restored on a fresh page load (e.g. after Supabase
      // redirects back from Google OAuth).
      if (
        event !== "SIGNED_IN" &&
        event !== "TOKEN_REFRESHED" &&
        !(event === "INITIAL_SESSION" && session)
      ) {
        return;
      }
      if (!session) return;
      consumeReturnTo();
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname, location.search]);

  return null;
};

export default OAuthReturnHandler;
