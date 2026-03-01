/**
 * Strips large base64 data URIs from children objects before saving to localStorage.
 * Keeps short HTTP URLs and storage paths intact.
 * The full avatar/photo data is already persisted in the database.
 */
export function stripBase64ForStorage(children: Record<string, any>[]): Record<string, any>[] {
  return children.map(child => {
    const cleaned = { ...child };
    for (const field of ['avatar_url', 'photo_url']) {
      const value = cleaned[field];
      if (typeof value === 'string' && value.startsWith('data:')) {
        cleaned[field] = null;
      }
    }
    return cleaned;
  });
}
