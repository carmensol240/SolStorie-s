import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Thin line with a small star — the gentle ornament above and below the text. */
function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3 text-paper-gold" aria-hidden="true">
      <span className="h-px w-16 md:w-24 bg-paper-gold/50" />
      <span className="text-lg leading-none">✦</span>
      <span className="h-px w-16 md:w-24 bg-paper-gold/50" />
    </div>
  );
}

interface TextOnlyPageProps {
  text: string;
  fontClass: string;
  pageLabel?: string;
  controls?: ReactNode;
  className?: string;
}

/**
 * A story page without a picture (or the text half of the wide open-book spread):
 * text centred on light paper with a small ornament, so it never looks like a broken page.
 */
export function TextOnlyPage({ text, fontClass, pageLabel, controls, className }: TextOnlyPageProps) {
  return (
    <div className={cn("relative w-full h-full bg-paper text-paper-foreground flex flex-col items-center justify-center overflow-y-auto px-6 md:px-12 py-12", className)} dir="rtl">
      {controls && <div className="absolute top-3 left-3 z-20">{controls}</div>}
      <div className="max-w-xl w-full flex flex-col items-center gap-6 my-auto">
        <Ornament />
        <p className={cn("font-bold whitespace-pre-line text-center", fontClass)} style={{ lineHeight: 1.8 }}>
          {text}
        </p>
        <Ornament />
      </div>
      {pageLabel && (
        <span className="absolute bottom-2 left-0 right-0 text-center text-sm font-semibold text-paper-foreground/60">{pageLabel}</span>
      )}
    </div>
  );
}
