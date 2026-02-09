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
      {/* Loading placeholder with animated gradient */}
      {!imageLoaded && !hasError && (
        <div className={cn('absolute inset-0 flex items-center justify-center', className)} aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 animate-pulse" />
          <div className="relative z-10 text-center text-purple-400">
            <svg className="w-10 h-10 mx-auto mb-1 animate-spin opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.49-8.49l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.49 8.49l2.83 2.83" />
            </svg>
            <p className="text-xs">טוען...</p>
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
