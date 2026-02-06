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

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    const fetchUrl = async () => {
      setIsLoading(true);
      setHasError(false);
      
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

  if (!src) {
    return fallback ? <>{fallback}</> : null;
  }

  if (isLoading) {
    return (
      <div className={cn('animate-pulse bg-muted', className)} />
    );
  }

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={signedUrl || src}
      alt={alt}
      className={className}
      loading="lazy"
      onLoad={() => {
        setHasError(false);
        onLoad?.();
      }}
      onError={() => {
        setHasError(true);
        onError?.();
      }}
    />
  );
};
