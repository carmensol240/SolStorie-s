/**
 * Validates a returnTo URL parameter to prevent open redirect attacks.
 * Only allows relative paths within the application domain.
 * 
 * @param returnTo - The URL or path to validate
 * @param fallback - The fallback path if validation fails (default: '/')
 * @returns A safe relative path
 */
export function validateReturnTo(returnTo: string | null | undefined, fallback = '/'): string {
  // No value provided - use fallback
  if (!returnTo || typeof returnTo !== 'string') {
    return fallback;
  }

  const trimmed = returnTo.trim();

  // Empty string - use fallback
  if (trimmed.length === 0) {
    return fallback;
  }

  // Must start with a single forward slash (relative path)
  // Reject double slashes (protocol-relative URLs like //evil.com)
  // Reject absolute URLs (http://, https://, etc.)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  // Check for any URL scheme patterns that could be exploited
  // This catches javascript:, data:, vbscript:, etc.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(trimmed)) {
    return fallback;
  }

  // Reject paths containing backslashes (could be interpreted differently)
  if (trimmed.includes('\\')) {
    return fallback;
  }

  // Reject paths with encoded characters that could bypass validation
  // Decode and re-check to catch encoded malicious URLs
  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded.startsWith('//') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(decoded)) {
      return fallback;
    }
  } catch {
    // If decoding fails, the URL is malformed - reject it
    return fallback;
  }

  return trimmed;
}

/**
 * Stores a return path in localStorage after validation.
 * 
 * @param path - The path to store
 */
export function storeReturnTo(path: string): void {
  const validated = validateReturnTo(path);
  localStorage.setItem('returnTo', validated);
}

/**
 * Retrieves and validates the return path from localStorage.
 * Clears the stored value after retrieval.
 * 
 * @param fallback - The fallback path if no valid path is stored
 * @returns A safe relative path
 */
export function getStoredReturnTo(fallback = '/'): string {
  const stored = localStorage.getItem('returnTo');
  localStorage.removeItem('returnTo');
  return validateReturnTo(stored, fallback);
}
