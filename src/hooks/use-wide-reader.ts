import { useEffect, useState } from "react";

/** Desktop, tablet, or a phone held sideways → show the story as an open book. */
export const WIDE_READER_QUERY = "(min-width: 1024px), (orientation: landscape) and (min-width: 640px)";

export function useWideReader(): boolean {
  const get = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(WIDE_READER_QUERY).matches;
  const [wide, setWide] = useState<boolean>(get);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(WIDE_READER_QUERY);
    const on = () => setWide(mql.matches);
    on();
    if (mql.addEventListener) mql.addEventListener("change", on);
    else mql.addListener(on);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", on);
      else mql.removeListener(on);
    };
  }, []);
  return wide;
}
