/**
 * Converts an illustration path (relative or full URL) to a public URL.
 * The story-illustrations bucket is PUBLIC, so no signed URLs are needed.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qvdwmkxviaqcgmjotsxe.supabase.co';
const PUBLIC_BUCKET_BASE = `${SUPABASE_URL}/storage/v1/object/public/story-illustrations`;

export function getPublicIllustrationUrl(path: string | null): string | null {
  if (!path) return null;

  // Already a full URL — return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Relative path like "uuid/page-1.png" → build full public URL
  return `${PUBLIC_BUCKET_BASE}/${path}`;
}

const OBJECT_PUBLIC_MARKER = '/storage/v1/object/public/';
const RENDER_PUBLIC_MARKER = '/storage/v1/render/image/public/';

/**
 * Smaller, compressed copy for on-screen reading (~1000px wide, served as WebP
 * by the storage image service). Print/PDF must keep using getPublicIllustrationUrl.
 * Returns the original URL for anything that is not in our public storage.
 */
export function getReadingIllustrationUrl(path: string | null): string | null {
  const url = getPublicIllustrationUrl(path);
  if (!url || !url.includes(OBJECT_PUBLIC_MARKER)) return url;
  const [base, query] = url.split('?');
  const rendered = base.replace(OBJECT_PUBLIC_MARKER, RENDER_PUBLIC_MARKER);
  return `${rendered}?width=1000&quality=75${query ? `&${query}` : ''}`;
}
