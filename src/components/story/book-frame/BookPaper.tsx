import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getReadingIllustrationUrl } from "@/lib/illustration-url";
import { accentFromPixels } from "@/lib/illustration-accent";

/** Accent color sampled from the page picture (falls back to the paper gold token). */
export function useIllustrationAccent(path: string | null | undefined): string {
  const [accent, setAccent] = useState<string>("hsl(var(--paper-gold))");
  useEffect(() => {
    setAccent("hsl(var(--paper-gold))");
    const url = path ? getReadingIllustrationUrl(path) : null;
    if (!url || typeof document === "undefined") return;
    let alive = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 24; c.height = 24;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 24, 24);
        const color = accentFromPixels(ctx.getImageData(0, 0, 24, 24).data);
        if (alive && color) setAccent(color);
      } catch { /* tainted canvas → keep gold */ }
    };
    img.src = url;
    return () => { alive = false; };
  }, [path]);
  return accent;
}

const Star: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden="true">
    <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" />
  </svg>
);

/** Light paper background with a very faint, blurred wash of the page picture. */
export const BookPaper: React.FC<{ illustrationPath?: string | null; className?: string; children: React.ReactNode }> = ({ illustrationPath, className, children }) => {
  const bg = illustrationPath ? getReadingIllustrationUrl(illustrationPath) : null;
  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-paper text-paper-foreground", className)}>
      {bg && (
        <div aria-hidden="true" className="absolute -inset-10 bg-cover bg-center opacity-35 blur-2xl" style={{ backgroundImage: `url("${bg}")` }} />
      )}
      <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, hsl(var(--paper) / 0.92) 45%, hsl(var(--paper) / 0.7))" }} />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
};

/** Gold frame with a star on top and three small stars at the bottom (text page decoration). */
export const BookTextFrame: React.FC<{ accent: string }> = ({ accent }) => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-3.5 md:inset-5 rounded-2xl border-2" style={{ borderColor: `color-mix(in srgb, ${accent} 35%, transparent)` }}>
    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-paper px-2"><Star color={accent} className="h-6 w-6" /></div>
    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex items-end gap-1.5 bg-paper px-2">
      <Star color={accent} className="h-3 w-3" /><Star color={accent} className="h-4 w-4" /><Star color={accent} className="h-3 w-3" />
    </div>
  </div>
);
