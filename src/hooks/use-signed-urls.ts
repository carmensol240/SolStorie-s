import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SignedUrlCache {
  url: string;
  expiresAt: number;
}

// Global cache for signed URLs (shared across components)
const urlCache = new Map<string, SignedUrlCache>();

// Cache duration: 50 minutes (URLs expire in 60 minutes)
const CACHE_DURATION = 50 * 60 * 1000;

export const useSignedUrls = () => {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const pendingRequests = useRef<Set<string>>(new Set());

  // Clean expired cache entries periodically
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      for (const [key, value] of urlCache.entries()) {
        if (value.expiresAt < now) {
          urlCache.delete(key);
        }
      }
    };
    
    const interval = setInterval(cleanup, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // Extract storage path from a Supabase storage URL
  const extractPathFromUrl = useCallback((url: string): string | null => {
    if (!url) return null;
    
    try {
      // Handle full Supabase storage URLs
      // Format: https://xxx.supabase.co/storage/v1/object/public/story-illustrations/uuid/page-1.png
      const match = url.match(/story-illustrations\/([^?]+)/);
      if (match) {
        return match[1];
      }
      
      // If it's already just a path
      if (url.match(/^[a-f0-9-]+\/page-\d+\.png$/)) {
        return url;
      }
      
      return null;
    } catch {
      return null;
    }
  }, []);

  // Get a signed URL, using cache if available
  const getSignedUrl = useCallback((originalUrl: string): string | null => {
    const path = extractPathFromUrl(originalUrl);
    if (!path) return originalUrl; // Return original if we can't extract path
    
    const cached = urlCache.get(path);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }
    
    // Return the locally cached state if available
    return signedUrls[path] || null;
  }, [signedUrls, extractPathFromUrl]);

  // Fetch signed URLs for multiple paths
  const fetchSignedUrls = useCallback(async (
    urls: string[],
    storyId?: string,
    shareToken?: string
  ): Promise<Record<string, string>> => {
    const now = Date.now();
    const pathsToFetch: string[] = [];
    const result: Record<string, string> = {};

    // Check cache first
    for (const url of urls) {
      const path = extractPathFromUrl(url);
      if (!path) {
        result[url] = url; // Keep original URL if can't extract path
        continue;
      }

      const cached = urlCache.get(path);
      if (cached && cached.expiresAt > now) {
        result[url] = cached.url;
      } else if (!pendingRequests.current.has(path)) {
        pathsToFetch.push(path);
        pendingRequests.current.add(path);
      }
    }

    if (pathsToFetch.length === 0) {
      return result;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('get-signed-illustration-url', {
        body: { 
          paths: pathsToFetch, 
          storyId,
          shareToken 
        },
      });

      if (error) {
        console.error('Error fetching signed URLs:', error);
        // Return original URLs on error
        for (const url of urls) {
          if (!result[url]) {
            result[url] = url;
          }
        }
        return result;
      }

      const signedUrlsData = data?.signedUrls || {};
      
      // Update cache and result
      for (const [path, signedUrl] of Object.entries(signedUrlsData)) {
        urlCache.set(path, {
          url: signedUrl as string,
          expiresAt: now + CACHE_DURATION,
        });
        
        // Map back to original URLs
        for (const url of urls) {
          if (extractPathFromUrl(url) === path) {
            result[url] = signedUrl as string;
          }
        }
      }

      // Update local state
      setSignedUrls(prev => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(signedUrlsData).map(([path, url]) => [path, url as string])
        ),
      }));

    } catch (err) {
      console.error('Error in fetchSignedUrls:', err);
    } finally {
      // Clear pending requests
      for (const path of pathsToFetch) {
        pendingRequests.current.delete(path);
      }
      setIsLoading(false);
    }

    // Fill in any missing URLs with originals
    for (const url of urls) {
      if (!result[url]) {
        result[url] = url;
      }
    }

    return result;
  }, [extractPathFromUrl]);

  // Clear cache (useful for logout)
  const clearCache = useCallback(() => {
    urlCache.clear();
    setSignedUrls({});
  }, []);

  return {
    getSignedUrl,
    fetchSignedUrls,
    isLoading,
    clearCache,
  };
};
