import { useState, useEffect } from 'react';
import { useSignedUrls } from '@/hooks/use-signed-urls';
import { cn } from '@/lib/utils';

interface SignedImageProps {
  src: string | null;
  alt?: string;
  className?: string;
  storyId?: string;
  shareToken?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

export const SignedImage = ({
  src,
  alt = '',
  className,
  storyId,
  shareToken,
  fallback,
  onLoad,
  onError,
}: SignedImageProps) => {
  const { fetchSignedUrls } = useSignedUrls();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    const fetchUrl = async () => {
      setIsLoading(true);
      setHasError(false);
      setImageLoaded(false);
      
      try {
        const urls = await fetchSignedUrls([src], storyId, shareToken);
        setSignedUrl(urls[src] || src);
      } catch (err) {
        console.error('Error fetching signed URL:', err);
        // Fallback to original URL on error
        setSignedUrl(src);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUrl();
  }, [src, storyId, shareToken, fetchSignedUrls]);

  // No source provided - show fallback or nothing
  if (!src) {
    return fallback ? <>{fallback}</> : null;
  }

  // Loading state - show skeleton
  if (isLoading) {
    return (
      <div className={cn('animate-pulse bg-muted', className)} />
    );
  }

  // Error state with fallback available
  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  // Generate a meaningful alt text if none provided
  const effectiveAlt = alt || 'איור מהסיפור';

  return (
    <div className={cn('relative overflow-hidden', className)} role="img" aria-label={effectiveAlt}>
      {/* Loading placeholder with heart-shield illustration */}
      {!imageLoaded && !hasError && (
        <div className={cn('absolute inset-0 flex items-center justify-center', className)} aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFFBF5] via-[#F5E6D3] to-[#FAF3E8]" />
          <div className="relative z-10 text-center">
            {/* Heart-shaped shield placeholder */}
            <svg className="w-16 h-16 mx-auto mb-2 opacity-30" viewBox="0 0 64 64" fill="none">
              {/* Shield shape */}
              <path d="M32 6 L54 16 L54 32 C54 44 44 54 32 58 C20 54 10 44 10 32 L10 16 Z" fill="url(#shieldGrad)" stroke="#C4A882" strokeWidth="1.5"/>
              {/* Heart inside shield */}
              <path d="M32 44 C26 38 20 34 20 28 C20 24 23 22 26 22 C28.5 22 30.5 23.5 32 25.5 C33.5 23.5 35.5 22 38 22 C41 22 44 24 44 28 C44 34 38 38 32 44Z" fill="#E8B4B8" opacity="0.7"/>
              <defs>
                <linearGradient id="shieldGrad" x1="10" y1="6" x2="54" y2="58">
                  <stop offset="0%" stopColor="#D4B896" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#C4A070" stopOpacity="0.2"/>
                </linearGradient>
              </defs>
            </svg>
            <p className="text-xs text-[#8B7355] font-serif opacity-50">טוען איור...</p>
          </div>
        </div>
      )}
      <img
        src={signedUrl || src}
        alt={effectiveAlt}
        loading="lazy"
        onLoad={() => {
          setImageLoaded(true);
          setHasError(false);
          onLoad?.();
        }}
        onError={() => {
          setHasError(true);
          setImageLoaded(false);
          onError?.();
        }}
        className={cn(
          'transition-opacity duration-500',
          imageLoaded ? 'opacity-100' : 'opacity-0',
          hasError && fallback ? 'hidden' : '',
          className
        )}
      />
    </div>
  );
};
