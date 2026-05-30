import { RefObject, useLayoutEffect } from "react";

/**
 * Shrinks the font-size of `textRef` until its content fits inside
 * `containerRef` without vertical overflow (no scroll needed).
 *
 * - Resets to the natural CSS font-size on every run, then steps down 1px at a time.
 * - Stops at `minPx` (default 11).
 * - Re-runs whenever `deps` change or the container resizes.
 */
export function useAutoFitText(
  containerRef: RefObject<HTMLElement | null>,
  textRef: RefObject<HTMLElement | null>,
  deps: ReadonlyArray<unknown>,
  options?: { minPx?: number; stepPx?: number }
) {
  const minPx = options?.minPx ?? 11;
  const stepPx = options?.stepPx ?? 1;

  useLayoutEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const fit = () => {
      // Guard: refs may have been cleared if the component unmounted
      // between scheduling and execution (common on mobile WebKit where
      // ResizeObserver callbacks can fire after unmount).
      const c = containerRef.current;
      const t = textRef.current;
      if (!c || !t) return;

      // Reset to the natural size defined by classes/inline parent styles.
      t.style.fontSize = "";
      const base = parseFloat(getComputedStyle(t).fontSize);
      if (!Number.isFinite(base) || base <= 0) return;

      let current = base;
      let guard = 0;
      // Allow a 1px tolerance to avoid sub-pixel jitter.
      while (
        c.scrollHeight > c.clientHeight + 1 &&
        current > minPx &&
        guard < 120
      ) {
        current -= stepPx;
        t.style.fontSize = `${current}px`;
        guard++;
      }
    };

    fit();

    let disposed = false;
    const ro = new ResizeObserver(() => {
      if (disposed) return;
      if (!containerRef.current || !textRef.current) return;
      fit();
    });
    try {
      ro.observe(container);
    } catch {
      // ResizeObserver can throw in older WebKit if element is detached
    }
    return () => {
      disposed = true;
      try { ro.disconnect(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}