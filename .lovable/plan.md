

## Plan: Disable Google Sign-In Button

### Single file: `src/components/wizard/GeneratingStep.tsx`

**Lines 833–845** — Update the Google sign-in button:

1. Remove `onClick={handleGoogleSignIn}`
2. Add `disabled` attribute
3. Add `opacity-50 cursor-not-allowed` to className, remove `hover:bg-gray-50`
4. Change button text from `המשיכו עם Google` to `בקרוב 🔒`

No other changes.

