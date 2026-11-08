import React, { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { choosePhonePictureLayout, stackedPictureHeight, type PhonePictureLayout } from "@/lib/phone-picture-layout";

const LABEL_ROW_PX = 48;

interface PhonePictureTextPageProps {
  src: string;
  alt: string;
  loaded: boolean;
  onLoad: () => void;
  onError: () => void;
  /** Text already prepared for display (nikud on/off). Empty on the cover slide. */
  text: string;
  /** Age-based font size class (same one the reader used before). */
  fontClass: string;
  /** Inner height of the reading card when it fills the screen area (px). */
  cardHeight: number;
  /** Shown while the picture loads. */
  loadingFallback?: React.ReactNode;
  /** Title + dedication on the cover slide. */
  topOverlay?: React.ReactNode;
  /** Recording buttons (top left). */
  controls?: React.ReactNode;
  /** e.g. "3 / 8" */
  pageLabel?: React.ReactNode;
  onLayoutChange?: (layout: PhonePictureLayout) => void;
}

/**
 * Ages 0–4, portrait phone: the picture fills the card with the text on it (dark fade at the
 * bottom). If the text would cover more than a third of the card, the whole picture goes on top
 * and the text below on plain paper, and the card shrinks to its content.
 */
export const PhonePictureTextPage: React.FC<PhonePictureTextPageProps> = ({
  src, alt, loaded, onLoad, onError, text, fontClass, cardHeight,
  loadingFallback, topOverlay, controls, pageLabel, onLayoutChange,
}) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const [textHeight, setTextHeight] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const [ratio, setRatio] = useState<number | null>(null);
  const hasText = text.trim().length > 0;

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) { setTextHeight(0); return; }
    const measure = () => { setTextHeight(el.offsetHeight); setCardWidth(el.offsetWidth); };
    measure();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
    fonts?.ready?.then(measure).catch(() => {});
    return () => ro?.disconnect();
  }, [text, fontClass, hasText]);

  const layout: PhonePictureLayout = hasText ? choosePhonePictureLayout(textHeight, cardHeight) : "cover";

  useLayoutEffect(() => {
    onLayoutChange?.(layout);
  }, [layout, onLayoutChange]);

  const textBlock = (light: boolean) => (
    <div className="p-4" dir="rtl">
      <div className="max-w-lg mx-auto text-center">
        <p
          className={cn(
            "font-bold whitespace-pre-line",
            light ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]" : "text-paper-foreground",
            fontClass,
          )}
          style={{ lineHeight: "1.8", padding: "12px 16px", overflowWrap: "break-word" }}
        >
          {text}
        </p>
      </div>
    </div>
  );

  const img = (className: string) => (
    <img
      src={src}
      alt={alt}
      loading="eager"
      className={cn("absolute inset-0 w-full h-full transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0", className)}
      onLoad={(e) => {
        const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
        if (w > 0 && h > 0) setRatio(w / h);
        onLoad();
      }}
      onError={onError}
    />
  );

  // Hidden copy of the text, used only to measure how tall it is at the card width.
  const measurer = hasText ? (
    <div ref={measureRef} aria-hidden className="absolute inset-x-0 top-0 invisible pointer-events-none">
      {textBlock(true)}
    </div>
  ) : null;

  if (layout === "stacked") {
    // Whole picture, full width; a tall (portrait) picture is shrunk (never cropped) so the
    // text still starts on screen.
    const pictureHeight = stackedPictureHeight({
      cardWidth, cardHeight, ratio: ratio ?? 1408 / 768, textHeight: textHeight + (pageLabel ? LABEL_ROW_PX : 0),
    });
    return (
      <div
        data-story-scroll
        data-testid="phone-picture-stacked"
        className="relative w-full overflow-y-auto bg-paper"
        style={{ maxHeight: cardHeight > 0 ? cardHeight : undefined }}
      >
        {measurer}
        <div
          className="relative w-full"
          style={pictureHeight ? { height: pictureHeight } : { aspectRatio: ratio ? String(ratio) : "1408 / 768" }}
        >
          {!loaded && loadingFallback}
          {img("object-contain")}
          {controls && <div className="absolute top-3 left-3 z-20">{controls}</div>}
        </div>
        {textBlock(false)}
        {pageLabel && (
          <div className="flex items-center justify-center" style={{ height: LABEL_ROW_PX }}>
            <span className="text-sm font-bold text-paper-foreground/80">{pageLabel}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0" data-testid="phone-picture-cover">
      {measurer}
      {!loaded && loadingFallback}
      {img("object-cover object-center")}
      {hasText && (
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/55 to-transparent z-[1] pointer-events-none" />
      )}
      {topOverlay}
      {hasText && <div className="absolute bottom-0 left-0 right-0 z-10">{textBlock(true)}</div>}
      {pageLabel && (
        <div className="absolute bottom-1 left-0 right-0 flex justify-center z-10">
          <span className="text-sm font-semibold text-white bg-black/45 rounded-full px-2.5 py-0.5">{pageLabel}</span>
        </div>
      )}
      {controls && <div className="absolute top-3 left-3 z-20">{controls}</div>}
    </div>
  );
};

export default PhonePictureTextPage;
