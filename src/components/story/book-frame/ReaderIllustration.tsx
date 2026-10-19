import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getPublicIllustrationUrl, getReadingIllustrationUrl } from "@/lib/illustration-url";

interface ReaderIllustrationProps {
  path: string;
  alt?: string;
  className?: string;
}

/**
 * On-screen illustration for the reader: shows the small WebP reading copy,
 * whole (object-contain, never cropped), with a soft skeleton while loading.
 * Falls back to the original file if the reading copy fails, then retries.
 */
export const ReaderIllustration: React.FC<ReaderIllustrationProps> = ({ path, alt = "איור", className }) => {
  const [useOriginal, setUseOriginal] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setUseOriginal(false);
    setRetry(0);
    setLoaded(false);
  }, [path]);

  const base = useOriginal ? getPublicIllustrationUrl(path) : getReadingIllustrationUrl(path);
  const src = base ? `${base}${retry ? `${base.includes("?") ? "&" : "?"}retry=${retry}` : ""}` : "";

  return (
    <div className={cn("absolute inset-0 flex items-center justify-center", className)}>
      {!loaded && (
        <div
          className="w-full max-h-full aspect-[1408/768] rounded-xl bg-paper-muted animate-pulse"
          aria-label="טוען איור"
        />
      )}
      <img
        key={src}
        src={src}
        alt={alt}
        decoding="async"
        // eslint-disable-next-line react/no-unknown-property
        fetchpriority="high"
        className={cn(
          "max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-md transition-opacity duration-300",
          loaded ? "opacity-100" : "absolute opacity-0",
        )}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!useOriginal) {
            setUseOriginal(true);
          } else if (retry < 3) {
            setTimeout(() => setRetry((r) => r + 1), 2000);
          }
        }}
      />
    </div>
  );
};

export default ReaderIllustration;
