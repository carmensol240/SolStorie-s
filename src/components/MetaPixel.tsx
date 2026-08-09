import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fires a Meta Pixel PageView on every client-side route change.
 * The initial PageView is fired by the base code in index.html,
 * so the first render is skipped to avoid double counting.
 */
const MetaPixel = () => {
  const { pathname, search } = useLocation();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    try {
      window.fbq?.("track", "PageView");
    } catch {
      // Pixel blocked or unavailable — ignore silently.
    }
  }, [pathname, search]);

  return null;
};

export default MetaPixel;