/**
 * Strips large base64 data URIs from children objects before saving to localStorage.
 * Keeps short HTTP URLs and storage paths intact.
 * The full avatar/photo data is already persisted in the database.
 */
export function stripBase64ForStorage<T extends Record<string, any>>(children: T[]): T[] {
  return children.map(child => {
    const cleaned = { ...child };
    const fieldsToCheck = ['avatar_url', 'photo_url'] as const;
    for (const field of fieldsToCheck) {
      const value = cleaned[field];
      if (typeof value === 'string' && value.startsWith('data:')) {
        cleaned[field] = null as any;
      }
    }
    return cleaned;
  });
}
