import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollHintTextProps {
  className?: string;
  children: React.ReactNode;
  /** Changes when the page/text/size changes, to re-measure and scroll to top. */
  resetKey?: unknown;
  /**
   * When set, the text (elements marked data-fit-text) steps its font size down
   * until it fits the box, never below this many px. Scrolls only if still too tall.
   */
  fitMinPx?: number;
}

const FIT_STEP_PX = 1;

/**
 * Scrollable text area that shows a fade to the paper color and a small down
 * arrow while more text is hidden below; both disappear at the end.
 * Content is centered "safely" (margin-block auto on the inner text), so any
 * overflow only goes downward and stays scrollable.
 */
export const ScrollHintText: React.FC<ScrollHintTextProps> = ({ className, children, resetKey, fitMinPx }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  const fitting = useRef(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  }, []);

  const fit = useCallback(() => {
    const el = ref.current;
    if (!el || !fitMinPx || fitting.current) return;
    const targets = Array.from(el.querySelectorAll<HTMLElement>("[data-fit-text]"));
    if (!targets.length || el.clientHeight === 0) return;
    fitting.current = true;
    targets.forEach((t) => (t.style.fontSize = ""));
    let size = parseFloat(getComputedStyle(targets[0]).fontSize) || 0;
    while (el.scrollHeight > el.clientHeight + 1 && size - FIT_STEP_PX >= fitMinPx) {
      size -= FIT_STEP_PX;
      targets.forEach((t) => (t.style.fontSize = `${size}px`));
    }
    fitting.current = false;
  }, [fitMinPx]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = 0;
    fit();
    measure();
    let lastH = el.clientHeight;
    let lastW = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientHeight !== lastH || el.clientWidth !== lastW) {
        lastH = el.clientHeight;
        lastW = el.clientWidth;
        fit();
      }
      measure();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [resetKey, measure, fit]);

  return (
    <div className="relative min-h-0 flex flex-col flex-1">
      <div ref={ref} data-story-scroll onScroll={measure} className={cn("min-h-0 flex-1 overflow-y-auto flex flex-col", className)}>
        <div className="my-auto">{children}</div>
      </div>
      {more && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-paper via-paper/85 to-transparent flex items-end justify-center pb-12 lg:pb-14" data-testid="more-text-hint">
          <ChevronDown className="w-6 h-6 text-paper-foreground/70 animate-bounce" aria-label="יש עוד טקסט למטה" />
        </div>
      )}
    </div>
  );
};

export default ScrollHintText;
