/**
 * User-scoped localStorage utility.
 * All personal data is stored under keys prefixed with the user's ID,
 * ensuring strict data isolation between different accounts.
 */

const USER_SCOPED_KEYS = [
  'savedChildren',
  'selected_child_id',
  'educator_welcome_dismissed',
] as const;

type ScopedKey = typeof USER_SCOPED_KEYS[number];

function scopedKey(userId: string, key: ScopedKey): string {
  return `user_${userId}_${key}`;
}

/** Read a user-scoped value from localStorage */
export function getUserData(userId: string | undefined, key: ScopedKey): string | null {
  if (!userId) return null;
  return localStorage.getItem(scopedKey(userId, key));
}

/** Write a user-scoped value to localStorage */
export function setUserData(userId: string | undefined, key: ScopedKey, value: string): void {
  if (!userId) return;
  localStorage.setItem(scopedKey(userId, key), value);
}

/** Remove a user-scoped value from localStorage */
export function removeUserData(userId: string | undefined, key: ScopedKey): void {
  if (!userId) return;
  localStorage.removeItem(scopedKey(userId, key));
}

/**
 * Clear ALL user-scoped data from localStorage on sign-out.
 * Also clears any legacy un-scoped keys to prevent data leakage.
 */
export function clearAllUserData(): void {
  // Clear legacy un-scoped keys
  for (const key of USER_SCOPED_KEYS) {
    localStorage.removeItem(key);
  }

  // Clear all user-scoped keys (user_*_*)
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('user_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));

  // Clear offline story cache
  localStorage.removeItem('storyteller_offline_cache');
}

/**
 * Migrate legacy un-scoped savedChildren to user-scoped key.
 * Called once on login to preserve existing data while fixing isolation.
 */
export function migrateToUserScoped(userId: string): void {
  const legacyChildren = localStorage.getItem('savedChildren');
  const userChildren = localStorage.getItem(scopedKey(userId, 'savedChildren'));
  
  // Only migrate if legacy data exists and user doesn't already have scoped data
  if (legacyChildren && !userChildren) {
    localStorage.setItem(scopedKey(userId, 'savedChildren'), legacyChildren);
  }
  // Always remove legacy key after migration
  localStorage.removeItem('savedChildren');

  // Migrate selected_child_id
  const legacySelectedChild = localStorage.getItem('selected_child_id');
  const userSelectedChild = localStorage.getItem(scopedKey(userId, 'selected_child_id'));
  if (legacySelectedChild && !userSelectedChild) {
    localStorage.setItem(scopedKey(userId, 'selected_child_id'), legacySelectedChild);
  }
  localStorage.removeItem('selected_child_id');

  // Migrate educator_welcome_dismissed
  const legacyEd = localStorage.getItem('educator_welcome_dismissed');
  const userEd = localStorage.getItem(scopedKey(userId, 'educator_welcome_dismissed'));
  if (legacyEd && !userEd) {
    localStorage.setItem(scopedKey(userId, 'educator_welcome_dismissed'), legacyEd);
  }
  localStorage.removeItem('educator_welcome_dismissed');
}
