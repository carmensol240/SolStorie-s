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
    <div className={cn('relative', className)} role="img" aria-label={effectiveAlt}>
      {/* Show loading skeleton until image loads */}
      {!imageLoaded && !hasError && (
        <div className={cn('absolute inset-0 animate-pulse bg-muted', className)} aria-hidden="true" />
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
          'transition-opacity duration-300',
          imageLoaded ? 'opacity-100' : 'opacity-0',
          hasError && fallback ? 'hidden' : '',
          className
        )}
      />
    </div>
  );
};
