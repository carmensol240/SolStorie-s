import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollHintTextProps {
  className?: string;
  children: React.ReactNode;
  /** Changes when the page/text/size changes, to re-measure and scroll to top. */
  resetKey?: unknown;
}

/**
 * Scrollable text area that shows a fade to the paper color and a small down
 * arrow while more text is hidden below; both disappear at the end.
 */
export const ScrollHintText: React.FC<ScrollHintTextProps> = ({ className, children, resetKey }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = 0;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [resetKey, measure]);

  return (
    <div className="relative min-h-0 flex flex-col flex-initial lg:h-full">
      <div ref={ref} data-story-scroll onScroll={measure} className={cn("min-h-0 overflow-y-auto", className)}>
        {children}
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
