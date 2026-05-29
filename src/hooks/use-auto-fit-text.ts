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
      // Reset to the natural size defined by classes/inline parent styles.
      textEl.style.fontSize = "";
      const base = parseFloat(getComputedStyle(textEl).fontSize);
      if (!Number.isFinite(base) || base <= 0) return;

      let current = base;
      let guard = 0;
      // Allow a 1px tolerance to avoid sub-pixel jitter.
      while (
        container.scrollHeight > container.clientHeight + 1 &&
        current > minPx &&
        guard < 120
      ) {
        current -= stepPx;
        textEl.style.fontSize = `${current}px`;
        guard++;
      }
    };

    fit();

    const ro = new ResizeObserver(() => fit());
    ro.observe(container);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}