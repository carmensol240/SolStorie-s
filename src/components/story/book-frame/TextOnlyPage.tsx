import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Phone screens lower than 700px: one size step smaller. The media query also requires a phone
 * width, so wide screens (and every `md:` size) are never affected. Literal class names for Tailwind.
 */
const SHORT_PHONE_STEP: Record<string, string> = {
  "text-xl": "[@media(max-width:767px)_and_(max-height:699px)]:text-lg",
  "text-2xl": "[@media(max-width:767px)_and_(max-height:699px)]:text-xl",
  "text-3xl": "[@media(max-width:767px)_and_(max-height:699px)]:text-2xl",
  "text-4xl": "[@media(max-width:767px)_and_(max-height:699px)]:text-3xl",
};

function shortPhoneStep(fontClass: string): string {
  return fontClass.split(/\s+/).map((c) => SHORT_PHONE_STEP[c]).filter(Boolean).join(" ");
}

/** Thin line with a small star — the gentle ornament above and below the text. */
function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3 text-paper-gold" aria-hidden="true">
      <span className="h-px w-16 md:w-24 bg-paper-gold/50 [@media(max-width:767px)_and_(max-height:699px)]:w-10" />
      <span className="text-lg leading-none [@media(max-width:767px)_and_(max-height:699px)]:text-sm">✦</span>
      <span className="h-px w-16 md:w-24 bg-paper-gold/50 [@media(max-width:767px)_and_(max-height:699px)]:w-10" />
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
 * text on light paper with a small ornament, so it never looks like a broken page.
 * Short text is centred (my-auto); long text starts at the top and scrolls — never
 * justify-center on the scroll box, which pushed the top out of reach on small phones.
 * Phones get extra top space so the microphone button never covers the first line, and the
 * page number sits below the text (in the flow) so long text never runs under it.
 */
export function TextOnlyPage({ text, fontClass, pageLabel, controls, className }: TextOnlyPageProps) {
  return (
    <div className={cn("relative w-full h-full bg-paper text-paper-foreground flex flex-col items-center overflow-y-auto px-6 md:px-12 pt-16 pb-3 md:py-12", className)} dir="rtl">
      {controls && <div className="absolute top-3 left-3 z-20">{controls}</div>}
      <div className="max-w-xl w-full flex flex-col items-center gap-6 my-auto [@media(max-width:767px)_and_(max-height:699px)]:gap-4">
        <Ornament />
        <p className={cn("font-bold whitespace-pre-line text-center", fontClass, shortPhoneStep(fontClass))} style={{ lineHeight: 1.8 }}>
          {text}
        </p>
        <Ornament />
      </div>
      {pageLabel && (
        <span className="mt-4 shrink-0 md:mt-0 md:absolute md:bottom-2 md:left-0 md:right-0 text-center text-sm font-semibold text-paper-foreground/60">{pageLabel}</span>
      )}
    </div>
  );
}
