## Goal
Remember the user's photo-consent approval across sessions. After the first time they check "אני מסכים/ה לשימוש בתמונה לצורך יצירת איורי הסיפור בלבד", store it on their profile. On future visits the checkbox is pre-checked automatically and they don't have to re-approve.

## Changes

### 1. Database (migration)
Add a new column to the `profiles` table:
- `photo_consent_at` (`timestamptz`, nullable) — timestamp of the user's first approval. `NULL` means not yet consented.

No RLS changes needed (existing "Users can update their own profile" policy already covers it).

### 2. `src/components/wizard/ChildInfoStep.tsx` (only file touched)
- In the existing `useEffect` that fetches the profile (the one already reading `display_name`), also select `photo_consent_at`. If it's non-null, call `updateFormData({ photoConsent: true })` so the checkbox starts checked.
- Wrap the checkbox's `onCheckedChange` so that when it transitions to `true` and the profile doesn't yet have a `photo_consent_at`, write `photo_consent_at = now()` to the user's profile row (fire-and-forget, no UI blocking). Keep the local `updateFormData({ photoConsent: c === true })` call unchanged.
- No other UI, styling, or logic changes.

## Notes
- Unauthenticated users keep the current in-memory behavior (nothing to persist).
- Unchecking the box in the same session does not clear the stored consent — once given, it stays approved (matches the user's requirement of "do not require them to check it again").
