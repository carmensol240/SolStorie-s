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
